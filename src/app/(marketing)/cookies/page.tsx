export default function CookiesPage() {
  const sections = [
    {
      title: "What is a cookie?",
      body: "A cookie is a small file stored in your browser that helps websites remember information about your visit.",
    },
    {
      title: "What cookies does Traqit use?",
      body: "Traqit uses one cookie: a session cookie that keeps you signed in. It is set when you log in and cleared when you sign out or it expires.",
    },
    {
      title: "What we do not use",
      body: "We do not use advertising cookies, tracking cookies, third-party analytics cookies, or any cookie that follows you across other websites.",
    },
    {
      title: "How to remove cookies",
      body: "You can clear cookies at any time from your browser settings. This will sign you out of Traqit.",
    },
    {
      title: "Questions?",
      body: "Email hello@encrivolabs.com",
    },
  ]

  return (
    <main className="max-w-2xl mx-auto px-6 py-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-3">Legal</p>
      <h1
        className="text-3xl font-semibold text-text-primary tracking-tight mb-2"
        style={{ fontFamily: "var(--font-family-display)" }}
      >
        Cookies Policy
      </h1>
      <p className="text-sm text-text-tertiary mb-12">Last updated: June 2026</p>
      <div className="space-y-8">
        {sections.map((s) => (
          <div key={s.title}>
            <h2 className="text-sm font-semibold text-text-primary mb-2">{s.title}</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
