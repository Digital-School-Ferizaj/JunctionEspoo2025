type Props = {
  streak: number;
  social: number;
  activity: number;
};

export default function UtopiaMeter({ streak, social, activity }: Props) {
  const total = Math.min(100, streak * 5 + social * 10 + activity * 10);
  const status = total > 70 ? 'glow' : total > 40 ? 'steady' : 'gentle';
  return (
    <div className="card" aria-label="Utopia Meter">
      <div className="meter">
        <span>Utopia Meter</span>
        <strong>{total}%</strong>
      </div>
      <p>Status: {status}</p>
      <p>
        Streak {streak} day(s) • Social {social} • Activity {activity}
      </p>
    </div>
  );
}
