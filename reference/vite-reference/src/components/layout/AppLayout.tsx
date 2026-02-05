import React from "react";
import { cn } from "@/lib/utils";

type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
};

/**
 * Minimal layout wrapper. No sidebar - AI generates sidebar when layout=sidebar.
 * Use container={true} for centered content; otherwise full-width.
 * Root always keeps min-h-svh w-full; className is merged, not replaced.
 */
export function AppLayout({ children, container = false, className, contentClassName }: AppLayoutProps): JSX.Element {
  return (
    <div className={cn("flex flex-col min-h-svh w-full", className)}>
      {container ? (
        <div className={cn("max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12", contentClassName)}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
