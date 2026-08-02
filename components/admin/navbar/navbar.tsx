"use client";

import React, { useSyncExternalStore } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import SearchInputComponent from "./search-input";
import AvatarDropdownComponent from "./avatar-dropdown";
import NotificationBtn from "./notification-btn";
import ThemeSwitcherComponent from "./theme-switcher";

type NavbarProps = {
  scrolled?: boolean;
};

const Navbar = ({ scrolled = false }: NavbarProps) => {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const { toggleSidebar } = useSidebar();

  if (!mounted) {
    return (
      <div className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-card px-3 sm:gap-3 sm:px-4 lg:px-6">
        <Skeleton className="h-8 w-8 shrink-0" />
        <Skeleton className="h-8 w-8 shrink-0 sm:max-w-sm sm:flex-1" />
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Skeleton className="h-8 w-8 shrink-0" />
          <Skeleton className="h-8 w-8 shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 shrink-0 items-center gap-1.5 border-b px-3 transition-[background-color,backdrop-filter,box-shadow,border-color] duration-200 sm:gap-3 sm:px-4 lg:px-6",
        scrolled
          ? "border-border/70 bg-card/65 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-card/50"
          : "border-border bg-card/95 backdrop-blur-md supports-backdrop-filter:bg-card/80",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="h-9 w-9 shrink-0"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      <div className="min-w-0 md:max-w-sm md:flex-1">
        <SearchInputComponent />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5">
        <ThemeSwitcherComponent />
        <NotificationBtn />
        <AvatarDropdownComponent />
      </div>
    </header>
  );
};

export default Navbar;
