"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowDown01Icon, Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  allowCreate?: boolean;
  onCreateNew?: (value: string) => void;
  error?: string;
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  allowCreate = true,
  onCreateNew,
  error,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase())
  );

  const canCreate =
    allowCreate && query && !options.some((o) => o.toLowerCase() === query.toLowerCase());

  function handleSelect(option: string) {
    onChange(option);
    setOpen(false);
    setQuery("");
  }

  function handleCreate() {
    if (!query) return;
    onCreateNew?.(query);
    onChange(query);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={ref} className="flex flex-col gap-1.5 relative">
      {label && (
        <label className="text-xs font-medium text-text-secondary">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "h-10 w-full flex items-center justify-between px-3 rounded-input bg-surface-elevated border border-border text-sm transition-colors duration-150",
          open ? "border-border-hover" : "",
          error ? "border-danger" : "",
          value ? "text-text-primary" : "text-text-muted"
        )}
      >
        <span>{value || placeholder}</span>
        <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1.5} className="text-text-muted shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 w-full z-20 bg-surface-elevated border border-border rounded-input shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <HugeiconsIcon icon={Search01Icon} size={13} strokeWidth={1.5} className="text-text-muted shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 text-sm bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm transition-colors duration-150",
                  option === value
                    ? "text-text-primary bg-surface-hover"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                )}
              >
                {option}
              </button>
            ))}
            {canCreate && (
              <button
                type="button"
                onClick={handleCreate}
                className="w-full text-left px-3 py-2 text-sm text-accent hover:bg-surface-hover flex items-center gap-2"
              >
                <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={1.5} />
                Add &quot;{query}&quot;
              </button>
            )}
            {filtered.length === 0 && !canCreate && (
              <p className="px-3 py-2 text-sm text-text-muted">No results</p>
            )}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
