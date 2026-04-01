import type { APIContext } from "astro";
import { createBrowserSupabaseClient } from "./client";

export const refreshSupabaseSession = async (_context: APIContext) => {
  // En Astro static no hay request-scoped cookies server-side como en Next middleware.
  // Hacemos refresh en cliente cuando exista sesion persistida.
  if (typeof window === "undefined") {
    return;
  }

  const supabase = createBrowserSupabaseClient();
  await supabase.auth.getSession();
};
