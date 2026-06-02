"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";

interface EditableCellProps {
  value: string;
  /** Rendered when not editing. Falls back to value/placeholder. */
  display?: React.ReactNode;
  type?: "text" | "number" | "date";
  /** datalist suggestions for text inputs. */
  suggestions?: string[];
  placeholder?: string;
  align?: "left" | "right";
  onCommit: (value: string) => void;
  className?: string;
}

/**
 * Notion-style inline editable cell. Click to edit; the editor is an
 * absolutely-positioned overlay so the row never changes height or reflows.
 * Enter / blur commits, Escape cancels. Updates local state only (static prototype).
 */
export function EditableCell({
  value,
  display,
  type = "text",
  suggestions,
  placeholder = "—",
  align = "left",
  onCommit,
  className,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select(); }
  }, [editing]);

  function start(e: React.MouseEvent) {
    e.stopPropagation();
    setDraft(value);
    setEditing(true);
  }
  function commit() {
    setEditing(false);
    if (draft !== value) onCommit(draft);
  }
  function cancel() {
    setEditing(false);
    setDraft(value);
  }

  // Date cells get the custom themed calendar popover instead of a native input.
  // Compact, cute trigger that hugs its content (not a big full-width box).
  if (type === "date") {
    return (
      <div className={cn("relative", align === "right" && "text-right", className)}>
        <DatePicker
          value={value}
          onChange={(v) => { if (v !== value) onCommit(v); }}
        >
          <button
            type="button"
            className={cn(
              "group/date inline-flex max-w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 -mx-1.5 outline-none transition-colors duration-150 hover:bg-surface-hover/70 cursor-pointer",
              align === "right" ? "text-right" : "text-left"
            )}
          >
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={12}
              strokeWidth={1.5}
              className="shrink-0 text-text-muted"
            />
            <span className="truncate">
              {display ?? (value ? value : <span className="text-text-muted">{placeholder}</span>)}
            </span>
          </button>
        </DatePicker>
      </div>
    );
  }

  return (
    <div className={cn("relative", align === "right" && "text-right", className)}>
      {/* Resting display defines the cell size; hidden (not removed) while editing. */}
      <button
        type="button"
        onClick={start}
        className={cn(
          "block w-full rounded-md px-2 py-0.5 -mx-2 transition-colors duration-150 hover:bg-surface-hover cursor-text truncate",
          align === "right" ? "text-right" : "text-left",
          editing && "invisible"
        )}
      >
        {display ?? (value ? value : <span className="text-text-muted">{placeholder}</span>)}
      </button>

      {editing && (
        <>
          <input
            ref={inputRef}
            type={type === "number" ? "number" : "text"}
            value={draft}
            list={suggestions ? listId : undefined}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") cancel();
            }}
            className={cn(
              "absolute inset-0 -mx-2 w-[calc(100%+1rem)] rounded-md bg-surface-elevated border border-border-hover px-2 text-sm text-text-primary outline-none focus:outline-none",
              align === "right" && "text-right"
            )}
          />
          {suggestions && (
            <datalist id={listId}>
              {suggestions.map((s) => <option key={s} value={s} />)}
            </datalist>
          )}
        </>
      )}
    </div>
  );
}
