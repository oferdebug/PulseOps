/** biome-ignore-all lint/a11y/useKeyWithClickEvents: drop zone needs click */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: upload list keys */
'use client';

import {
  AlertCircle,
  CheckCircle2,
  FileIcon,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { AttachmentEntityType } from '@/hooks/useFileUpload';
import { useFileUpload } from '@/hooks/useFileUpload';

interface FileUploadProps {
  entityType: AttachmentEntityType;
  entityId: string;
  /** Maximum file size in megabytes */
  maxSizeMB?: number;
  maxFiles?: number;
  accept?: string;
  disabled?: boolean;
  onUploadComplete?: (attachmentId: string) => void;
}

export default function FileUpload({
  entityType,
  entityId,
  maxSizeMB = 10,
  maxFiles: _maxFiles = 5,
  accept,
  disabled = false,
  onUploadComplete,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { attachments, uploads, error, uploadFile, deleteAttachment } =
    useFileUpload(entityType, entityId);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          alert(`${file.name} exceeds the ${maxSizeMB}MB limit.`);
          continue;
        }
        const result = await uploadFile(file);
        if (result && onUploadComplete) {
          onUploadComplete(result.id);
        }
      }
    },
    [maxSizeMB, uploadFile, onUploadComplete],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [disabled, handleFiles],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        e.target.value = '';
      }
    },
    [handleFiles],
  );

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className='space-y-3'>
      {/* Drop zone */}
      {/** biome-ignore lint/a11y/noStaticElementInteractions: drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors
          ${isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <Upload size={24} className='mb-2 text-muted-foreground' />
        <p className='text-sm text-muted-foreground'>
          {isDragOver
            ? 'Drop files here'
            : 'Drag & drop files, or click to browse'}
        </p>
        <p className='mt-1 text-xs text-muted-foreground/60'>
          Max {maxSizeMB}MB per file
        </p>
        <input
          ref={inputRef}
          type='file'
          multiple
          accept={accept}
          onChange={onFileChange}
          className='hidden'
          disabled={disabled}
        />
      </div>

      {/* Error */}
      {error && (
        <p className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
          {error}
        </p>
      )}

      {/* Upload progress */}
      {uploads.length > 0 && (
        <ul className='space-y-2'>
          {uploads.map((u, i) => (
            <li
              key={i}
              className='flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm'
            >
              {u.status === 'uploading' && (
                <Loader2 size={14} className='animate-spin text-primary' />
              )}
              {u.status === 'success' && (
                <CheckCircle2 size={14} className='text-green-500' />
              )}
              {u.status === 'error' && (
                <AlertCircle size={14} className='text-destructive' />
              )}
              <span className='flex-1 truncate'>{u.file.name}</span>
              <span className='text-xs text-muted-foreground'>
                {formatSize(u.file.size)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Attached files */}
      {attachments.length > 0 && (
        <ul className='space-y-2'>
          {attachments.map((a) => (
            <li
              key={a.id}
              className='flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm'
            >
              <FileIcon size={14} className='text-muted-foreground' />
              <span className='flex-1 truncate'>{a.file_name}</span>
              <span className='text-xs text-muted-foreground'>
                {formatSize(a.file_size)}
              </span>
              <Button
                variant='ghost'
                size='sm'
                className='h-6 w-6 p-0 text-destructive hover:bg-destructive/10'
                onClick={(e) => {
                  e.stopPropagation();
                  deleteAttachment(a.id);
                }}
                disabled={disabled}
              >
                <X size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
