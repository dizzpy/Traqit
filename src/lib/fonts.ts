import localFont from "next/font/local";

/**
 * General Sans — primary UI font
 * Used for: body text, labels, buttons, inputs, navigation
 * CSS var: --font-sans
 */
export const generalSans = localFont({
  src: [
    {
      path: "../app/fonts/GeneralSans-Variable.woff2",
      style: "normal",
    },
    {
      path: "../app/fonts/GeneralSans-VariableItalic.woff2",
      style: "italic",
    },
  ],
  weight: "200 700",
  variable: "--font-gs",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
});

/**
 * Satoshi — display / heading font
 * Used for: page headings, card titles, section headers, display text
 * CSS var: --font-display
 */
export const satoshi = localFont({
  src: [
    {
      path: "../app/fonts/Satoshi-Variable.woff2",
      style: "normal",
    },
    {
      path: "../app/fonts/Satoshi-VariableItalic.woff2",
      style: "italic",
    },
  ],
  weight: "300 900",
  variable: "--font-satoshi",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
});
