'use client';

import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type AttachmentEntityType =
  | 'ticket'
  | 'ticket_comment'
  | 'article'
  | 'user_profile';

export interface Attachment {
  id: string;
  entity_type: AttachmentEntityType;
  entity_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  uploaded_by: string | null;
  uploaded_at: string;
  description?: string | null;
  deleted_at?: string | null;
}

export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  attachmentId?: string;
}

export function useFileUpload(
  entityType: AttachmentEntityType,
  entityId: string,
) {
  const [uploads, setUploads] = useState<FileUploadProgress[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing attachments for this entity
  const fetchAttachments = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('attachments')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false });

    if (err) setError(err.message);
    else setAttachments(data as Attachment[]);
    setLoading(false);
  }, [entityType, entityId]);

  // Upload a single file
  async function uploadFile(file: File): Promise<Attachment | null> {
    const index = uploads.length;
    const entry: FileUploadProgress = {
      file,
      progress: 0,
      status: 'uploading',
    };

    setUploads((prev) => [...prev, entry]);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Build a unique storage path
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${entityType}/${entityId}/${timestamp}_${safeName}`;

      // Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('attachments')
        .upload(storagePath, file, { contentType: file.type });

      if (uploadErr) throw new Error(uploadErr.message);

      // Insert metadata row
      const { data: row, error: insertErr } = await supabase
        .from('attachments')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          storage_path: storagePath,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (insertErr) throw new Error(insertErr.message);

      const attachment = row as Attachment;

      // Update progress to success
      setUploads((prev) =>
        prev.map((u, i) =>
          i === index
            ? {
                ...u,
                progress: 100,
                status: 'success',
                attachmentId: attachment.id,
              }
            : u,
        ),
      );

      setAttachments((prev) => [attachment, ...prev]);
      return attachment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      setUploads((prev) =>
        prev.map((u, i) =>
          i === index ? { ...u, status: 'error', error: message } : u,
        ),
      );
      return null;
    }
  }

  // Delete an attachment
  async function deleteAttachment(attachmentId: string): Promise<boolean> {
    const target = attachments.find((a) => a.id === attachmentId);
    if (!target) return false;

    try {
      const supabase = createClient();

      // Remove from storage
      const { error: storageErr } = await supabase.storage
        .from('attachments')
        .remove([target.storage_path]);
      if (storageErr) throw new Error(storageErr.message);

      // Remove DB row
      const { error: err } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId);

      if (err) throw new Error(err.message);

      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      return false;
    }
  }

  // Clear completed/errored uploads from the list
  function clearUploads() {
    setUploads((prev) => prev.filter((u) => u.status === 'uploading'));
  }

  return {
    attachments,
    uploads,
    loading,
    error,
    uploadFile,
    deleteAttachment,
    fetchAttachments,
    clearUploads,
  };
}
