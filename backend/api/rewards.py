class ProgressEngine:
    def __init__(self):
        self.xp_multiplier = 10 

    def calculate_xp(self, minutes: int, is_pomodoro: bool) -> int:
        base = minutes * self.xp_multiplier
        bonus = 50 if is_pomodoro else 0
        return base + bonus

    def generate_certificate_data(self, project_name: str):
        return {
            "title": f"Master of {project_name}",
            "issue_date": "2026-05-05",
            "message": "You ate all the breadcrumbs!"
        }