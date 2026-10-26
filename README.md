# AutoCareSystem - Full-Stack Vehicle Maintenance Application

AutoCareSystem is a modern full-stack auto care management system featuring a **Node.js (JavaScript) + Express + SQLite Backend API** and a **React + Vite + Tailwind CSS Frontend Web Application** (as well as an Android Compose Mobile Frontend).

---

## Quick Start (Running Frontend & Backend)

### 1. Start the Backend API (Port 3000)

```bash
cd backend
npm install
npm run dev
```

The REST API server will start at `http://localhost:3000`.

### 2. Start the React Web Frontend (Port 5173)

In a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## Project Structure

```
AutoCareSystem/
├── backend/                  # Node.js + Express (JavaScript) + SQLite REST API
│   ├── src/
│   │   ├── controllers/      # Auth, Vehicles, Services, Maintenance, Dashboard
│   │   ├── db/               # SQLite database & table initialization
│   │   ├── middleware/       # JWT Auth token middleware
│   │   ├── routes/           # Express API routes
│   │   └── server.js         # Express server entry point
│   └── package.json
│
└── frontend/                 # React + Vite + Tailwind CSS Web Frontend
    ├── src/
    │   ├── components/       # Navbar, UI layout
    │   ├── pages/            # Login, Dashboard, Vehicles, BookService, History
    │   ├── api.js            # Axios REST client with JWT interceptor
    │   ├── App.jsx           # React Router & Auth provider
    │   └── main.jsx
    ├── index.html
    ├── package.json          # Vite & React dependencies (npm run dev)
    └── vite.config.js
```

---

## Features

- 🚘 **Vehicle Garage**: Register, manage, and update multiple vehicles with make, model, year, VIN, and current mileage.
- 🔧 **Service Appointments**: Schedule oil changes, brake inspections, tire rotations, and engine repairs with date selection & notes.
- 📜 **Maintenance Logs & History**: Complete record of performed services, maintenance costs ($), and technician notes.
- 📊 **Dashboard Analytics**: Real-time stats on total registered vehicles, active appointments, completed services, and total maintenance spend.
- 🔒 **User Authentication**: Secure JWT token login & registration with encrypted passwords (`bcryptjs`).
