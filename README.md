# 🍞 BreadCrumber — Team F.I.S.H

## Running the App

### Backend (Terminal 1)
- cd backend
- python -m venv venv
- venv\Scripts\activate
- pip install -r requirements.txt
- uvicorn main:app --reload

### Frontend (Terminal 2)
- cd frontend
- npm install
- npm run dev

### next time you don't need to run pip install and npm install again. Just:

### Terminal 1: Backend
- cd backend
- venv\Scripts\activate
- uvicorn main:app --reload

### Terminal 2: Frontend
- cd frontend
- npm run dev