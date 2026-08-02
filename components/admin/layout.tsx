"use client";

import { useEffect, useRef, useState } from "react";
import AppSidebar from "@/components/admin/sidebar/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ScrollArea } from "../ui/scroll-area";
import Navbar from "./navbar/navbar";

export default function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onScroll = () => {
      setScrolled(viewport.scrollTop > 8);
    };

    onScroll();
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />

      <div className="flex h-svh min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar scrolled={scrolled} />
        <ScrollArea className="min-h-0 flex-1" viewportRef={viewportRef}>
          <div className="mx-auto w-full max-w-full p-3 pb-10 sm:p-4 md:pr-6 md:pt-1">
            {children}
          </div>
        </ScrollArea>
      </div>
    </SidebarProvider>
  );
}
