"use client";

import { useId, useState, useEffect } from "react";
import { Tag, TagInput } from "emblor";
import { cn } from "@/lib/utils";
import { inputVariants } from "../ui/input";
import { badgeButtonVariants, badgeVariants } from "../ui/badge";

interface FormTagInputProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

function optionsToTags(options: string[]): Tag[] {
  return options
    .map((option) => option.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `${index}-${text}`,
      text,
    }));
}

export default function FormTagInput({
  value = [],
  onChange,
  placeholder = "Type an option and press Enter",
  disabled = false,
}: FormTagInputProps) {
  const id = useId();
  const [tags, setTags] = useState<Tag[]>(() => optionsToTags(value));
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const valueKey = (value ?? []).join("\u0001");

  useEffect(() => {
    setTags(optionsToTags(value ?? []));
  }, [valueKey]);

  const handleTagsChange = (newTags: React.SetStateAction<Tag[]>) => {
    const updatedTags = typeof newTags === "function" ? newTags(tags) : newTags;
    setTags(updatedTags);
    onChange?.(
      updatedTags
        .map((tag) => tag.text.trim())
        .filter(Boolean)
    );
  };

  return (
    <div className="min-w-0 w-full">
      <TagInput
        id={id}
        tags={tags}
        setTags={handleTagsChange}
        placeholder={placeholder}
        disabled={disabled}
        direction="column"
        styleClasses={{
          tagList: {
            container: "w-full min-w-0 flex flex-col gap-2",
          },
          input: cn(inputVariants({ variant: "lg" }), "min-w-0 w-full"),
          tag: {
            body: cn(
              badgeVariants({ variant: "secondary" }),
              "flex h-auto min-h-7 w-full max-w-full items-start justify-between gap-2 whitespace-normal wrap-break-word py-1.5 text-left leading-snug [&>button]:shrink-0"
            ),
            closeButton: cn(
              badgeButtonVariants(),
              "h-auto shrink-0 self-start py-1"
            ),
          },
        }}
        activeTagIndex={activeTagIndex}
        setActiveTagIndex={setActiveTagIndex}
        inlineTags={false}
        inputFieldPosition="top"
      />
    </div>
  );
}
