from fastapi import FastAPI, HTTPException
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

ai_boss = AtomizerAI()
map_boss = RoadmapEngine()
reward_boss = ProgressEngine()
db = {"projects": {}}

# ── 1. Atomize (create roadmap from project name) ─────────────────────────────
@app.post("/projects", response_model=ProjectRoadmap)
async def create_project(request: ProjectRequest):
    """Main Atomize! endpoint — uses Gemini AI to generate phases + subtasks."""
    phases = await ai_boss.generate_roadmap(request.project_name, request.category)
    nodes  = map_boss.construct_visual_path(phases)
    project = ProjectRoadmap(
        project_name=request.project_name,
        category=request.category,
        nodes=nodes,
    )
    db["projects"][project.project_id] = project
    return project

# ── Legacy endpoint alias (keeps old /atomize calls working too) ──────────────
@app.post("/atomize", response_model=ProjectRoadmap)
async def atomize_legacy(request: ProjectRequest):
    return await create_project(request)

# ── 2. Edit project ───────────────────────────────────────────────────────────
@app.patch("/projects/{project_id}")
async def edit_project(project_id: str, update: ProjectUpdate):
    project = db["projects"].get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for key, value in update.dict(exclude_none=True).items():
        setattr(project, key, value)
    return project

# ── 3. Sub-atomize a node ─────────────────────────────────────────────────────
@app.post("/tasks/{node_id}/atomize")
async def atomize_on_the_fly(project_id: str, node_id: str):
    project = db["projects"].get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    parent = next((n for n in project.nodes if str(n.node_id) == node_id), None)
    if not parent:
        raise HTTPException(status_code=404, detail="Node not found")
    sub_tasks = await ai_boss.atomize_subtask(parent.title)
    return sub_tasks

# ── 4. Dashboard ──────────────────────────────────────────────────────────────
@app.get("/dashboard")
async def get_dashboard():
    return UserDashboard(streak_count=0, total_points=0, level_progress=0.0)

# ── 5. Complete task / XP ─────────────────────────────────────────────────────
@app.post("/complete-task")
async def complete_task(update: RewardUpdate):
    xp = reward_boss.calculate_xp(update.session_minutes, update.is_pomodoro_complete)
    return {"gained_xp": xp, "task_id": update.task_id, "status": "Success"}

# ── 6. Health ─────────────────────────────────────────────────────────────────
@app.get("/health")
def check_health():
    return {"status": "online", "version": "3.0.0", "algo": "BreadCrumbAlgo"}
