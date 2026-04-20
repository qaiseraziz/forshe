// v1.2.8-dev — Supabase client singleton for cloud backup.
//
// This is the ONLY file in the app that should import `@supabase/supabase-js`.
// All other modules must go through the helpers in `src/utils/cloudBackup.ts`
// or the `useCloudSession` hook.
//
// Credentials are the project's publishable key (new `sb_publishable_*` format)
// and the project URL. These are safe to embed in the client — RLS policies on
// the `backups` bucket restrict every user to their own folder.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vgekjuafifadqchbttpa.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_MLU3cVNV5IXRp4XMw71ILA_yzRCVqVI';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    // Persist the session across app restarts so signed-in users stay signed in.
    persistSession: true,
    // Mobile app — no URL-based session handoff (that's a web OAuth redirect thing).
    detectSessionInUrl: false,
    // Supabase refreshes tokens in the background via setInterval. That's fine
    // for a mobile app that foregrounds occasionally — not a battery risk because
    // it only runs while the JS bundle is alive and sessions last ~1h.
    autoRefreshToken: true,
  },
});
