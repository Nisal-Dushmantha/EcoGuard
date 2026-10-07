import { useEffect, useState } from 'react';

export function WorkspaceClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <time className="command-date" dateTime={now.toISOString()}>
      {now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      {' · '}
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })}
      </span>
    </time>
  );
}
