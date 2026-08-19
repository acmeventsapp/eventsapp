"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { runAfterDropdownClose } from "@/lib/dropdown-modal";
import type { RegistrationUI } from "@/validators/types/event";

interface RegistrationRowActionsProps {
  registration: RegistrationUI;
  showNameTag?: boolean;
  nameTagAction?: React.ReactNode;
  onView: () => void;
  onUpdate: () => void;
  onUpdateStatus: () => void;
  onDelete: () => void;
}

export default function RegistrationRowActions({
  registration,
  showNameTag = false,
  nameTagAction,
  onView,
  onUpdate,
  onUpdateStatus,
  onDelete,
}: RegistrationRowActionsProps) {
  const [open, setOpen] = useState(false);
  const registrantName = registration.contactName || registration.responsePreview;

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={`Actions for ${registrantName}`}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => {
            setOpen(false);
            runAfterDropdownClose(onUpdate);
          }}
        >
          <Pencil className="size-4" />
          Update
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            setOpen(false);
            runAfterDropdownClose(onUpdateStatus);
          }}
        >
          <BadgeCheck className="size-4" />
          Update status
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            setOpen(false);
            runAfterDropdownClose(onView);
          }}
        >
          <Eye className="size-4" />
          View
        </DropdownMenuItem>
        {showNameTag && nameTagAction ? (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">{nameTagAction}</div>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            setOpen(false);
            runAfterDropdownClose(onDelete);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
