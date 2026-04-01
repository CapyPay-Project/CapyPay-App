import { createClient } from "@supabase/supabase-js";
import { assertSupabaseConfigured } from "./shared";

export const createServerSupabaseClient = () => {
  const { supabaseUrl, supabasePublishableKey } = assertSupabaseConfigured();

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
