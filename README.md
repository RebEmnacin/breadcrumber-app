# 🍞 BreadCrumber — Team F.I.S.H

## Running the App

### Backend (Terminal 1)
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

### Frontend (Terminal 2)
cd frontend
npm install
npm run dev