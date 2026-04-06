# 🍳 KitchenOS — Cloud Kitchen Management System

A full-stack web application for managing kitchen staff and their schedules.
Built as a BCA DevOps project using Node.js, MongoDB, Docker, and GitHub Actions.

---

## 📁 Project Structure

```
kitchen-management/
├── backend/
│   ├── server.js          # Express API server
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── index.html         # Main UI
│   ├── style.css          # Styles
│   ├── app.js             # API calls & DOM logic
│   └── Dockerfile
├── .github/
│   └── workflows/
│       └── ci.yml         # GitHub Actions CI/CD
├── docker-compose.yml     # Orchestrates all services
├── .gitignore
└── README.md
```

---

## 🚀 How to Run

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [Git](https://git-scm.com/) installed

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/your-username/kitchen-management.git
cd kitchen-management
```

**2. Start the full stack**
```bash
docker-compose up --build
```

**3. Open the app**
- Frontend → [http://localhost:3000](http://localhost:3000)
- Backend API → [http://localhost:5000/api/tasks](http://localhost:5000/api/tasks)
- MongoDB → `mongodb://localhost:27017/kitchendb`

**4. Stop the app**
```bash
docker-compose down
```

To also remove stored data:
```bash
docker-compose down -v
```

---

## 🔌 API Endpoints

| Method | Endpoint          | Description        |
|--------|-------------------|--------------------|
| GET    | /api/tasks        | Get all tasks      |
| POST   | /api/tasks        | Create a new task  |
| PATCH  | /api/tasks/:id    | Update task status |
| DELETE | /api/tasks/:id    | Delete a task      |

### Sample POST Body
```json
{
  "title": "Prep vegetables",
  "staff": "Ravi Kumar",
  "shift": "Morning (6AM–2PM)"
}
```

---

## ⚙️ Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Frontend   | HTML, CSS, Vanilla JS   |
| Backend    | Node.js + Express       |
| Database   | MongoDB                 |
| Container  | Docker + Docker Compose |
| CI/CD      | GitHub Actions          |

---

## 🔄 CI/CD Pipeline

On every push to `main`, GitHub Actions will:
1. Checkout the code
2. Build the backend Docker image
3. Build the frontend Docker image
4. Run `docker compose up` to verify the full stack

See `.github/workflows/ci.yml` for details.

---

## 👨‍💻 Author

Srinidhi S — Cloud Kitchen Management System
