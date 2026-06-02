/** Soft violet-haze palette for free-form tags (Type, Source, etc.). */
const TAG_PALETTE = [
  "bg-[var(--tag-violet-bg)] text-[var(--tag-violet-fg)]", // violet
  "bg-[var(--tag-blue-bg)] text-[var(--tag-blue-fg)]", // blue
  "bg-[var(--tag-green-bg)] text-[var(--tag-green-fg)]", // green
  "bg-[var(--tag-amber-bg)] text-[var(--tag-amber-fg)]", // amber
  "bg-[var(--tag-red-bg)] text-[var(--tag-red-fg)]", // red
  "bg-[var(--tag-teal-bg)] text-[var(--tag-teal-fg)]", // teal
  "bg-[var(--tag-grey-bg)] text-[var(--tag-grey-fg)]", // grey
];

export function tagBadgeClass(name: string): string {
  if (!name) return "bg-surface-elevated text-text-muted";
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[h % TAG_PALETTE.length];
}
