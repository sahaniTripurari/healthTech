# 🏥 HealthAI — AI-Powered Patient Monitoring System

> **Intelligent healthcare platform** with AI-driven symptom analysis, real-time patient monitoring, and smart health insights.

---

## 🌟 Features

### 🤖 AI Health Assistant
- **Natural Language Symptom Analysis** — Describe your symptoms in plain text or voice, and get AI-powered guidance using Google Gemini API.
- **Voice Input Support** — Web Speech API integration for hands-free interaction.
- **Typing Animation** — Smooth, real-time response rendering for a conversational feel.

### 📋 Patient Record Management
- **Patient Profile** — Store personal medical data (age, gender, blood group, height).
- **Disease Intelligence** — Search and tag from 40+ medical conditions (Diabetes, Hypertension, PCOS, Alzheimer's, etc.).
- **Dynamic Vital Tracking** — Vitals auto-populate based on selected diseases (e.g., selecting "Diabetes" shows Blood Sugar field).
- **Lifestyle Metrics** — Track sleep, water intake, steps, and exercise with interactive sliders.
- **AI Health Insights** — One-click AI analysis with risk assessment and personalized recommendations.

### 📊 Health Intelligence Dashboard
- **Interactive Charts** — Weekly bar charts and monthly line charts with hover tooltips, delta arrows, and normal-range bands.
- **Calendar View** — Visual record of daily health data entries with dot indicators.
- **Multi-User Monitoring** — Search and add other users to monitor their health data.
- **Summary Cards** — Animated health score, total records, active alerts, and monitored users count.
- **Export Options** — Download data as CSV, generate PDF reports, or print directly.

### 🔐 Authentication & Security
- **Email/Password Auth** — Secure registration and login with bcrypt password hashing.
- **Google OAuth 2.0** — One-click Google Sign-In with Passport.js.
- **JWT Tokens** — Stateless authentication for all API endpoints.
- **Profile Management** — Change name, email, password, and upload profile photo.
- **Password Reset** — OTP-based password recovery via email.

### 🏃 Google Fit Integration
- **Auto-Sync** — Background cron job syncs steps, heart rate, and calories from Google Fit every 60 seconds.
- **Token Refresh** — Automatic OAuth token refresh for uninterrupted data flow.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3 (Glassmorphism), Vanilla JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **AI Engine** | Google Gemini 1.5 Flash API |
| **Auth** | JWT, Passport.js, bcrypt, Google OAuth 2.0 |
| **Real-time** | Socket.IO |
| **File Upload** | Multer |
| **Email** | Nodemailer |
| **Fitness Sync** | Google Fit REST API |
| **Performance** | Compression, Cache-Control, Deferred Loading |

---

## 📁 Project Structure

```
healthTech/
├── config/
│   └── googleStrategy.js       # Google OAuth passport strategy
├── controllers/
│   ├── authController.js       # Login, Register, Forgot Password
│   ├── dashboardController.js  # Dashboard data aggregation
│   ├── recordController.js     # Save diseases, vitals, lifestyle
│   └── userController.js       # Profile CRUD, photo upload
├── middleware/
│   ├── authMiddleware.js       # JWT verification middleware
│   └── upload.js               # Multer file upload config
├── models/
│   ├── DailyRecord.js          # Daily health record schema
│   └── User.js                 # User schema with medical fields
├── routes/
│   ├── auth.js                 # Auth routes (login/register/me)
│   ├── dashboard.js            # Dashboard data routes
│   ├── googleAuthRoutes.js     # Google OAuth callback routes
│   ├── recordRoutes.js         # Record CRUD routes
│   └── userRoutes.js           # User profile & search routes
├── script/
│   ├── home.js                 # SPA navigation, auth card, profile drawer
│   ├── ai-assistant.js         # AI chat logic, voice input
│   ├── dashbord.js             # Dashboard charts, calendar, export
│   ├── records.js              # Disease selection, vitals, lifestyle
│   ├── contact.js              # Contact form handler
│   ├── about.js                # About page animations
│   └── googleHandler.js        # Google OAuth token handler
├── services/
│   ├── fitnessCron.js          # Google Fit sync cron job
│   └── googleFitService.js     # Google Fit API integration
├── style/
│   ├── themes.css              # CSS variables & global theme
│   ├── home.css                # Home page, navbar, auth, drawer
│   ├── ai-assistant.css        # AI chat page (fully responsive)
│   ├── contact.css             # Contact page (fully responsive)
│   ├── dashboard.css           # Dashboard charts & cards
│   ├── records.css             # Record page forms
│   └── about.css               # About page styles
├── index.html                  # Single Page Application (all pages)
├── server.js                   # Express server entry point
├── package.json                # Dependencies & scripts
└── .gitignore                  # Ignored files
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or Atlas)
- **Google Gemini API Key**

### Installation

```bash
# Clone the repository
git clone https://github.com/sahaniTripurari/healthTech.git
cd healthTech

# Install dependencies
npm install

# Create .env file
```

### Environment Variables

Create a `.env` file in the root directory:

```env
MONGO_URI=mongodb://127.0.0.1:27017/healthAI
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
PORT=5000
```

### Run the Server

```bash
npm start
```

Open `http://localhost:5000` in your browser.

---

## 🌐 Deployment on Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo: `sahaniTripurari/healthTech`
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add all environment variables from `.env`
6. Deploy!

---

## 👥 Team

| Name | Role |
|------|------|
| Tripurari Sahani | Full Stack Developer |

---

## 📄 License

This project is built for the **SYBCA Hackathon** — AI Healthcare Innovation.

© 2026 HealthAI. All rights reserved.
