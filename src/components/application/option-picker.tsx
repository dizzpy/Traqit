"use client";

import { useState } from "react";
import { Add01Icon, Tick01Icon, DragDropVerticalIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { tagBadgeClass } from "@/lib/tag-colors";
import { cn } from "@/lib/utils";

export { tagBadgeClass };

export interface PickerOption {
  value: string;
  label: string;
  /** badge classes (bg + text) */
  className?: string;
}

interface OptionPickerProps {
  value: string;
  options: PickerOption[];
  onSelect: (value: string) => void;
  allowCreate?: boolean;
  /**
   * When provided, the option list becomes manageable: options can be
   * reordered by dragging and deleted. Fixed enums omit this.
   */
  onOptionsChange?: (options: PickerOption[]) => void;
  /** the resting cell display (badge / text) */
  children: React.ReactNode;
  className?: string;
}

export function OptionPicker({
  value,
  options,
  onSelect,
  allowCreate = false,
  onOptionsChange,
  children,
  className,
}: OptionPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const manageable = !!onOptionsChange;

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const exactMatch = options.some((o) => o.label.toLowerCase() === query.trim().toLowerCase());
  const canCreate = allowCreate && query.trim().length > 0 && !exactMatch;

  function choose(v: string) {
    onSelect(v);
    setQuery("");
    setOpen(false);
  }

  function create() {
    const label = query.trim();
    if (!label) return;
    if (manageable && !options.some((o) => o.value === label)) {
      onOptionsChange?.([...options, { value: label, label, className: tagBadgeClass(label) }]);
    }
    onSelect(label);
    setQuery("");
    setOpen(false);
  }

  function deleteOption(e: React.MouseEvent, val: string) {
    e.stopPropagation();
    onOptionsChange?.(options.filter((o) => o.value !== val));
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...options];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onOptionsChange?.(next);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "text-left cursor-pointer outline-none rounded-md transition-opacity duration-150 hover:opacity-75",
          className
        )}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={2} className="w-64 p-0 gap-0" onClick={(e) => e.stopPropagation()}>
        {/* Search */}
        <div className="p-2 border-b border-border">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (filtered.length) choose(filtered[0].value);
                else if (canCreate) create();
              }
            }}
            placeholder={allowCreate ? "Search or create…" : "Search…"}
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none px-1"
          />
        </div>

        {/* Options */}
        <div className="max-h-56 overflow-y-auto p-1">
          <p className="px-2 py-1 text-[11px] text-text-muted">
            {allowCreate ? "Select an option or create one" : "Select an option"}
          </p>
          {filtered.map((o) => {
            const idx = options.indexOf(o);
            const isDragging = dragIndex === idx;
            const isOver = overIndex === idx && dragIndex !== null && dragIndex !== idx;
            return (
              <div
                key={o.value}
                draggable={manageable && !query}
                onDragStart={() => setDragIndex(idx)}
                onDragOver={(e) => { if (manageable) { e.preventDefault(); setOverIndex(idx); } }}
                onDrop={(e) => { if (manageable && dragIndex !== null) { e.preventDefault(); reorder(dragIndex, idx); } setDragIndex(null); setOverIndex(null); }}
                onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-hover transition-colors duration-150 group cursor-pointer",
                  isDragging && "opacity-40",
                  isOver && "ring-1 ring-accent"
                )}
                onClick={() => choose(o.value)}
              >
                {manageable && (
                  <span className="shrink-0 cursor-grab text-text-muted opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                    <HugeiconsIcon icon={DragDropVerticalIcon} size={12} strokeWidth={1.5} />
                  </span>
                )}
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", o.className ?? "bg-surface-elevated text-text-secondary")}>
                  {o.label}
                </span>
                {value === o.value && (
                  <HugeiconsIcon icon={Tick01Icon} size={14} className="text-accent ml-auto shrink-0" strokeWidth={2} />
                )}
                {manageable && (
                  <button
                    onClick={(e) => deleteOption(e, o.value)}
                    className={cn(
                      "shrink-0 text-text-muted hover:text-[var(--status-rejected-fg)] opacity-0 group-hover:opacity-100 transition-colors duration-150",
                      value === o.value ? "" : "ml-auto"
                    )}
                    title="Delete option"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={13} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            );
          })}

          {canCreate && (
            <button
              onClick={create}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-hover transition-colors duration-150 text-left"
            >
              <HugeiconsIcon icon={Add01Icon} size={13} className="text-text-muted shrink-0" strokeWidth={1.5} />
              <span className="text-xs text-text-secondary">Create</span>
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", tagBadgeClass(query.trim()))}>
                {query.trim()}
              </span>
            </button>
          )}

          {filtered.length === 0 && !canCreate && (
            <p className="px-2 py-2 text-xs text-text-muted">No options</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
