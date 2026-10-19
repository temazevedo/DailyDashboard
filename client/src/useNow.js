import { useEffect, useState } from 'react';

// Shared clock state for the whole header: one tick per second drives the
// digital clock dial and everything time-based that follows.
export default function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}
