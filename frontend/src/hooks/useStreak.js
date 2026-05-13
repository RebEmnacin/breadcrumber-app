import { useState, useEffect } from "react";

// Normalize a Date to midnight (start of day) in local time
function toMidnight(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysDiff(a, b) {
  // Returns how many calendar days apart two dates are
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((toMidnight(a) - toMidnight(b)) / msPerDay);
}

export function useStreak() {
  const [streak, setStreak] = useState(0);

  // On mount: check if streak should be broken (>1 day gap since last activity)
  useEffect(() => {
    const saved    = Number(localStorage.getItem("streak") || 0);
    const lastTs   = localStorage.getItem("lastStreakDate");

    if (!lastTs || saved === 0) {
      setStreak(saved);
      return;
    }

    const now  = new Date();
    const last = new Date(Number(lastTs));
    const diff = daysDiff(now, last); // positive = today is that many days after last

    if (diff === 0 || diff === 1) {
      // Today or yesterday — streak still valid
      setStreak(saved);
    } else {
      // More than 1 calendar day gap — streak broken
      setStreak(0);
      localStorage.setItem("streak", "0");
      localStorage.removeItem("lastStreakDate");
    }
  }, []);

  // Also run a periodic check every minute so the UI auto-updates at midnight
  useEffect(() => {
    const interval = setInterval(() => {
      const saved  = Number(localStorage.getItem("streak") || 0);
      const lastTs = localStorage.getItem("lastStreakDate");
      if (!lastTs || saved === 0) return;

      const diff = daysDiff(new Date(), new Date(Number(lastTs)));
      if (diff > 1) {
        setStreak(0);
        localStorage.setItem("streak", "0");
        localStorage.removeItem("lastStreakDate");
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const updateStreak = () => {
    const now      = new Date();
    const lastTs   = localStorage.getItem("lastStreakDate");
    const saved    = Number(localStorage.getItem("streak") || 0);

    if (lastTs) {
      const diff = daysDiff(now, new Date(Number(lastTs)));
      if (diff === 0) return; // already updated today
    }

    const newStreak = saved + 1;
    setStreak(newStreak);
    localStorage.setItem("streak", String(newStreak));
    localStorage.setItem("lastStreakDate", String(Date.now()));
  };

  const resetStreak = () => {
    setStreak(0);
    localStorage.setItem("streak", "0");
    localStorage.removeItem("lastStreakDate");
  };

  return { streak, updateStreak, resetStreak };
}