# InternTracker Design System — Violet Haze

## Design Principles
- **Calm over loud.** Job hunting is stressful. Status colors are soft and muted.
- **Minimal but warm.** Generous whitespace, soft rounded corners (10–12px).
- **Dense where it counts.** Main table stays information-rich.
- **Gentle motion.** 150ms transitions.

## Color Palette (Dark Default)

```css
--bg: #0b0a0e;
--surface: #131116;
--surface-elevated: #1b1a1f;
--surface-hover: #221f28;
--border: #29272f;
--border-hover: #3a3742;
--text-primary: #f6f5fa;
--text-secondary: #8b8792;
--text-muted: #6e6b7a;
--accent: #8b5cf6;
--accent-hover: #7c3aed;
--accent-soft: #25203b;
--accent-soft-fg: #a78bfa;
```

**Semantic Status Colors:**
- Applied: #8b8792 on #1b1a1f
- Progress: #a78bfa on #25203b
- Offer: #4ade80 on #14271b
- Rejected: #f87171 on #2d1414
- Ghosted: #6e6b7a (0.6 opacity)

**Light Theme** available.

## Typography
- **Display**: Satoshi (600 max)
- **Body/UI**: General Sans (500)

## Spacing & Radius
- Radius: Buttons 9-10px, Cards 12px, Modals 16px
- Spacing: xs(4px), sm(8px), md(12px), lg(16px), xl(24px)

## Component Rules
- Use **shadcn/ui** exclusively
- Theme via CSS variables
- Icons: Lucide / Hugeicons, thin stroke
```

