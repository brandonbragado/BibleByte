import { shellTabs, uiTheme } from "@biblebites/ui";

const cards = [
  {
    title: "Today's Lesson",
    body: "Verse reference, NIV placeholder text, context, reflection, prayer, and action step."
  },
  {
    title: "Progress",
    body: "Daily streak, weekly consistency, completed lessons, and reflection history."
  },
  {
    title: "Bookmarks",
    body: "Save lessons and revisit key scripture sessions later."
  }
];

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: uiTheme.colors.warmWhite,
        color: uiTheme.colors.textPrimary,
        padding: 24,
        fontFamily: "Inter, system-ui, sans-serif"
      }}
    >
      <h1 style={{ marginTop: 0 }}>BibleBites Web Shell</h1>
      <p style={{ color: uiTheme.colors.textSecondary }}>
        Calm, premium MVP shell mirrored from iOS. Scripture text remains NIV placeholder until licensing approval.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0 24px" }}>
        {shellTabs.map((tab: string) => (
          <span
            key={tab}
            style={{
              border: `1px solid ${uiTheme.colors.border}`,
              borderRadius: 999,
              padding: "6px 12px",
              background: "#fff"
            }}
          >
            {tab}
          </span>
        ))}
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {cards.map((card) => (
          <article
            key={card.title}
            style={{
              background: "#fff",
              border: `1px solid ${uiTheme.colors.border}`,
              borderRadius: uiTheme.radius.md,
              padding: uiTheme.spacing.md
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 20 }}>{card.title}</h2>
            <p style={{ margin: 0, color: uiTheme.colors.textSecondary }}>{card.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
