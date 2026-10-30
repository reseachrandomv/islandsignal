"use client";
import { useCallback, useEffect, useState } from "react";
import { getIslands, getMe, getPosts } from "./api";
import { Island, Me, Post } from "./types";
export function useData(opts: { includeOld?: boolean; admin?: boolean } = {}) {
  const [islands, setIslands] = useState<Island[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try {
      const [i, p, m] = await Promise.all([getIslands(), getPosts(opts), getMe()]);
      setIslands(i); setPosts(p); setMe(m); setError(null);
    } catch (e: any) { setError(e.message || "Could not load data"); }
    setLoading(false);
  }, [opts.includeOld, opts.admin]);
  useEffect(() => { reload(); }, [reload]);
  return { islands, posts, me, loading, error, reload };
}
