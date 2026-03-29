import { useStore } from '../state/store';
import { useRef, useEffect } from 'react';

export default function Timeline() {
  const timeline = useStore(s => s.timeline);
  const clearTimeline = useStore(s => s.clearTimeline);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline.length]);

  const typeClass = (t: string) => {
    if (t === 'success') return 'te-green';
    if (t === 'error') return 'te-red';
    if (t === 'warning') return 'te-amber';
    return 'te-blue';
  };

  return (
    <aside className="timeline-panel">
      <div className="tp-header">
        <span className="tp-title">📋 Event Log</span>
        <button className="tp-clear" onClick={clearTimeline}>Clear</button>
      </div>
      <div className="tp-list">
        {timeline.length === 0 && (
          <div className="tp-empty">Events will appear as you deploy services and simulate traffic</div>
        )}
        {timeline.map(evt => (
          <div key={evt.id} className={`te ${typeClass(evt.type)}`}>
            <span className="te-time">{evt.time}</span>
            <span className="te-icon">{evt.icon}</span>
            <span className="te-text">{evt.text}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </aside>
  );
}
