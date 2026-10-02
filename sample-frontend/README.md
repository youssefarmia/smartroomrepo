## Getting Started

### Prerequisites
- Git
- Python 3.10+ (with pip)
- Node.js 18+ (with npm)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd <repo-folder-name>
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
```

Activate the virtual environment:
- Windows: `venv\Scripts\activate`
- Mac/Linux: `source venv/bin/activate`

Install dependencies:
```bash
pip install -r requirements.txt
```

Run the backend server:
```bash
python -m uvicorn main:app --reload
```

The backend will be running at `http://127.0.0.1:8000`. You can view the interactive API docs at `http://127.0.0.1:8000/docs`.

### 3. Frontend setup
Open a **new terminal window** (leave the backend running in the first one):
```bash
cd sample-frontend
npm install
npm run dev
```

The dashboard will be available at the URL printed in the terminal (usually `http://localhost:5173`).

### 4. Using the app
Open the frontend URL in your browser. The dashboard will start polling the backend automatically — sensor values, device states, and automations are all running server-side as soon as the backend starts.