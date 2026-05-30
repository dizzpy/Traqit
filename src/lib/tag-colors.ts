/** Soft violet-haze palette for free-form tags (Type, Source, etc.). */
const TAG_PALETTE = [
  "bg-[#25203b] text-[#a78bfa]", // violet
  "bg-[#16233f] text-[#7cb0f8]", // blue
  "bg-[#14271b] text-[#4ade80]", // green
  "bg-[#2d2408] text-[#f0b429]", // amber
  "bg-[#2d1414] text-[#f87171]", // red
  "bg-[#16292a] text-[#5ed1c5]", // teal
  "bg-[#1b1a1f] text-[#8b8792]", // grey
];

export function tagBadgeClass(name: string): string {
  if (!name) return "bg-surface-elevated text-text-muted";
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[h % TAG_PALETTE.length];
}
