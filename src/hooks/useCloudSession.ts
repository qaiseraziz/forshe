// v1.2.8-dev — Supabase auth session hook.
//
// Calls `supabase.auth.getSession()` once on mount, then subscribes to
// `onAuthStateChange` so the UI reacts to sign-in / sign-out automatically.
// No polling — battery rule from CLAUDE.md.

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Re-declare the minimal shape we use instead of importing the type
// from `@supabase/supabase-js` — keeps the qa-expert "no direct
// @supabase imports outside lib/supabase.ts" ban list tight.
interface SupabaseUser {
  id: string;
  email?: string;
}

export interface CloudSession {
  user: SupabaseUser | null;
  loading: boolean;
}

export type { SupabaseUser };

export function useCloudSession(): CloudSession {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setUser(null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // getSession resolved or will resolve; either way once we've got a
      // definitive state we're no longer "loading".
      setLoading(false);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
