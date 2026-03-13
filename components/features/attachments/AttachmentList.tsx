'use client';

import {
  Download,
  Eye,
  FileIcon,
  FileText,
  Image,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Attachment } from '@/hooks/useFileUpload';
import { FilePreview } from './FilePreview';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('pdf') || mimeType.includes('document'))
    return FileText;
  return FileIcon;
}

interface AttachmentListProps {
  attachments: Attachment[];
  onDelete?: (id: string) => Promise<void>;
  getDownloadUrl?: (storagePath: string) => string | null;
}

export function AttachmentList({
  attachments,
  onDelete,
  getDownloadUrl,
}: AttachmentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
    null,
  );

  async function handleDelete(id: string) {
    if (!onDelete) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  }

  if (attachments.length === 0) return null;

  return (
    <>
      <div className='space-y-2'>
        <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
          Attachments ({attachments.length})
        </p>
        <ul className='space-y-1.5'>
          {attachments.map((a) => {
            const Icon = getFileIcon(a.mime_type);
            const canPreview =
              a.mime_type.startsWith('image/') ||
              a.mime_type === 'application/pdf';
            const url = getDownloadUrl?.(a.storage_path);

            return (
              <li
                key={a.id}
                className='flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm'
              >
                <Icon size={14} className='shrink-0 text-muted-foreground' />
                <span className='min-w-0 flex-1 truncate'>{a.file_name}</span>
                <span className='shrink-0 text-xs text-muted-foreground'>
                  {formatSize(a.file_size)}
                </span>

                {canPreview && (
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-6 w-6 p-0'
                    onClick={() => setPreviewAttachment(a)}
                    aria-label={`Preview ${a.file_name}`}
                  >
                    <Eye size={14} />
                  </Button>
                )}

                {url && (
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-6 w-6 p-0'
                    asChild
                  >
                    <a
                      href={url}
                      download={a.file_name}
                      aria-label={`Download ${a.file_name}`}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <Download size={14} />
                    </a>
                  </Button>
                )}

                {onDelete && (
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-6 w-6 p-0 text-destructive hover:bg-destructive/10'
                    onClick={() => handleDelete(a.id)}
                    disabled={deletingId === a.id}
                    aria-label={`Delete ${a.file_name}`}
                  >
                    {deletingId === a.id ? (
                      <Loader2 size={14} className='animate-spin' />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {previewAttachment && (
        <FilePreview
          attachment={previewAttachment}
          downloadUrl={getDownloadUrl?.(previewAttachment.storage_path) ?? null}
          onClose={() => setPreviewAttachment(null)}
        />
      )}
    </>
  );
}
