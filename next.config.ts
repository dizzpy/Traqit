import type { NextConfig } from "next";

// The browser talks directly to Supabase (auth + its realtime websocket), so
// connect-src/img-src need that origin. Derived from env rather than
// hardcoded so this doesn't drift from whichever project .env points at.
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : "";
const supabaseWsOrigin = supabaseOrigin.replace(/^http/, "ws");

const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' is required for Next's inline RSC-streaming <script> tags
  // (no nonce plumbing exists yet); 'unsafe-eval' is dev-only (webpack HMR).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Inline style={{}} attributes are used throughout the app, so style-src
  // needs 'unsafe-inline' too — fonts are self-hosted via next/font/local.
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://avatars.githubusercontent.com${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "font-src 'self' data:",
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin} ${supabaseWsOrigin}` : ""}`,
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
