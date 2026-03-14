# Component Structure Guide

Quick reference for where to create new components and how to organize them.

## 📁 Directory Structure

```text
components/
├── ui/                    # Reusable UI primitives (already exists)
├── features/             # Feature-specific components (create this)
│   ├── attachments/
│   │   ├── FileUpload.tsx
│   │   ├── FilePreview.tsx
│   │   ├── AttachmentList.tsx
│   │   └── AttachmentCard.tsx
│   ├── comments/
│   │   ├── CommentSection.tsx
│   │   ├── CommentInput.tsx
│   │   ├── CommentItem.tsx
│   │   └── MentionSelector.tsx
│   ├── tags/
│   │   ├── TagInput.tsx
│   │   ├── TagSelector.tsx
│   │   ├── TagFilter.tsx
│   │   └── TagBadge.tsx
│   ├── sla/
│   │   ├── SLAIndicator.tsx
│   │   ├── SLAProgress.tsx
│   │   └── SLASettings.tsx
│   ├── automation/
│   │   ├── RuleBuilder.tsx
│   │   ├── RuleList.tsx
│   │   └── RuleConditionEditor.tsx
│   ├── analytics/
│   │   ├── TicketMetrics.tsx
│   │   ├── AgentPerformance.tsx
│   │   └── ArticleStats.tsx
│   ├── bulk-actions/
│   │   ├── BulkActionBar.tsx
│   │   ├── BulkSelector.tsx
│   │   └── BulkUpdateDialog.tsx
│   └── templates/
│       ├── TemplateSelector.tsx
│       └── TemplateEditor.tsx
└── shared/               # Shared business logic components
    ├── UserAvatar.tsx
    ├── DateDisplay.tsx
    └── EmptyState.tsx

hooks/
├── useFileUpload.ts
├── useComments.ts
├── useTags.ts
├── useSLA.ts
├── useAutomation.ts
├── useBulkSelection.ts
├── useTicketHistory.ts
└── useAnalytics.ts

lib/
├── types/
│   └── features.ts       # Already created
├── utils/
│   ├── sla.ts           # SLA calculations
│   ├── automation.ts    # Rule engine
│   └── export.ts        # PDF/CSV export
└── api/
    ├── attachments.ts   # API helpers for attachments
    ├── comments.ts
    └── tags.ts
```

## 🎨 Component Examples

### Example 1: FileUpload Component

```tsx
// components/features/attachments/FileUpload.tsx
'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { AttachmentEntityType } from '@/lib/types/features';

interface FileUploadProps {
  entityType: AttachmentEntityType;
  entityId: string;
  onSuccess?: (attachmentId: string) => void;
  /** Maximum file size in megabytes */
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

export function FileUpload({ 
  entityType, 
  entityId, 
  onSuccess,
  maxSizeMB = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx']
}: FileUploadProps) {
  const { upload, progress, error } = useFileUpload();

  // Your implementation here...
  
  return (
    <div>
      {/* Drag & drop zone, file list, progress bars */}
    </div>
  );
}
```

### Example 2: CommentSection Component

```tsx
// components/features/comments/CommentSection.tsx
'use client';

import { useEffect } from 'react';
import { useComments } from '@/hooks/useComments';
import { CommentInput } from './CommentInput';
import { CommentItem } from './CommentItem';

interface CommentSectionProps {
  ticketId: string;
  canAddInternal?: boolean;
}

export function CommentSection({ ticketId, canAddInternal }: CommentSectionProps) {
  const { comments, loading, addComment, updateComment, deleteComment } = useComments(ticketId);

  if (loading) {
    return <div>Loading comments...</div>;
  }
  
  return (
    <div className="space-y-4">
      <CommentInput onSubmit={addComment} canAddInternal={canAddInternal} />
      <div className="space-y-3">
        {comments.map(comment => (
          <CommentItem 
            key={comment.id} 
            comment={comment}
            onUpdate={updateComment}
            onDelete={deleteComment}
          />
        ))}
      </div>
    </div>
  );
}
```

### Example 3: Custom Hook Pattern

```tsx
// hooks/useComments.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TicketComment, CommentFormData } from '@/lib/types/features';

export function useComments(ticketId: string) {
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    
    const { data, error: err } = await supabase
      .from('ticket_comments')
      .select(`
        *,
        author:created_by(id, full_name, email),
        attachments(*)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (err) setError(err.message);
    else setComments(data as TicketComment[]);
    setLoading(false);
  }, [ticketId]);

  const addComment = async (formData: CommentFormData) => {
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: ticketId,
        ...formData,
      })
      .select()
      .single();

    if (err) throw new Error(err.message);
    setComments(prev => [...prev, data as TicketComment]);
    return data;
  };

  const updateComment = async (commentId: string, content: string) => {
    // Implementation...
  };

  const deleteComment = async (commentId: string) => {
    // Implementation...
  };

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    refresh: fetchComments,
  };
}
```

## 📋 Implementation Checklist

When implementing a new feature:

- [ ] Create database migration in `lib/supabase/`
- [ ] Run migration in Supabase dashboard
- [ ] Add TypeScript types to `lib/types/features.ts`
- [ ] Create custom hook in `hooks/`
- [ ] Create feature components in `components/features/`
- [ ] Add RLS policies and test them
- [ ] Update existing pages to use new components
- [ ] Test error handling
- [ ] Add loading states
- [ ] Test on mobile

## 🎯 Quick Start Template

When starting a new feature:

1. **Database** → Run migration
2. **Types** → Add interfaces
3. **Hook** → Create `useFEATURE.ts`
4. **Component** → Build UI components
5. **Integration** → Add to existing pages
6. **Test** → Verify functionality

Happy coding! 🚀
