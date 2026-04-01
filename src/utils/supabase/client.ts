import { createClient } from "@supabase/supabase-js";
import { assertSupabaseConfigured } from "./shared";

export const createBrowserSupabaseClient = () => {
  const { supabaseUrl, supabasePublishableKey } = assertSupabaseConfigured();

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};
