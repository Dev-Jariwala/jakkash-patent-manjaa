import { useEffect, useState } from "react";
import { getProcessingElapsedSeconds } from "@/lib/whatsappDelivery";

export function useProcessingElapsedSeconds(startedAt, isActive) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    isActive ? getProcessingElapsedSeconds(startedAt) : 0
  );

  useEffect(() => {
    if (!isActive || !startedAt) {
      setElapsedSeconds(0);
      return;
    }

    setElapsedSeconds(getProcessingElapsedSeconds(startedAt));

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(getProcessingElapsedSeconds(startedAt));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [startedAt, isActive]);

  return elapsedSeconds;
}
