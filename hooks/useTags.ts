"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

interface UseTagsOptions {
  entityType: "ticket" | "article";
  entityId: string;
}

export function useTags({ entityType, entityId }: UseTagsOptions) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const junctionTable = entityType === "ticket" ? "ticket_tags" : "article_tags";
  const fkColumn = entityType === "ticket" ? "ticket_id" : "article_id";

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from(junctionTable)
        .select("tag_id, tags(*)")
        .eq(fkColumn, entityId);

      if (fetchError) throw fetchError;

      const fetched = (data ?? []).map(
        (row: Record<string, unknown>) => row.tags as Tag
      );
      setTags(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tags");
    } finally {
      setLoading(false);
    }
  }, [supabase, junctionTable, fkColumn, entityId]);

  const addTag = useCallback(
    async (name: string, color?: string, description?: string) => {
      setError(null);
      try {
        // Upsert the tag (reuse if name already exists)
        const { data: tag, error: tagError } = await supabase
          .from("tags")
          .upsert(
            { name, color: color ?? null, description: description ?? null },
            { onConflict: "name" }
          )
          .select()
          .single();

        if (tagError) throw tagError;

        // Link to entity
        const { error: linkError } = await supabase
          .from(junctionTable)
          .upsert({ tag_id: tag.id, [fkColumn]: entityId });

        if (linkError) throw linkError;

        setTags((prev) => [...prev.filter((t) => t.id !== tag.id), tag as Tag]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add tag");
      }
    },
    [supabase, junctionTable, fkColumn, entityId],
  );

  const removeTag = useCallback(
    async (tagId: string) => {
      setError(null);
      try {
        const { error: removeError } = await supabase
          .from(junctionTable)
          .delete()
          .eq("tag_id", tagId)
          .eq(fkColumn, entityId);

        if (removeError) throw removeError;

        setTags((prev) => prev.filter((t) => t.id !== tagId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove tag");
      }
    },
    [supabase, junctionTable, fkColumn, entityId],
  );

  useEffect(() => {
    if (entityId) {
      fetchTags();
    }
  }, [entityId, fetchTags]);

  return { tags, loading, error, addTag, removeTag, fetchTags };
}
