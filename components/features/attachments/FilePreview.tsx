'use client';

import { Download, X } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { Attachment } from '@/hooks/useFileUpload';

interface FilePreviewProps {
  attachment: Attachment;
  downloadUrl: string | null;
  onClose: () => void;
}

export function FilePreview({
  attachment,
  downloadUrl,
  onClose,
}: FilePreviewProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const isImage = attachment.mime_type.startsWith('image/');
  const isPdf = attachment.mime_type === 'application/pdf';

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'>
      {/* Backdrop click to close */}
      <button
        type='button'
        className='absolute inset-0'
        onClick={onClose}
        aria-label='Close preview'
      />

      <div className='relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-border bg-background shadow-xl'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-border px-4 py-3'>
          <p className='min-w-0 flex-1 truncate text-sm font-medium'>
            {attachment.file_name}
          </p>
          <div className='flex items-center gap-2'>
            {downloadUrl && (
              <Button variant='ghost' size='sm' className='h-7 gap-1' asChild>
                <a
                  href={downloadUrl}
                  download={attachment.file_name}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <Download className='h-3.5 w-3.5' />
                  Download
                </a>
              </Button>
            )}
            <Button
              variant='ghost'
              size='sm'
              className='h-7 w-7 p-0'
              onClick={onClose}
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-auto p-4'>
          {isImage && downloadUrl && (
            // biome-ignore lint/performance/noImgElement: dynamic external Supabase URL
            <img
              src={downloadUrl}
              alt={attachment.file_name}
              className='mx-auto max-h-[70vh] rounded object-contain'
            />
          )}
          {isPdf && downloadUrl && (
            <iframe
              src={downloadUrl}
              title={attachment.file_name}
              className='h-[70vh] w-full rounded border-0'
            />
          )}
          {!isImage && !isPdf && (
            <p className='py-12 text-center text-sm text-muted-foreground'>
              Preview not available for this file type.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
