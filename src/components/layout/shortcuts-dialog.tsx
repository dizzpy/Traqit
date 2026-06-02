"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Kbd } from "@/components/ui/kbd";
import { SHORTCUT_GROUPS } from "@/lib/shortcuts";

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMac(/mac/i.test(navigator.platform) || /mac/i.test(navigator.userAgent));
  }, []);

  const renderKey = (k: string) => (k === "Mod" ? (isMac ? "⌘" : "Ctrl") : k);

  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" size="md">
      <div className="px-6 py-5 flex flex-col gap-6">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-1.5">
            <p className="text-2xs font-semibold uppercase tracking-wide text-text-muted">
              {group.title}
            </p>
            {group.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1">
                <span className="text-sm text-text-secondary">{item.label}</span>
                <span className="flex items-center gap-1">
                  {item.keys.map((k, i) => (
                    <Kbd key={i}>{renderKey(k)}</Kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Modal>
  );
}
