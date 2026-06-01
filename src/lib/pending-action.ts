/**
 * One-shot hand-off for keyboard-shortcut actions that need a route change
 * first (e.g. pressing "n" from /calendar should land on /applications and
 * then open the "New application" panel).
 *
 * The global shortcut handler sets a pending action and navigates; the target
 * page consumes it once on mount. Lives in a module variable so it survives
 * client-side navigation but is naturally cleared on a full reload.
 */
let pending: string | null = null;

export function setPendingAction(action: string): void {
  pending = action;
}

/** Returns true (and clears) only if the pending action matches `action`. */
export function consumePendingAction(action: string): boolean {
  if (pending === action) {
    pending = null;
    return true;
  }
  return false;
}
