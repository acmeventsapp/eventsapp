"use client";

import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { adminSearchItems } from "@/components/admin/sidebar/sidebaritems";

export default function SearchInputComponent() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return adminSearchItems;

    return adminSearchItems.filter(
      (item) =>
        item.label.toLowerCase().includes(normalizedQuery) ||
        item.group.toLowerCase().includes(normalizedQuery) ||
        item.href.toLowerCase().includes(normalizedQuery)
    );
  }, [query]);

  const grouped = filteredItems.reduce<Record<string, typeof adminSearchItems>>(
    (acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
    },
    {}
  );

  return (
    <>
      <button
        type="button"
        className="bg-background text-foreground placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-ring/50 hidden h-9 w-full max-w-sm rounded-md px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] md:inline-flex"
        onClick={() => setOpen(true)}
      >
        <span className="flex grow items-center">
          <SearchIcon
            className="text-muted-foreground/80 -ms-1 me-3"
            size={16}
            aria-hidden="true"
          />
          <span className="text-muted-foreground/70 font-normal">
            Search admin pages…
          </span>
        </span>
        <kbd className="bg-muted text-muted-foreground/70 ms-4 inline-flex h-5 items-center rounded border px-1.5 font-[inherit] text-[0.625rem] font-medium">
          ⌘K
        </kbd>
      </button>

      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-background p-2 text-muted-foreground shadow-sm transition-colors hover:bg-accent md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Search admin pages"
      >
        <SearchIcon className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogTitle className="sr-only">Search admin pages</DialogTitle>
          <div className="flex items-center border-b px-3">
            <SearchIcon className="mr-2 size-4 shrink-0 opacity-50" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search admin pages…"
              className="h-11 border-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            {filteredItems.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </p>
            ) : (
              Object.entries(grouped).map(([group, items]) => (
                <div key={group} className="mb-2 last:mb-0">
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {group}
                  </p>
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        <Icon size={16} className="opacity-60" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
