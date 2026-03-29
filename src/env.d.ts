/// <reference types="astro/client" />

declare global {
  interface ImportMetaEnv {
    readonly DEV: boolean;
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
  }
}

export {};

declare module '../services/api.js' {
  export const pinService: {
    verify: (pin: string) => Promise<{ valid: boolean; success: boolean; }>;
  };
}
