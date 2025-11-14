import { useState } from 'react';
import PlanCard from '../components/PlanCard';
import { fallbackDemo } from '../data/demoFlow';

type DemoFlow = typeof fallbackDemo;

const loadFlow = (): DemoFlow => {
  const stored = localStorage.getItem('amily-demo-flow');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return fallbackDemo;
    }
  }
  return fallbackDemo;
};

export default function DemoReplayScreen() {
  const [flow, setFlow] = useState<DemoFlow>(loadFlow);

  return (
    <div className="screen">
      <h1>Offline Demo Replay</h1>
      <p>Replays the last successful flow with zero network calls.</p>
      <div className="card">
        <button className="primary-btn" onClick={() => setFlow(loadFlow())}>
          Replay last saved flow
        </button>
        <button onClick={() => setFlow(fallbackDemo)}>Use fallback sample</button>
      </div>
      <section style={{ marginTop: 24 }}>
        <h2>Transcript</h2>
        <p>{flow.transcript}</p>
      </section>
      {flow.plan && (
        <section style={{ marginTop: 24 }}>
          <h2>Plan</h2>
          <PlanCard summary={flow.plan.summary} next={flow.plan.next_step} mood={flow.plan.mood} tags={flow.plan.tags} />
        </section>
      )}
      {flow.memory && (
        <section style={{ marginTop: 24 }}>
          <h2>MemoryLane</h2>
          <p>{flow.memory.story_3_sentences}</p>
          <blockquote>{flow.memory.quote}</blockquote>
        </section>
      )}
      {flow.buddy && (
        <section style={{ marginTop: 24 }}>
          <h2>Buddy summary</h2>
          <p>
            {flow.buddy.summary} • {flow.buddy.suggestion}
          </p>
        </section>
      )}
    </div>
  );
}
