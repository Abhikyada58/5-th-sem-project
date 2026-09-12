# SmartAttend - Zero-Trust Biometric Attendance Platform

SmartAttend is a modern educational SaaS platform designed to eliminate proxy attendance in classrooms. It combines rolling cryptographic QR codes with strict zero-trust facial biometrics to securely verify student identities in real-time.

---

## 1. Project Overview
Proxy attendance is a persistent issue in modern education. SmartAttend solves this by ensuring that a student is not only physically present in the classroom (via a time-sensitive, rotating QR code displayed on the teacher's projector) but also verifying their identity instantly using a 128-dimensional mathematical facial descriptor matched directly on the backend.

## 2. Features
- **Role-Based Access Control**: Secure portals for Admins, Teachers, and Students.
- **Projector-Ready Teacher Dashboard**: Dynamic QR codes for classroom scanning.
- **Mobile-First Student Scanners**: Custom targeting reticles for rapid QR acquisition.
- **Zero-Trust Facial Biometrics**: AES-256 encrypted biometric embeddings.
- **Live Notifications**: Real-time Socket.IO feedback for teachers.
- **Enterprise Security**: Helmet, Rate Limiting, Mongo Sanitization, and JWT cookies.
- **Comprehensive Auditing**: Granular audit logs tracking every state change.

## 3. Technology Stack
- **Frontend**: React (Vite), Tailwind CSS, React Router, Socket.IO Client, `face-api.js` (TensorFlow.js wrapper).
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.IO, JSON Web Tokens (JWT), `bcrypt`.
- **Cryptography**: Node `crypto` (AES-256-CBC).

## 4. Folder Structure
```text
smartattend/
├── backend/
│   ├── config/       # Database & Socket configuration
│   ├── controllers/  # API route logic (Auth, Attendance, Face, Admin)
│   ├── middleware/   # JWT Auth guards, Rate limiters, Error handling
│   ├── models/       # Mongoose schemas (User, Class, Attendance, etc.)
│   ├── routes/       # Express route definitions
│   ├── services/     # Audit & Liveness integration services
│   ├── utils/        # Cryptography and math helpers
│   └── server.js     # Express app entry point
└── frontend/
    ├── public/       # Static assets and AI model files
    ├── src/
    │   ├── components/ # Reusable UI components & Auth guards
    │   ├── context/    # React Context (Auth, Socket)
    │   ├── layouts/    # Global Dashboard & Navigation layouts
    │   ├── pages/      # Views separated by role (Student, Teacher, Admin)
    │   ├── App.jsx     # Frontend Router
    │   └── main.jsx    # React DOM entry
```

## 5. MongoDB Setup
SmartAttend requires a MongoDB database (either local MongoDB Community Server or MongoDB Atlas).
- Ensure MongoDB is running locally on port `27017` or obtain your Atlas URI.

## 6. Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smartattend
JWT_SECRET=your_super_secret_32_byte_string_here_must_be_long
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```
*Note: `JWT_SECRET` is also used as the AES-256-CBC salt. It must be at least 32 characters long.*

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 7. Installation Commands
From the root directory:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## 8. Development Commands
You will need two terminal windows.
```bash
# Terminal 1: Start Backend (Port 5000)
cd backend
npm run dev

# Terminal 2: Start Frontend (Port 5173)
cd frontend
npm run dev
```

## 9. Face Model Setup
The `face-api.js` models (`ssdMobilenetv1`, `faceLandmark68Net`, `faceRecognitionNet`) are loaded dynamically from a CDN (`https://cdn.jsdelivr.net/gh/vladmandic/face-api/model/`) in the `FaceVerification.jsx` and `FaceEnrollment.jsx` components. No local model files are required unless you choose to self-host them in the `public/models` directory.

## 10. How to create an Admin account
Currently, the first user must be created manually or via the API. 
Use Postman/cURL or use the `Register` page initially to create an account, then manually update the role to `ADMIN` in MongoDB:
```javascript
db.users.updateOne({ email: "admin@school.edu" }, { $set: { role: "ADMIN" } })
```

## 11. How to create a Teacher account
1. Log in as an `ADMIN`.
2. Navigate to the "Teachers" sidebar tab.
3. Click "Add New Teacher" (or register normally and have Admin elevate the role).
4. Navigate to "Classes" and "Subjects" to assign the Teacher to specific subjects.

## 12. How to create a Student account
1. Students can register themselves at `/register` using their `.edu` email.
2. Admins can view/manage students in the Admin Dashboard.
3. The student must log in and complete the **Setup Wizard** (Assigning their Class and Enrolling their Face).

## 13. How to start attendance
1. A Teacher logs in and navigates to the Teacher Dashboard.
2. The Teacher selects a Subject/Class and a Duration (e.g., 5 Minutes).
3. The dashboard transforms into Projector Mode, displaying a massive, time-sensitive QR code.

## 14. How Face Enrollment works
1. The student navigates to `/student/enroll-face`.
2. The frontend camera captures 5 high-quality frames.
3. `face-api.js` extracts a 128-dimensional `Float32Array` from each frame.
4. The arrays are mathematically averaged to create a master descriptor.
5. The master descriptor is sent to the backend, AES-256 encrypted, and stored in MongoDB.

## 15. How Attendance Verification works
1. The student scans the Teacher's QR code.
2. The backend cryptographically verifies the QR token and issues a 5-minute Handoff Token.
3. The student points the camera at their face.
4. The frontend extracts a live 128-dimensional descriptor.
5. The live descriptor and Handoff Token are sent to the backend.
6. The backend decrypts the master template, calculates the Euclidean distance against the live template. If the distance is `<= 0.45`, attendance is marked `PRESENT`.

## 16. Security Limitations & Biometric Nuances
- **Face Detection is NOT Face Recognition**: Finding a face in a frame (detection) is fundamentally different from verifying the mathematical uniqueness of that face against a database (recognition). SmartAttend performs *both*, but rely strictly on Euclidean distance thresholds for recognition.
- **Face Recognition is NOT Liveness Detection**: Recognition determines *who* is in the photo. Liveness determines *if* the photo is a real 3D human or a 2D photograph/video screen.
- **Frontend Spoofing**: We explicitly avoid simple frontend blink-detection (which is easily spoofed). True liveness (3D depth, texture analysis, challenge-response) requires a trusted enterprise provider. We have exposed `services/liveness.service.js` for integration with services like AWS Rekognition or FaceTec.

## 17. Production Deployment Instructions
1. **Reverse Proxy**: Use Nginx or AWS ALB to terminate SSL. *HTTPS is strictly required for camera access in modern browsers.*
2. **Environment**: Set `NODE_ENV=production` in the backend. This enables secure cookies and disables stack traces.
3. **Database**: Use a managed cluster like MongoDB Atlas.
4. **Build**: Run `npm run build` in the frontend and serve statically, or use a PaaS like Vercel/Netlify.

## 18. Testing Instructions
The backend uses Jest and Supertest for integration testing.

To run the test suite:
```bash
cd backend
npm run test
```
The test suite covers:
- Role-based authorization blocks.
- QR token cryptographic validation.
- Biometric Euclidean distance bounds testing.
- Duplicate attendance prevention triggers.
- Active session expirations.
