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
    node_type: str = "breadcrumb"   # start | breadcrumb | milestone | finish
    position_index: int = 0
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

class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None

class RewardUpdate(BaseModel):
    user_id: str = ""
    project_id: str = ""
    task_id: int = 0
    session_minutes: int
    is_pomodoro_complete: bool = True

class UserDashboard(BaseModel):
    streak_count: int = 5
    total_points: int = 500
    level_progress: float = 45.5
