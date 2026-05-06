from models import RoadmapNode

class RoadmapEngine:
    def __init__(self):
        self.max_breadcrumbs = 10

    def construct_visual_path(self, tasks: list) -> list:
        nodes = []
        for i, task_title in enumerate(tasks):
            nodes.append(RoadmapNode(
                node_id=i,
                title=task_title,
                is_locked=True if i > 0 else False,
                node_type=self._get_node_type(i),
                position_index=i
            ))
        return nodes

    def _get_node_type(self, index: int) -> str:
        if index == 0: return "start"
        if index == 9: return "finish"
        if index == 4: return "milestone"
        return "breadcrumb"