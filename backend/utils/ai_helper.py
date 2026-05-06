import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

class AtomizerAI:
    def __init__(self):
        # The new SDK automatically looks for GOOGLE_API_KEY in env
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.model_id = "gemini-2.5-flash"

    async def _determine_scope(self, project_name: str) -> str:
        prompt = (
            f"Analyze the project '{project_name}'. "
            "Return a JSON object with 'scope' (SHORT/LONG) and 'recommended_steps' (integer between 5 and 15)."
            """You are a world-class Executive Function Consultant specializing in ADHD productivity. 
            Your goal is to eliminate 'Task Paralysis' for the project: '{project_name}' ({category}).

            ### STRATEGY: MICRO-ATOMIZATION
            Since this is a {scope} project, you will focus on {scope_instruction}. 
            Break this down into EXACTLY {step_count} nodes.

            ### HARD RULES (LOGIC)
            1. NO FLUFF: Every step must be a concrete, physical action.
            2. BRAIN-DEAD START: Step 1 must be so easy it's impossible to fail (e.g., "Touch the keyboard," "Sit at the desk," "Open a blank tab").
            3. 15-MINUTE CAP: No single step should take longer than 15 minutes of focused effort.
            4. VERB-FIRST: Every string must start with a high-momentum verb (e.g., "Draft," "Gather," "Click," "Sketch").
            5. NO SUB-LISTS: Do not include nested steps. One thought per breadcrumb.

            ### OUTPUT FORMAT
            - Return ONLY a raw JSON array of strings.
            - NO markdown formatting (no ```json).
            - NO conversational filler."""
        )
        try:
            # New SDK syntax: models.generate_content
            response = self.client.models.generate_content(
                model=self.model_id, 
                contents=prompt
            )
            return response.text.strip().upper()
        except Exception as e:
            print(f"Scope Error: {e}")
            return "LONG"

    async def generate_roadmap(self, project_name: str, category: str) -> list:
        scope = await self._determine_scope(project_name)
        scope_instruction = "the entire project" if scope == "SHORT" else "only the FIRST PHASE"

        prompt = f"""
        Break '{project_name}' ({category}) into tiny, 15-minute steps.
        Focus on {scope_instruction}.
        Return ONLY a JSON array of strings. 
        Example: ["Step 1", "Step 2"]
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_id, 
                contents=prompt
            )
            return self._parse_ai_response(response.text)
        except Exception as e:
            print(f"Generation Error: {e}")
            # Dynamic fallback that at least uses the project name
            return [f"Plan {project_name}", "Gather materials", "Setup workspace", "Step 4", "Step 5", "Step 6", "Step 7", "Step 8", "Step 9", "Final Review"]

    def _parse_ai_response(self, raw_text: str) -> list:
        try:
            # The new SDK is better at stripping markdown, but we'll be safe
            clean_text = raw_text.replace("```json", "").replace("```", "").strip()
            tasks = json.loads(clean_text)
            return tasks
        except Exception as e:
            print(f"Parsing Error: {e}")
            return ["Start", "Research", "Draft", "Refine", "Complete"]