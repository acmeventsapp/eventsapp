"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import ThemeSwitcherComponent from "@/components/admin/navbar/theme-switcher";
import { cn } from "@/lib/utils";

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b transition-[background-color,backdrop-filter,box-shadow,border-color] duration-200",
        scrolled
          ? "border-border/70 bg-card/65 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-card/50"
          : "border-border bg-card/95 backdrop-blur-md supports-backdrop-filter:bg-card/80",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-base font-semibold sm:text-lg"
        >
          <Image
            src="/images/acm_logo.png"
            alt="ACM Ugwuagba Arch"
            width={100}
            height={100}
            className="h-8 w-8 shrink-0 sm:h-10 sm:w-10"
          />
          <span className="truncate">ACM</span>
        </Link>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          <ThemeSwitcherComponent />
          <Link
            href="/events"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "px-2 sm:px-3",
            )}
          >
            <span className="sm:hidden">Events</span>
            <span className="hidden sm:inline">ACM events</span>
          </Link>
          <Link
            href="/admin/auth/login"
            className={cn(buttonVariants({ size: "sm" }), "px-2.5 sm:px-3")}
          >
            <span className="sm:hidden">Admin</span>
            <span className="hidden sm:inline">Admin login</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
