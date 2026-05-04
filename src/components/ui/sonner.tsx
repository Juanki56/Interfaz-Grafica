"use client";

import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner@2.0.3";

/**
 * Tema del toast alineado con la clase `dark` del documento (no con next-themes sin ThemeProvider).
 * Si Sonner usa theme=dark pero --popover sigue siendo claro, la descripción queda casi blanca sobre blanco.
 */
function useDocumentDarkClass(): boolean {
  const subscribe = React.useCallback((onStoreChange: () => void) => {
    const root = document.documentElement;
    const mo = new MutationObserver(onStoreChange);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  return React.useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false
  );
}

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const isDark = useDocumentDarkClass();

  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        classNames: {
          ...toastOptions?.classNames,
          title: [toastOptions?.classNames?.title, "!text-popover-foreground"].filter(Boolean).join(" "),
          description: [toastOptions?.classNames?.description, "!text-neutral-800", "dark:!text-neutral-200"]
            .filter(Boolean)
            .join(" "),
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
