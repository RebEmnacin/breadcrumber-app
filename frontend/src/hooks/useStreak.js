import { useState, useEffect } from "react";

export function useStreak() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("streak");
    const lastDate = localStorage.getItem("lastStreakDate");

    if (saved && lastDate) {
      const now = new Date();
      const last = new Date(Number(lastDate));

      // Check if last activity was yesterday or today
      const todayStr = now.toDateString();
      const lastStr = last.toDateString();
      const yesterdayStr = new Date(now - 86400000).toDateString();

      if (lastStr === todayStr || lastStr === yesterdayStr) {
        // Streak still valid
        setStreak(Number(saved));
      } else {
        // Streak broken — more than 1 day gap
        setStreak(0);
        localStorage.setItem("streak", 0);
      }
    }
  }, []);

  const updateStreak = () => {
    const now = new Date();
    const todayStr = now.toDateString();
    const lastDate = localStorage.getItem("lastStreakDate");
    const lastStr = lastDate ? new Date(Number(lastDate)).toDateString() : null;

    // Only increment once per day
    if (lastStr === todayStr) return;

    const saved = Number(localStorage.getItem("streak") || 0);
    const newStreak = saved + 1;
    setStreak(newStreak);
    localStorage.setItem("streak", newStreak);
    localStorage.setItem("lastStreakDate", Date.now());
  };

  const resetStreak = () => {
    setStreak(0);
    localStorage.setItem("streak", 0);
    localStorage.removeItem("lastStreakDate");
  };

  return { streak, updateStreak, resetStreak };
}