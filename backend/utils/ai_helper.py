import os
import json
import asyncio
from functools import partial
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


class AtomizerAI:
    def __init__(self):
        self.client   = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model_id = "llama-3.3-70b-versatile"

    async def _generate(self, prompt: str) -> str:
        loop = asyncio.get_event_loop()
        fn   = partial(
            self.client.chat.completions.create,
            model=self.model_id,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=4000,
        )
        response = await loop.run_in_executor(None, fn)
        return response.choices[0].message.content.strip()

    # ── Text atomize ──────────────────────────────────────────────────────────
    async def generate_roadmap(self, project_name: str, category: str) -> list:
        prompt = f"""You are an ADHD-friendly productivity coach.

Break "{project_name}" ({category}) into 3-5 phases with 3-5 subtasks each.
Rules: action verbs only, 15-min max per task, first task must be brain-dead easy, NO markdown.
Return ONLY a raw JSON array, nothing else:
[{{"category":"Phase Name","subtasks":["Task 1","Task 2","Task 3"]}}]"""

        try:
            text = await self._generate(prompt)
            return self._parse_phases(text)
        except Exception as e:
            print(f"[AtomizerAI] generate_roadmap error: {e}")
            return self._fallback_phases(project_name)

    # ── File analysis — 3-level nested format ─────────────────────────────────
    async def analyze_file(self, file_bytes: bytes, media_type: str, filename: str) -> dict:
        TEXT_TYPES = {"text/plain", "text/markdown", "text/csv"}
        fname = (filename or "").lower()
        if media_type not in TEXT_TYPES:
            if fname.endswith((".txt", ".md", ".csv")):
                media_type = "text/plain"

        if media_type in TEXT_TYPES:
            file_text = file_bytes.decode("utf-8", errors="replace")[:10000]
        else:
            if media_type == "application/pdf" or fname.endswith(".pdf"):
                file_text = self._extract_pdf_text(file_bytes)
            else:
                raise ValueError("Please upload a PDF or TXT file.")

        prompt = f"""You are an expert academic content analyzer and ADHD productivity coach.

Read this file content carefully. Extract every major topic, subtopic, concept, and any assessments.

Produce a structured 3-LEVEL study roadmap in this EXACT JSON format:

{{
  "project_name": "short title of the module or file",
  "nodes": [
    {{
      "node_id": 0,
      "title": "Major Topic or Chapter Name",
      "is_completed": false,
      "subtasks": [
        {{
          "subtask_id": "0-0",
          "title": "Subtopic or Concept Name",
          "is_completed": false,
          "subtasks": [
            {{ "subtask_id": "0-0-0", "title": "Write notes", "is_completed": false }}
          ]
        }},
        {{
          "subtask_id": "0-1",
          "title": "Another Subtopic",
          "is_completed": false,
          "subtasks": [
            {{ "subtask_id": "0-1-0", "title": "Write notes", "is_completed": false }}
          ]
        }},
        {{
          "subtask_id": "0-2",
          "title": "Seatwork: GCD Exercise",
          "is_completed": false,
          "subtasks": [
            {{ "subtask_id": "0-2-0", "title": "Answer seatwork", "is_completed": false }},
            {{ "subtask_id": "0-2-1", "title": "Review answers", "is_completed": false }}
          ]
        }}
      ]
    }}
  ]
}}

STRICT RULES:
1. Return ONLY raw JSON — no markdown fences, no explanation, nothing else
2. node_id starts at 0 and increments by 1
3. subtask_id format: "nodeIndex-subtaskIndex" for level 2, "nodeIndex-subtaskIndex-childIndex" for level 3
4. Each NODE = one major topic or chapter from the file
5. Each SUBTASK = one specific subtopic or concept under that topic
6. Each SUBTASK must have its own "subtasks" array with at least one child:
   - Always include "Write notes" as a child subtask
   - If the subtask is an assessment, add relevant action children instead
7. If file contains Quiz/Assignment/Activity/Seatwork/Exam — add as a subtask with prefix and give it action children like "Answer [name]", "Review answers"
8. Do NOT lump everything into one node — spread across meaningful categories
9. Keep titles concise (under 10 words) but descriptive
10. is_completed is always false

File content:
{file_text}"""

        try:
            raw = await self._generate(prompt)
        except Exception as e:
            raise ValueError(f"Groq API error: {e}")

        clean = raw.strip().replace("```json", "").replace("```", "").strip()
        if not clean.startswith("{"):
            start = clean.find("{")
            if start != -1:
                clean = clean[start:]

        try:
            parsed = json.loads(clean)
        except json.JSONDecodeError as e:
            raise ValueError(f"Could not parse response: {e}\nRaw: {raw[:300]}")

        if "nodes" not in parsed:
            raise ValueError(f"Missing 'nodes'. Keys: {list(parsed.keys())}")

        return parsed

    def _extract_pdf_text(self, file_bytes: bytes) -> str:
        try:
            import io
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text[:10000]
        except ImportError:
            raise ValueError("pypdf not installed. Run: pip install pypdf")
        except Exception as e:
            raise ValueError(f"Could not read PDF: {e}")

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
