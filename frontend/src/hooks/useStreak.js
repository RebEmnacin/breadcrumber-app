import { useState, useEffect } from "react";

export function useStreak() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("streak");
    const lastDate = localStorage.getItem("lastCompletionDate");

    if (saved && lastDate) {
      const hoursSinceLast =
        (Date.now() - Number(lastDate)) / (1000 * 60 * 60);

      if (hoursSinceLast > 24) {
        // Streak broken
        setStreak(0);
        localStorage.setItem("streak", 0);
      } else {
        setStreak(Number(saved));
      }
    }
  }, []);

  const updateStreak = () => {
    const newStreak = streak + 1;
    setStreak(newStreak);
    localStorage.setItem("streak", newStreak);
    localStorage.setItem("lastCompletionDate", Date.now());
  };

  const resetStreak = () => {
    setStreak(0);
    localStorage.setItem("streak", 0);
  };

  return { streak, updateStreak, resetStreak };
}