# SmartAttend

A complete full-stack attendance system built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO for real-time features.

## Folder Structure

```
smartattend/
├── backend/            # Express.js server, MongoDB connection, Socket.IO
│   ├── .env            # Environment variables (create from .env.example)
│   ├── .env.example    # Example environment variables
│   ├── package.json    # Backend dependencies
│   └── server.js       # Entry point for backend
└── frontend/           # React.js app created with Vite
    ├── .env            # Environment variables (create from .env.example)
    ├── .env.example    # Example environment variables
    ├── package.json    # Frontend dependencies
    ├── src/            # React source code
    │   ├── App.jsx     # Main App component
    │   └── index.css   # Main CSS (Tailwind integrated)
    └── vite.config.js  # Vite configuration
```

## Prerequisites

- Node.js (v18+ recommended)
- MongoDB (running locally or MongoDB Atlas URI)

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd smartattend
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

## Environment Variables

### Backend (`backend/.env`)
Create a `.env` file in the `backend` directory with the following variables:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smartattend
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend` directory with the following variables:
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Running the Project

### Start Backend
1. Open a terminal and navigate to `backend`.
2. Start the development server:
   ```bash
   npm run dev
   ```
   *The server will run on http://localhost:5000*

### Start Frontend
1. Open a new terminal and navigate to `frontend`.
2. Start the React development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on http://localhost:5173*

## Technologies Used

- **Frontend**: React.js, Vite, React Router, Axios, Tailwind CSS, Socket.IO Client
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JSON Web Tokens (JWT), Socket.IO
