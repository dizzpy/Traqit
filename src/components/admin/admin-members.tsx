"use client";

import { useEffect, useRef } from "react";

export type AdminMember = {
  id: string;
  name: string;
  email: string;
  joined: string; // ISO date
  apps: number;
  templates: number;
  avatar?: string;
};

type Node = {
  user: AdminMember;
  el: HTMLDivElement;
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dragging: boolean;
};

const initials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

/**
 * Admin "members" canvas. A faithful port of the standalone HTML toy: a
 * physics field of draggable, throwable avatar bubbles with a slide-over
 * inspector. All DOM work is imperative inside one effect (the original was
 * vanilla JS) but scoped to `rootRef` so nothing touches the rest of the app,
 * and the styles live under `.admin-root` so they can't leak either.
 */
export function AdminMembers({ members }: { members: AdminMember[] }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const field = root.querySelector<HTMLDivElement>("#admField")!;
    const statsEl = root.querySelector<HTMLDivElement>("#admStats")!;
    const panel = root.querySelector<HTMLElement>("#admPanel")!;
    const scrim = root.querySelector<HTMLDivElement>("#admScrim")!;

    const W = () => field.clientWidth;
    const H = () => field.clientHeight;

    // Uniform, screen-aware radius: circles fill ~50% of the usable field area.
    // r = sqrt( 0.5 * fieldArea / (π * n) ), clamped 14–52px.
    const calcRadius = () => {
      if (members.length === 0) return 24;
      const area = W() * (H() - 180);
      const r = Math.sqrt((area * 0.5) / (Math.PI * members.length));
      return Math.max(14, Math.min(52, Math.round(r)));
    };

    // ---------- build nodes ----------
    const nodes: Node[] = members.map((u, i) => {
      const el = document.createElement("div");
      el.className = "node";
      el.style.animationDelay = i * 70 + "ms";
      el.innerHTML = `
        <div class="ring"><div class="face">${initials(u.name)}</div></div>
        <div class="label">${u.name}</div>`;
      if (u.avatar) {
        const face = el.querySelector<HTMLDivElement>(".face")!;
        const img = new Image();
        img.onload = () => {
          face.textContent = "";
          face.appendChild(img);
        };
        img.src = u.avatar;
        img.alt = u.name;
      }
      field.appendChild(el);

      const r = calcRadius();
      el.style.width = el.style.height = r * 2 + "px";

      return {
        user: u,
        el,
        r,
        x: r + Math.random() * (W() - 2 * r),
        y: r + 90 + Math.random() * (H() - 2 * r - 200),
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        dragging: false,
      };
    });

    // ---------- physics loop ----------
    let raf = 0;
    const step = () => {
      const w = W(),
        h = H();
      for (const n of nodes) {
        if (!n.dragging) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < n.r) {
            n.x = n.r;
            n.vx = Math.abs(n.vx);
          }
          if (n.x > w - n.r) {
            n.x = w - n.r;
            n.vx = -Math.abs(n.vx);
          }
          if (n.y < n.r + 72) {
            n.y = n.r + 72;
            n.vy = Math.abs(n.vy);
          }
          if (n.y > h - n.r - 110) {
            n.y = h - n.r - 110;
            n.vy = -Math.abs(n.vy);
          }
          const sp = Math.hypot(n.vx, n.vy);
          if (sp < 0.15) {
            const a = Math.random() * Math.PI * 2;
            n.vx += Math.cos(a) * 0.05;
            n.vy += Math.sin(a) * 0.05;
          }
          if (sp > 0.9) {
            n.vx *= 0.992;
            n.vy *= 0.992;
          }
        }
      }
      // elastic collisions between circles
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i],
            b = nodes[j];
          const dx = b.x - a.x,
            dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const min = a.r + b.r;
          if (dist < min) {
            const nx = dx / dist,
              ny = dy / dist,
              overlap = (min - dist) / 2;
            if (!a.dragging) {
              a.x -= nx * overlap;
              a.y -= ny * overlap;
            }
            if (!b.dragging) {
              b.x += nx * overlap;
              b.y += ny * overlap;
            }
            const avn = a.vx * nx + a.vy * ny,
              bvn = b.vx * nx + b.vy * ny;
            const diff = bvn - avn;
            if (!a.dragging) {
              a.vx += diff * nx;
              a.vy += diff * ny;
            }
            if (!b.dragging) {
              b.vx -= diff * nx;
              b.vy -= diff * ny;
            }
          }
        }
      }
      for (const n of nodes) {
        n.el.style.transform = `translate(${n.x}px,${n.y}px) translate(-50%,-50%)`;
      }
      raf = requestAnimationFrame(step);
    };

    nodes.forEach((n) => {
      n.el.addEventListener("animationend", () => {
        n.el.style.animation = "none";
        n.el.style.opacity = "1";
      });
    });
    raf = requestAnimationFrame(step);

    // ---------- side panel ----------
    let activeEl: HTMLElement | null = null;
    const closePanel = () => {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
      scrim.classList.remove("open");
      if (activeEl) {
        activeEl.classList.remove("active");
        activeEl = null;
      }
    };
    const openPanel = (n: Node) => {
      if (activeEl) activeEl.classList.remove("active");
      activeEl = n.el;
      activeEl.classList.add("active");
      const u = n.user;
      panel.innerHTML = `
        <button class="close" id="admCloseBtn" aria-label="Close">×</button>
        <div class="p-avatar" id="admPAv"><span>${initials(u.name)}</span></div>
        <div class="p-name">${u.name}</div>
        <div class="p-email">${u.email}</div>
        <div class="p-meta"><span class="pulse"></span> Active member</div>
        <div class="p-grid">
          <div class="p-card"><div class="num">${u.apps}</div><div class="lbl">Applications</div></div>
          <div class="p-card"><div class="num">${u.templates}</div><div class="lbl">Email templates</div></div>
        </div>
        <div class="p-section-title">Details</div>
        <div class="p-row"><span class="k">Joined</span><span class="v">${fmtDate(u.joined)}</span></div>
        <div class="p-row"><span class="k">User ID</span><span class="v">${u.id}</span></div>
        <div class="p-row"><span class="k">Applications</span><span class="v">${u.apps}</span></div>
        <div class="p-row"><span class="k">Email templates</span><span class="v">${u.templates}</span></div>
      `;
      if (u.avatar) {
        const av = panel.querySelector<HTMLDivElement>("#admPAv")!;
        const img = new Image();
        img.onload = () => {
          av.textContent = "";
          av.appendChild(img);
        };
        img.src = u.avatar;
        img.alt = u.name;
      }
      panel.querySelector<HTMLButtonElement>("#admCloseBtn")!.onclick = closePanel;
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      scrim.classList.add("open");
    };

    // ---------- drag + click ----------
    const cleanups: Array<() => void> = [];
    nodes.forEach((n) => {
      let startX = 0,
        startY = 0,
        lastX = 0,
        lastY = 0,
        lastT = 0,
        moved = 0;
      const onDown = (e: PointerEvent) => {
        e.preventDefault();
        n.dragging = true;
        moved = 0;
        n.el.classList.add("grabbing");
        n.el.setPointerCapture(e.pointerId);
        startX = lastX = e.clientX;
        startY = lastY = e.clientY;
        lastT = performance.now();
        n.vx = n.vy = 0;
        void startX;
        void startY;
      };
      const onMove = (e: PointerEvent) => {
        if (!n.dragging) return;
        const rect = field.getBoundingClientRect();
        n.x = e.clientX - rect.left;
        n.y = e.clientY - rect.top;
        const now = performance.now(),
          dt = Math.max(now - lastT, 1);
        n.vx = ((e.clientX - lastX) / dt) * 16;
        n.vy = ((e.clientY - lastY) / dt) * 16;
        moved += Math.hypot(e.clientX - lastX, e.clientY - lastY);
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = now;
      };
      const release = () => {
        if (!n.dragging) return;
        n.dragging = false;
        n.el.classList.remove("grabbing");
        const sp = Math.hypot(n.vx, n.vy),
          cap = 12;
        if (sp > cap) {
          n.vx = (n.vx / sp) * cap;
          n.vy = (n.vy / sp) * cap;
        }
        if (moved < 6) openPanel(n); // treat as a click
      };
      n.el.addEventListener("pointerdown", onDown);
      n.el.addEventListener("pointermove", onMove);
      n.el.addEventListener("pointerup", release);
      n.el.addEventListener("pointercancel", release);
      cleanups.push(() => {
        n.el.removeEventListener("pointerdown", onDown);
        n.el.removeEventListener("pointermove", onMove);
        n.el.removeEventListener("pointerup", release);
        n.el.removeEventListener("pointercancel", release);
      });
    });

    // ---------- bottom stats ----------
    const totalApps = members.reduce((s, u) => s + u.apps, 0);
    const totalTpl = members.reduce((s, u) => s + u.templates, 0);
    const avgApps = members.length ? (totalApps / members.length).toFixed(1) : "0";
    statsEl.innerHTML = [
      { v: members.length, k: "Members" },
      { v: totalApps, k: "Applications" },
      { v: totalTpl, k: "Email templates" },
      { v: avgApps, k: "Avg apps / user" },
    ]
      .map(
        (s) =>
          `<div class="stat"><div class="val"><span>${s.v}</span></div><div class="key">${s.k}</div></div>`
      )
      .join("");

    // ---------- global listeners ----------
    const onScrim = () => closePanel();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    scrim.addEventListener("click", onScrim);
    document.addEventListener("keydown", onKey);

    const onResize = () => {
      const r = calcRadius();
      for (const n of nodes) {
        n.r = r;
        n.el.style.width = n.el.style.height = r * 2 + "px";
        const lbl = n.el.querySelector<HTMLDivElement>(".label");
        if (lbl) lbl.style.fontSize = r < 22 ? "10px" : "";
        n.x = Math.min(Math.max(n.x, r), W() - r);
        n.y = Math.min(Math.max(n.y, r + 72), H() - r - 110);
      }
    };
    window.addEventListener("resize", onResize);

    // ---------- cleanup ----------
    return () => {
      cancelAnimationFrame(raf);
      cleanups.forEach((fn) => fn());
      scrim.removeEventListener("click", onScrim);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      nodes.forEach((n) => n.el.remove());
      panel.innerHTML = "";
      statsEl.innerHTML = "";
    };
  }, [members]);

  return (
    <div className="admin-root" ref={rootRef}>
      {/* Same display/body typefaces the original mockup used. */}
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&f[]=general-sans@400,500,600&display=swap"
      />
      <style>{CSS}</style>

      <div className="bg-orb a" />
      <div className="bg-orb b" />
      <div className="bg-orb c" />
      <div className="grain" />

      <header>
        <div className="brand">
          <div className="dot" />
          <div>
            <span className="name">Traqit</span>
            <span className="sub">/ admin</span>
          </div>
        </div>
        <div className="hint">drag to throw · click to inspect</div>
      </header>

      <div id="admField" />

      {members.length === 0 && (
        <div className="empty">No members yet — once people sign up they’ll float in here.</div>
      )}

      <div className="stats" id="admStats" />

      <div className="scrim" id="admScrim" />
      <aside className="panel" id="admPanel" aria-hidden="true" />
    </div>
  );
}

const CSS = `
.admin-root{
  --bg:#0D0B14; --bg-2:#12101c; --ink:#ECE8F6; --ink-dim:#9A93B4; --ink-faint:#6A6386;
  --violet:#B8A4E3; --violet-strong:#7C5CFF; --violet-deep:#5B3FD6;
  --line:rgba(184,164,227,.14); --glass:rgba(22,19,34,.66);
  --display:'General Sans',sans-serif; --body:'Satoshi','General Sans',sans-serif;
  position:fixed; inset:0; z-index:100; overflow:hidden;
  background:var(--bg); color:var(--ink); font-family:var(--body);
  -webkit-font-smoothing:antialiased;
}
.admin-root *{box-sizing:border-box;margin:0;padding:0}

.admin-root .bg-orb{position:fixed;border-radius:50%;filter:blur(90px);opacity:.5;pointer-events:none;z-index:0;animation:adm-drift 28s ease-in-out infinite}
.admin-root .bg-orb.a{width:520px;height:520px;background:radial-gradient(circle,#5B3FD6,transparent 70%);top:-140px;left:-120px}
.admin-root .bg-orb.b{width:480px;height:480px;background:radial-gradient(circle,#B8A4E3,transparent 70%);bottom:-160px;right:-100px;animation-delay:-9s;opacity:.32}
.admin-root .bg-orb.c{width:360px;height:360px;background:radial-gradient(circle,#7C5CFF,transparent 70%);top:42%;left:48%;animation-delay:-16s;opacity:.28}
@keyframes adm-drift{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(40px,-30px) scale(1.08)}66%{transform:translate(-30px,25px) scale(.94)}}

.admin-root .grain{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.04;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}

.admin-root header{position:fixed;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;justify-content:space-between;padding:26px 34px;pointer-events:none}
.admin-root .brand{display:flex;align-items:center;gap:12px;pointer-events:auto}
.admin-root .brand .dot{width:11px;height:11px;border-radius:50%;background:var(--violet-strong);box-shadow:0 0 14px var(--violet-strong)}
.admin-root .brand .name{font-family:var(--display);font-weight:600;letter-spacing:-.01em;font-size:18px}
.admin-root .brand .sub{color:var(--ink-faint);font-size:13px;font-weight:500;margin-left:2px}
.admin-root .hint{pointer-events:auto;color:var(--ink-faint);font-size:12.5px;border:1px solid var(--line);border-radius:999px;padding:7px 14px;background:rgba(22,19,34,.4);backdrop-filter:blur(8px)}

.admin-root #admField{position:fixed;inset:0;z-index:3;overflow:hidden}
.admin-root .empty{position:fixed;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;color:var(--ink-dim);font-size:15px;padding:40px;text-align:center;pointer-events:none}
.admin-root .node{position:absolute;top:0;left:0;border-radius:50%;cursor:grab;will-change:transform;touch-action:none;transform:translate(-50%,-50%) scale(0);opacity:0;animation:adm-pop .6s cubic-bezier(.22,1.4,.36,1) forwards}
@keyframes adm-pop{to{transform:translate(-50%,-50%) scale(1);opacity:1}}
.admin-root .node.grabbing{cursor:grabbing}
.admin-root .node .ring{position:absolute;inset:0;border-radius:50%;padding:2px;background:linear-gradient(140deg,var(--violet),var(--violet-strong));box-shadow:0 6px 26px rgba(91,63,214,.35), 0 0 0 1px rgba(184,164,227,.18);transition:box-shadow .25s ease, transform .25s ease}
.admin-root .node:hover .ring{box-shadow:0 10px 38px rgba(124,92,255,.6), 0 0 0 1px rgba(184,164,227,.4);transform:scale(1.06)}
.admin-root .node.active .ring{box-shadow:0 0 0 4px rgba(124,92,255,.45), 0 12px 44px rgba(124,92,255,.7)}
.admin-root .node .face{width:100%;height:100%;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#2a2440,#1a1730);display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:600;color:var(--violet);position:relative}
.admin-root .node .face img{width:100%;height:100%;object-fit:cover;display:block}
.admin-root .node .label{position:absolute;left:50%;top:calc(100% + 8px);transform:translateX(-50%);white-space:nowrap;font-size:12px;color:var(--ink-dim);font-weight:500;opacity:0;transition:opacity .2s ease;pointer-events:none;background:rgba(13,11,20,.7);padding:3px 9px;border-radius:7px;backdrop-filter:blur(4px)}
.admin-root .node:hover .label{opacity:1}

.admin-root .stats{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:6;display:flex;align-items:stretch;gap:0;background:var(--glass);backdrop-filter:blur(18px) saturate(140%);border:1px solid var(--line);border-radius:18px;box-shadow:0 18px 60px rgba(0,0,0,.5);padding:6px;max-width:calc(100vw - 40px);overflow:auto}
.admin-root .stat{padding:12px 24px;display:flex;flex-direction:column;gap:3px;border-right:1px solid var(--line);min-width:120px}
.admin-root .stat:last-child{border-right:none}
.admin-root .stat .val{font-family:var(--display);font-weight:600;font-size:24px;letter-spacing:-.02em}
.admin-root .stat .val span{color:var(--violet)}
.admin-root .stat .key{font-size:11.5px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.07em}

.admin-root .scrim{position:fixed;inset:0;z-index:8;background:rgba(8,6,14,.45);backdrop-filter:blur(2px);opacity:0;pointer-events:none;transition:opacity .3s ease}
.admin-root .scrim.open{opacity:1;pointer-events:auto}
.admin-root .panel{position:fixed;top:0;right:0;bottom:0;z-index:9;width:380px;max-width:90vw;background:linear-gradient(180deg,var(--bg-2),var(--bg));border-left:1px solid var(--line);box-shadow:-30px 0 80px rgba(0,0,0,.55);transform:translateX(105%);transition:transform .42s cubic-bezier(.22,1,.36,1);padding:30px 28px;overflow-y:auto}
.admin-root .panel.open{transform:translateX(0)}
.admin-root .panel .close{position:absolute;top:22px;right:22px;width:34px;height:34px;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.03);color:var(--ink-dim);cursor:pointer;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center;transition:.2s}
.admin-root .panel .close:hover{background:rgba(124,92,255,.18);color:var(--ink)}
.admin-root .p-avatar{width:96px;height:96px;border-radius:50%;margin-bottom:18px;overflow:hidden;background:linear-gradient(135deg,#2a2440,#1a1730);box-shadow:0 0 0 2px var(--violet-strong),0 10px 30px rgba(124,92,255,.4);display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:600;font-size:34px;color:var(--violet)}
.admin-root .p-avatar img{width:100%;height:100%;object-fit:cover}
.admin-root .p-name{font-family:var(--display);font-weight:600;font-size:26px;letter-spacing:-.02em}
.admin-root .p-email{color:var(--ink-dim);font-size:14px;margin-top:4px}
.admin-root .p-meta{margin-top:8px;display:inline-flex;align-items:center;gap:7px;color:var(--ink-faint);font-size:12.5px}
.admin-root .p-meta .pulse{width:7px;height:7px;border-radius:50%;background:#5ad19a;box-shadow:0 0 8px #5ad19a}
.admin-root .p-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:26px}
.admin-root .p-card{border:1px solid var(--line);border-radius:14px;padding:16px;background:rgba(255,255,255,.02)}
.admin-root .p-card .num{font-family:var(--display);font-weight:600;font-size:30px;letter-spacing:-.02em}
.admin-root .p-card .lbl{font-size:12px;color:var(--ink-faint);margin-top:2px}
.admin-root .p-row{display:flex;justify-content:space-between;align-items:center;padding:14px 2px;border-bottom:1px solid var(--line);font-size:14px}
.admin-root .p-row:first-of-type{margin-top:24px}
.admin-root .p-row .k{color:var(--ink-dim)}
.admin-root .p-row .v{font-weight:500}
.admin-root .p-section-title{font-size:11.5px;text-transform:uppercase;letter-spacing:.09em;color:var(--ink-faint);margin-top:28px}

@media (max-width:560px){
  .admin-root .stat{padding:10px 16px;min-width:96px}
  .admin-root .stat .val{font-size:20px}
  .admin-root header{padding:18px 18px}
}
`;
