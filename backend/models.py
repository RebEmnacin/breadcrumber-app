from pydantic import BaseModel, Field
from typing import List, Optional
import uuid

class SubTask(BaseModel):
    subtask_id: str
    title: str
    is_completed: bool = False
    xp_value: int = 50

class RoadmapNode(BaseModel):
    node_id: int
    title: str
    category: str
    is_locked: bool = True
    is_completed: bool = False
    node_type: str = "breadcrumb"  # start, breadcrumb, milestone, finish
    position_index: int
    xp_value: int = 150
    subtasks: List[SubTask] = []

class ProjectRoadmap(BaseModel):
    project_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_name: str
    category: str
    nodes: List[RoadmapNode]
    current_streak: int = 0
    total_progress: float = 0.0

class ProjectRequest(BaseModel):
    project_name: str
    category: str
    difficulty: Optional[str] = "beginner"

class RewardUpdate(BaseModel):
    user_id: str
    project_id: str
    task_id: int
    session_minutes: int
    is_pomodoro_complete: bool = True