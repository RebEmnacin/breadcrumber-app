const BASE = "http://localhost:8000";

// ── Text atomize via Gemini (backend) ─────────────────────────────────────────
export async function atomizeProject(projectName, category) {
  const res = await fetch(`${BASE}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_name: projectName, category }),
  });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

export async function atomizeProjectLegacy(projectName, category) {
  return atomizeProject(projectName, category);
}

// ── File upload → Gemini analysis (backend /analyze-file) ────────────────────
// onProgress(pct: number, msg: string) is optional
export async function analyzeFile(file, onProgress) {
  onProgress?.(10, `Reading "${file.name}"…`);

  const form = new FormData();
  form.append("file", file);

  // Animate progress while waiting for Gemini (it can take 10-30s for large files)
  let fakePct = 15;
  onProgress?.(fakePct, "Sending to Gemini AI…");

  // Ticker: slowly advance from 15→88 while the real request is in flight
  const ticker = setInterval(() => {
    fakePct = Math.min(fakePct + (fakePct < 50 ? 3 : fakePct < 75 ? 1.5 : 0.5), 88);
    onProgress?.(Math.round(fakePct), "Gemini is reading your file…");
  }, 800);

  let res;
  try {
    res = await fetch(`${BASE}/analyze-file`, {
      method: "POST",
      body: form,
    });
  } finally {
    clearInterval(ticker);
  }

  onProgress?.(90, "Building your roadmap…");

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Backend error: ${res.status}`);
  }

  const parsed = await res.json();
  if (!parsed?.nodes) throw new Error("No nodes returned from AI");

  onProgress?.(100, "Done! ✨");
  return parsed;
}