import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

class AtomizerAI:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.model_id = "gemini-2.5-flash"

    async def generate_roadmap(self, project_name: str, category: str) -> list:
        prompt = f"""
You are an ADHD-friendly productivity coach specializing in breaking down creative and technical projects.

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
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt
            )
            return self._parse_ai_response(response.text)
        except Exception as e:
            print(f"Generation Error: {e}")
            return [
                {
                    "category": "Pre-Production",
                    "subtasks": [f"Open a blank document for {project_name}", "List 3 ideas", "Pick the best one"]
                },
                {
                    "category": "Production",
                    "subtasks": ["Draft the first section", "Review and refine", "Add details"]
                },
                {
                    "category": "Finishing",
                    "subtasks": ["Final review", "Share or publish", "Celebrate!"]
                }
            ]

    def _parse_ai_response(self, raw_text: str) -> list:
        try:
            clean_text = raw_text.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(clean_text)
            # Validate it's a list of objects with category and subtasks
            if isinstance(parsed, list) and all("category" in p and "subtasks" in p for p in parsed):
                return parsed
            raise ValueError("Invalid format")
        except Exception as e:
            print(f"Parsing Error: {e}")
            return [
                {
                    "category": "Getting Started",
                    "subtasks": ["Open your workspace", "Write down your goal", "Set a 15-min timer"]
                },
                {
                    "category": "Core Work",
                    "subtasks": ["Draft the first part", "Review progress", "Refine and improve"]
                },
                {
                    "category": "Wrap Up",
                    "subtasks": ["Final check", "Save your work", "Mark as done!"]
                }
            ]