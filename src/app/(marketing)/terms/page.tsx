export default function TermsPage() {
  const sections = [
    {
      title: "1. Who this is for",
      body: "Traqit is a job application tracker built for software engineering students. By using Traqit, you agree to these terms.",
    },
    {
      title: "2. Your account",
      body: "You are responsible for keeping your login secure. Do not share your account. We may suspend accounts that violate these terms.",
    },
    {
      title: "3. Acceptable use",
      body: "Use Traqit to track your own job applications. Do not attempt to access other users data, reverse-engineer the app, or use it for any unlawful purpose.",
    },
    {
      title: "4. Your data",
      body: "You own the data you enter. We do not claim any rights over your application notes, templates, or pipeline data. See our Privacy Policy for how we handle it.",
    },
    {
      title: "5. Service availability",
      body: "We aim for high availability but do not guarantee uninterrupted access. We may update or change features with reasonable notice.",
    },
    {
      title: "6. Free plan",
      body: "The Free plan is provided as-is with no warranty. We reserve the right to introduce limits in the future with at least 30 days notice to existing users.",
    },
    {
      title: "7. Limitation of liability",
      body: "Traqit is provided as is. We are not liable for missed applications, lost data, or any other outcome related to your job hunt.",
    },
    {
      title: "8. Contact",
      body: "hello@encrivolabs.com",
    },
  ]

  return (
    <main className="max-w-2xl mx-auto px-6 py-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-3">Legal</p>
      <h1
        className="text-3xl font-semibold text-text-primary tracking-tight mb-2"
        style={{ fontFamily: "var(--font-family-display)" }}
      >
        Terms of Service
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
