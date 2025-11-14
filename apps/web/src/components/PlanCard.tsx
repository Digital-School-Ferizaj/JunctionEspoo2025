type Props = {
  summary: string;
  next: string;
  mood: string;
  tags: string[];
};

export default function PlanCard({ summary, next, mood, tags }: Props) {
  return (
    <section className="card" aria-live="polite">
      <h2>Today&apos;s plan</h2>
      <p>
        <strong>Summary • </strong>
        {summary}
      </p>
      <p>
        <strong>Next small step • </strong>
        {next}
      </p>
      <p>
        <strong>Mood • </strong>
        {mood}
      </p>
      <div style={{ marginTop: 12 }}>
        {(tags ?? []).map((tag) => (
          <span key={tag} style={{ marginRight: 8, fontSize: '0.9rem' }}>
            #{tag}
          </span>
        ))}
      </div>
    </section>
  );
}
