/**
 * Loading fallback for the (main) segment. Deliberately minimal — just a calm
 * "loading" line in the subtitle style, centered on the app background.
 */
export default function MainLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-bg px-6">
      <p className="text-sm font-medium text-text-muted">loading</p>
    </div>
  );
}
