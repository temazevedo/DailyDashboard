import useNow from '../useNow.js';

// Plain digital time, same scheme as before: hours #FFF, minutes #CCC,
// seconds #AAA, separators #555.
export default function Header() {
  const now = useNow();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const date = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(now);

  return (
    <header className="header">
      <p className="header-date">{date}</p>
      <p className="header-sep" aria-hidden="true">|</p>
      <p
        className="clock"
        role="timer"
        aria-label={`current time ${hh}:${mm}:${ss}`}
      >
        <span className="time-h">{hh}</span>
        <span className="time-colon">:</span>
        <span className="time-m">{mm}</span>
        <span className="time-colon">:</span>
        <span className="time-s">{ss}</span>
      </p>
    </header>
  );
}
