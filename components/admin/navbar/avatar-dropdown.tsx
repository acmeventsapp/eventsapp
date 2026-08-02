"use client";

import {
  ChevronDownIcon,
  ExternalLink,
  LogOutIcon,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import Link from "next/link";
import LogoutModal from "@/components/admin/logout-modal";
import { useAdminSession } from "@/hooks/use-admin-session";
import { runAfterDropdownClose } from "@/lib/dropdown-modal";

function getAdminDisplayName(name?: string, email?: string) {
  if (name?.trim()) return name.trim();
  if (!email) return "Admin";
  return email.split("@")[0]?.replace(/[._-]/g, " ") ?? "Admin";
}

function getAdminInitials(name?: string, email?: string) {
  const displayName = getAdminDisplayName(name, email);
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase() || "A";
}

export default function AvatarDropdownComponent({
  direction = "end",
}: {
  direction?: "start" | "center" | "end";
}) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: admin } = useAdminSession();

  const displayName = getAdminDisplayName(admin?.name, admin?.email);
  const initials = getAdminInitials(admin?.name, admin?.email);

  return (
    <>
      <DropdownMenu modal={false} open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="primary"
            appearance={"ghost"}
            className="h-auto p-0 hover:bg-transparent"
          >
            <span className="relative flex size-8 shrink-0 overflow-hidden rounded-full">
              <span className="flex size-full items-center justify-center rounded-full bg-muted text-xs font-medium">
                {initials}
              </span>
            </span>
            <ChevronDownIcon
              size={16}
              className="hidden opacity-60 sm:block"
              aria-hidden="true"
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="max-w-72" align={direction}>
          <DropdownMenuLabel className="text-foreground flex min-w-0 flex-col">
            <span className="text-foreground truncate text-sm font-medium">
              {displayName}
            </span>
            <span className="text-muted-foreground truncate text-xs font-normal">
              {admin?.email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">
                <Settings size={16} className="opacity-60" />
                <span>Account Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/" target="_blank">
                <ExternalLink size={16} className="opacity-60" />
                <span>View Website</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              setMenuOpen(false);
              runAfterDropdownClose(() => setShowLogoutModal(true));
            }}
          >
            <LogOutIcon size={16} className="opacity-60" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LogoutModal
        open={showLogoutModal}
        onOpenChange={setShowLogoutModal}
      />
    </>
  );
}
