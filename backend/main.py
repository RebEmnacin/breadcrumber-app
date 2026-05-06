from fastapi import FastAPI
from models import ProjectRequest, ProjectRoadmap, RewardUpdate
from utils.ai_helper import AtomizerAI
from api.roadmap import RoadmapEngine
from api.rewards import ProgressEngine

app = FastAPI(title="The Breadcrumber API")
ai_boss = AtomizerAI()
map_boss = RoadmapEngine()
reward_boss = ProgressEngine()

@app.post("/atomize", response_model=ProjectRoadmap)
async def create_roadmap(request: ProjectRequest):
    # 1. AI generates tasks
    tasks = await ai_boss.generate_roadmap(request.project_name, request.category)
    # 2. Map engine builds the visual nodes
    nodes = map_boss.construct_visual_path(tasks)
    # 3. Return the full roadmap
    return ProjectRoadmap(
        project_name=request.project_name,
        category=request.category,
        nodes=nodes
    )

@app.post("/complete-task")
async def complete_task(update: RewardUpdate):
    xp = reward_boss.calculate_xp(update.session_minutes, update.is_pomodoro_complete)
    return {"gained_xp": xp, "task_id": update.task_id, "status": "Success"}

@app.get("/health")
def check_health():
    return {"status": "online", "version": "2.0.0"}