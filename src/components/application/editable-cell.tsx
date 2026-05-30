"use client";

import { useEffect, useRef, useState } from "react";
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
  const listId = useRef(`dl-${Math.random().toString(36).slice(2)}`);

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
              "block w-full rounded-md px-2 py-0.5 -mx-2 transition-colors duration-150 hover:bg-surface-hover cursor-pointer truncate",
              align === "right" ? "text-right" : "text-left"
            )}
          >
            {display ?? (value ? value : <span className="text-text-muted">{placeholder}</span>)}
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
            list={suggestions ? listId.current : undefined}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") cancel();
            }}
            className={cn(
              "absolute inset-0 -mx-2 w-[calc(100%+1rem)] rounded-md bg-surface-elevated border border-accent px-2 text-sm text-text-primary focus:outline-none",
              align === "right" && "text-right"
            )}
          />
          {suggestions && (
            <datalist id={listId.current}>
              {suggestions.map((s) => <option key={s} value={s} />)}
            </datalist>
          )}
        </>
      )}
    </div>
  );
}
