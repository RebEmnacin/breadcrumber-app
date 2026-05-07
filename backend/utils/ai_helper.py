import os
import json
import asyncio
from functools import partial
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()


class AtomizerAI:
    def __init__(self):
        self.client   = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.model_id = "gemini-2.5-flash"

    # ── helpers: run blocking SDK calls off the event loop ───────────────────
    async def _generate(self, contents):
        """Wrap the synchronous Gemini SDK call in a thread so FastAPI stays non-blocking."""
        loop = asyncio.get_event_loop()
        fn   = partial(
            self.client.models.generate_content,
            model=self.model_id,
            contents=contents,
        )
        response = await loop.run_in_executor(None, fn)
        return response.text

    # ── 1. Text-only roadmap from a project name ──────────────────────────────
    async def generate_roadmap(self, project_name: str, category: str) -> list:
        prompt = f"""You are an ADHD-friendly productivity coach specializing in breaking down creative and technical projects.

Break the project '{project_name}' ({category}) into 3-5 major phases.
For each phase, provide 3-5 tiny subtasks that each take no longer than 15 minutes.

HARD RULES:
1. Every subtask must start with a strong action verb (e.g. "Sketch", "Write", "Open", "List", "Draft").
2. Each subtask must be concrete and physical — no vague steps.
3. The first subtask of the first phase must be brain-dead easy (e.g. "Open a blank document").
4. NO fluff, NO explanations, NO markdown.

Return ONLY a raw JSON array in this exact format:
[
  {{
    "category": "Phase Name",
    "subtasks": ["Subtask 1", "Subtask 2", "Subtask 3"]
  }}
]
"""
        try:
            text = await self._generate(prompt)
            return self._parse_phases(text)
        except Exception as e:
            print(f"[AtomizerAI] generate_roadmap error: {e}")
            return self._fallback_phases(project_name)

    # ── 2. File-based roadmap ─────────────────────────────────────────────────
    async def analyze_file(self, file_bytes: bytes, media_type: str, filename: str) -> dict:
        """Send file to Gemini and return { project_name, nodes }."""

        analysis_prompt = """You are an expert academic content analyzer and ADHD productivity coach.

Analyze this file thoroughly. Identify ALL topics, chapters, lessons, and assessments (quizzes, assignments, activities, labs, exams).

Return ONLY valid JSON — no markdown fences, no preamble, nothing else:
{
  "project_name": "short descriptive title from the content",
  "nodes": [
    {
      "node_id": 1,
      "title": "Phase or Chapter Name",
      "is_completed": false,
      "subtasks": [
        { "subtask_id": "1-1", "title": "Review: specific topic", "is_completed": false },
        { "subtask_id": "1-2", "title": "Quiz: topic name", "is_completed": false }
      ]
    }
  ]
}

RULES:
- Each node = one major topic / chapter / phase
- Each subtask = one specific review item, concept, or assessment (start with an action verb)
- Prefix assessments: "Quiz:", "Assignment:", "Activity:", "Lab:", "Exam:"
- Spread content meaningfully across nodes — do NOT lump everything into one node
"""

        TEXT_TYPES = {"text/plain", "text/markdown", "text/csv"}
        BINARY_TYPES = {"application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp"}

        # Normalise media type from extension if needed
        fname = (filename or "").lower()
        if media_type not in TEXT_TYPES and media_type not in BINARY_TYPES:
            if fname.endswith((".txt", ".md", ".csv")):
                media_type = "text/plain"
            elif fname.endswith(".pdf"):
                media_type = "application/pdf"
            elif fname.endswith((".jpg", ".jpeg")):
                media_type = "image/jpeg"
            elif fname.endswith(".png"):
                media_type = "image/png"
            else:
                media_type = "text/plain"

        if media_type in TEXT_TYPES:
            text_content = file_bytes.decode("utf-8", errors="replace")[:12000]
            contents = f"{analysis_prompt}\n\nFile content:\n{text_content}"
        else:
            part_file = types.Part.from_bytes(data=file_bytes, mime_type=media_type)
            contents  = [part_file, analysis_prompt]

        try:
            raw = await self._generate(contents)
        except Exception as e:
            raise ValueError(f"Gemini API error: {e}")

        clean = raw.strip().replace("```json", "").replace("```", "").strip()

        # Sometimes Gemini wraps in an extra object — try to find the JSON
        if not clean.startswith("{"):
            start = clean.find("{")
            if start != -1:
                clean = clean[start:]

        try:
            parsed = json.loads(clean)
        except json.JSONDecodeError as e:
            raise ValueError(f"Could not parse Gemini JSON response: {e}\nRaw: {raw[:300]}")

        if "nodes" not in parsed:
            raise ValueError(f"Gemini response missing 'nodes' field. Got keys: {list(parsed.keys())}")

        return parsed

    # ── 3. Sub-atomize ────────────────────────────────────────────────────────
    async def atomize_subtask(self, parent_title: str) -> list:
        return [
            f"Break down: {parent_title} — step 1",
            f"Break down: {parent_title} — step 2",
            f"Break down: {parent_title} — step 3",
        ]

    # ── helpers ───────────────────────────────────────────────────────────────
    def _parse_phases(self, raw_text: str) -> list:
        try:
            clean  = raw_text.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(clean)
            if isinstance(parsed, list) and all("category" in p and "subtasks" in p for p in parsed):
                return parsed
            raise ValueError("Invalid format")
        except Exception as e:
            print(f"[AtomizerAI] _parse_phases error: {e}")
            return self._fallback_phases("your project")

    def _fallback_phases(self, project_name: str) -> list:
        return [
            {"category": "Getting Started", "subtasks": [f"Open a blank document for {project_name}", "Write down the main goal", "Set a 15-min timer"]},
            {"category": "Core Work",       "subtasks": ["Draft the first section", "Review progress", "Refine and improve"]},
            {"category": "Wrap Up",         "subtasks": ["Final review", "Save your work", "Mark as done!"]},
        ]