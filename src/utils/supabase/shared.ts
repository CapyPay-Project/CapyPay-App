export function getSupabaseRuntimeConfig() {
  const supabaseUrl =
    import.meta.env.PUBLIC_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";

  const supabasePublishableKey =
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    "";

  return {
    supabaseUrl,
    supabasePublishableKey,
    isConfigured: Boolean(supabaseUrl && supabasePublishableKey),
  };
}

export function assertSupabaseConfigured() {
  const config = getSupabaseRuntimeConfig();
  if (!config.isConfigured) {
    throw new Error(
      "Supabase no esta configurado. Define PUBLIC_SUPABASE_URL/PUBLIC_SUPABASE_ANON_KEY o NEXT_PUBLIC_SUPABASE_* en .env.local"
    );
  }
  return config;
}
