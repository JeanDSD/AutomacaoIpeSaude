import { useCallback, useEffect, useState } from 'react';

/** Contagem regressiva em segundos. total = 0 desliga o cronômetro. */
export function useCountdown(total: number, autoStart = true) {
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(autoStart && total > 0);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      setRunning(false);
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [running, remaining]);

  const reset = useCallback(
    (start = true) => {
      setRemaining(total);
      setRunning(start && total > 0);
    },
    [total],
  );

  const toggle = useCallback(() => setRunning((r) => !r), []);

  return { remaining, running, reset, toggle, setRunning };
}
