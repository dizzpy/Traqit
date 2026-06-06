export default function PrivacyPage() {
  const sections = [
    {
      title: "1. What we collect",
      body: "When you sign in, we store your email address and display name from your Supabase auth session. When you use the app, we store the data you enter: job applications, pipeline stages, saved jobs, email templates, and profile preferences. We do not collect any data you don't directly enter.",
    },
    {
      title: "2. How we use it",
      body: "Your data is used only to provide the Traqit service to you. We use it to show you your applications, send interview reminders (if enabled), and personalise your experience. We do not use your data for advertising, analytics, or any purpose beyond operating the app.",
    },
    {
      title: "3. Who can see your data",
      body: "Only you. Your applications and notes are private to your account. We do not share, sell, or expose your data to any third party. Traqit staff may access data only to resolve a technical issue you've reported.",
    },
    {
      title: "4. Data storage",
      body: "Your data is stored in a Supabase PostgreSQL database hosted in the Asia-Pacific region. Data is encrypted at rest and in transit.",
    },
    {
      title: "5. Cookies",
      body: "We use a single session cookie to keep you signed in. No advertising or tracking cookies are used.",
    },
    {
      title: "6. Deleting your data",
      body: "You can delete all your applications from your profile page at any time. To delete your account entirely, email hello@encrivolabs.com and we will remove everything within 7 days.",
    },
    {
      title: "7. Contact",
      body: "Questions? Email hello@encrivolabs.com",
    },
  ]

  return (
    <main className="max-w-2xl mx-auto px-6 py-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-3">Legal</p>
      <h1
        className="text-3xl font-semibold text-text-primary tracking-tight mb-2"
        style={{ fontFamily: "var(--font-family-display)" }}
      >
        Privacy Policy
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
