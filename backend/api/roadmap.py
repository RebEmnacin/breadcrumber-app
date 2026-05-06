from models import RoadmapNode, SubTask
import uuid

class RoadmapEngine:
    def __init__(self):
        self.max_phases = 5

    def construct_visual_path(self, phases: list) -> list:
        nodes = []
        for i, phase in enumerate(phases):
            subtasks = [
                SubTask(
                    subtask_id=str(uuid.uuid4()),
                    title=subtask,
                    is_completed=False,
                    xp_value=50
                )
                for subtask in phase.get("subtasks", [])
            ]
            nodes.append(RoadmapNode(
                node_id=i,
                title=phase["category"],
                category=phase["category"],
                is_locked=True if i > 0 else False,
                node_type=self._get_node_type(i, len(phases)),
                position_index=i,
                xp_value=150,
                subtasks=subtasks
            ))
        return nodes

    def _get_node_type(self, index: int, total: int) -> str:
        if index == 0: return "start"
        if index == total - 1: return "finish"
        if index == total // 2: return "milestone"
        return "breadcrumb"