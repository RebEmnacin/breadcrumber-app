<p align="center">
  <img src="frontend/public/favicon.svg" width="80" alt="Breadcrumber logo" />
</p>

<h1 align="center">🍞 Breadcrumber</h1>

<p align="center">
  <img src="frontend/src/assets/breadcat-chomp.gif" width="160" alt="Bread cat chomping a cookie" />
</p>

<p align="center"><strong>An ADHD-friendly productivity app that breaks any project into tiny, doable steps — one breadcrumb at a time.</strong></p>

Breadcrumber takes a project idea (like *"Write a Short Story"* or *"Build an IKEA Wardrobe"*) and uses AI to break it into a visual roadmap of bite-sized 15-minute tasks. Complete tasks, earn XP, and ride the dopamine wave of actually finishing things.

---

## ✨ Features

- **🤖 AI Atomizer** — Type a project name and category, and the AI instantly generates a structured roadmap of phases and subtasks, each designed to take 15 minutes or less.
- **📄 File Upload Analysis** — Upload a PDF, TXT, or Markdown file (e.g. a course module or syllabus) and Breadcrumber builds a full 3-level study roadmap from the content automatically.
- **🗺️ Visual Roadmap** — Tasks are laid out as a winding, unlockable path. Nodes are locked until you complete the one before — no skipping ahead.
- **🎮 XP & Gamification** — Earn XP for every completed task. Bonus XP for finishing a full Pomodoro session. Watch your progress bar fill up.
- **🔥 Streak Tracking** — Stay consistent and keep your streak alive.
- **⏱️ Pomodoro Integration** — Built-in session timer to keep you in the zone.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite |
| Backend | FastAPI, Uvicorn |
| AI Engine | Groq API (LLaMA 3.3 70B) |
| Data Validation | Pydantic |
| PDF Parsing | pypdf |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Groq API key](https://console.groq.com)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/breadcrumber-app.git
cd breadcrumber-app
```

### 2. Set up environment variables

Create a `.env` file inside the `backend/` folder:

```
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Start the backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be running at `http://localhost:8000`.

### 4. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app will be running at `http://localhost:5173`.

### ⚡ Subsequent runs

You don't need to reinstall dependencies every time. Just:

```bash
# Terminal 1 — Backend
cd backend && venv\Scripts\activate && uvicorn main:app --reload

# Terminal 2 — Frontend
cd frontend && npm run dev
```

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/projects` | Atomize a project by name and category |
| `POST` | `/analyze-file` | Upload a file and generate a study roadmap |
| `PATCH` | `/projects/{id}` | Edit an existing project |
| `POST` | `/complete-task` | Mark a task complete and receive XP |
| `GET` | `/dashboard` | Get user stats (streak, XP, level) |
| `GET` | `/health` | Health check |

---

## 🧠 How It Works

1. **You give it a project name** — e.g. *"Learn Spanish"*
2. **The Atomizer** sends it to the AI with a strict prompt: *"Break this into 3–5 phases, 3–5 subtasks each, 15 minutes max per task, first task must be brain-dead easy."*
3. **The Roadmap Engine** takes those tasks and builds a visual node path — locked in sequence, with the first node ready to go.
4. **You complete tasks** — the Rewards Engine calculates XP based on time spent and whether you finished a full Pomodoro.
5. **You feel good.** Repeat.

---

## 📁 Project Structure

```
breadcrumber-app/
├── backend/
│   ├── main.py            # FastAPI routes
│   ├── models.py          # Pydantic data models
│   ├── requirements.txt
│   ├── api/
│   │   ├── roadmap.py     # Roadmap construction logic
│   │   └── rewards.py     # XP & progress engine
│   └── utils/
│       └── ai_helper.py   # Groq/LLaMA AI integration
└── frontend/
    ├── src/
    │   ├── App.jsx         # Main app component
    │   ├── context/        # App-wide state
    │   └── hooks/          # Custom hooks (streak, timer, persistence)
    └── public/
```

---

## 🤝 Contributing

Pull requests are welcome! If you have ideas for new features or find a bug, feel free to open an issue.

---

## 🐱 Meet the Mascot

<p align="center">
  <img src="frontend/src/assets/buffer-loading.png" width="160" alt="Bread cat fishing — loading screen" />
  <br/>
  <em>Bread Cat patiently waiting while the AI cooks up your roadmap...</em>
</p>

---

## 👥 Team

Built by **Team F.I.S.H** 🐟

---

## 📄 License

MIT
