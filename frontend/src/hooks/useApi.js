const BASE = "http://localhost:8000";

// ── Text atomize via Gemini (backend) ─────────────────────────────────────────
export async function atomizeProject(projectName, category) {
  const res = await fetch(`${BASE}/atomize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_name: projectName, category }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Backend error: ${res.status}`);
  }
  const data = await res.json();
  if (!data?.nodes || data.nodes.length === 0) {
    throw new Error("No roadmap nodes returned from AI");
  }
  return data;
}

// ── File upload → Gemini analysis (backend /analyze-file) ────────────────────
export async function analyzeFile(file, onProgress) {
  onProgress?.(10, `Reading "${file.name}"…`);

  const form = new FormData();
  form.append("file", file);

  let fakePct = 15;
  onProgress?.(fakePct, "Sending to Gemini AI…");

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