/// <reference types="astro/client" />

declare global {
  interface ImportMetaEnv {
    readonly DEV: boolean;
    readonly NEXT_PUBLIC_SUPABASE_URL?: string;
    readonly NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?: string;
    readonly PUBLIC_SUPABASE_URL?: string;
    readonly PUBLIC_SUPABASE_ANON_KEY?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface Window {
    handleQuickTransfer: (cedula: string) => void;
    toggleSidebarContactMenu: (event: Event, id: string) => void;
    showToast: (
      message: string,
      type?: "success" | "error" | "info",
      title?: string
    ) => void;
    markNotifRead: (id: string, el: HTMLElement) => void;
    requestPin: (callback: (pin: string) => void) => void;
    openLogoutModal: () => void;
    __capypayHistoryCache?: {
      cedula: string;
      movimientos: any[];
      updatedAt: number;
    };
  }
}

export {};

declare module "*.css";

declare module '../services/api.js' {
  export const pinService: {
    verify: (pin: string) => Promise<{ valid: boolean; success: boolean; }>;
  };
}
