from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from models import ProjectRequest, ProjectRoadmap, ProjectUpdate, RewardUpdate, UserDashboard
from utils.ai_helper import AtomizerAI
from api.roadmap import RoadmapEngine
from api.rewards import ProgressEngine

app = FastAPI(title="The Breadcrumber API — BreadCrumbAlgo Edition")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_boss     = AtomizerAI()
map_boss    = RoadmapEngine()
reward_boss = ProgressEngine()
db          = {"projects": {}}


# ── 1. Atomize from project name (Gemini text roadmap) ────────────────────────
@app.post("/projects", response_model=ProjectRoadmap)
async def create_project(request: ProjectRequest):
    """Main Atomize! endpoint — Gemini generates phases + subtasks from a name."""
    phases  = await ai_boss.generate_roadmap(request.project_name, request.category)
    nodes   = map_boss.construct_visual_path(phases)
    project = ProjectRoadmap(
        project_name=request.project_name,
        category=request.category,
        nodes=nodes,
    )
    db["projects"][project.project_id] = project
    return project


# Legacy alias
@app.post("/atomize", response_model=ProjectRoadmap)
async def atomize_legacy(request: ProjectRequest):
    return await create_project(request)


# ── 2. Analyze an uploaded file → Gemini → roadmap JSON ──────────────────────
@app.post("/analyze-file")
async def analyze_file(file: UploadFile = File(...)):
    """
    Accept a file upload (PDF, image, txt, md…).
    Sends it to Gemini via the backend where the API key lives.
    Returns { project_name, nodes } ready to load into the roadmap.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file received")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    media_type = file.content_type or "application/octet-stream"

    # Sniff from extension when browser sends generic type
    fname = (file.filename or "").lower()
    if media_type in ("application/octet-stream", ""):
        if fname.endswith(".pdf"):
            media_type = "application/pdf"
        elif fname.endswith((".jpg", ".jpeg")):
            media_type = "image/jpeg"
        elif fname.endswith(".png"):
            media_type = "image/png"
        elif fname.endswith(".gif"):
            media_type = "image/gif"
        elif fname.endswith(".webp"):
            media_type = "image/webp"
        else:
            media_type = "text/plain"

    try:
        result = await ai_boss.analyze_file(file_bytes, media_type, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        print(f"[/analyze-file] error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")

    return result  # { project_name, nodes: [...] }


# ── 3. Edit project ───────────────────────────────────────────────────────────
@app.patch("/projects/{project_id}")
async def edit_project(project_id: str, update: ProjectUpdate):
    project = db["projects"].get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for key, value in update.dict(exclude_none=True).items():
        setattr(project, key, value)
    return project


# ── 4. Sub-atomize a node ─────────────────────────────────────────────────────
@app.post("/tasks/{node_id}/atomize")
async def atomize_on_the_fly(project_id: str, node_id: str):
    project = db["projects"].get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    parent = next((n for n in project.nodes if str(n.node_id) == node_id), None)
    if not parent:
        raise HTTPException(status_code=404, detail="Node not found")
    return await ai_boss.atomize_subtask(parent.title)


# ── 5. Dashboard ──────────────────────────────────────────────────────────────
@app.get("/dashboard")
async def get_dashboard():
    return UserDashboard(streak_count=0, total_points=0, level_progress=0.0)


# ── 6. Complete task / XP ─────────────────────────────────────────────────────
@app.post("/complete-task")
async def complete_task(update: RewardUpdate):
    xp = reward_boss.calculate_xp(update.session_minutes, update.is_pomodoro_complete)
    return {"gained_xp": xp, "task_id": update.task_id, "status": "Success"}


# ── 7. Health ─────────────────────────────────────────────────────────────────
@app.get("/health")
def check_health():
    return {"status": "online", "version": "3.1.0", "algo": "BreadCrumbAlgo"}