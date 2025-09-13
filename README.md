<p align="center">
  <img src="https://github.com/haider-sama/Haideron-LMS/blob/master/devlog/github_banner.png" alt="Banner" width="512" height="128">
</p>

<h1 align="center">Haideron-LMS</h1>

<p align="center">
  A <strong>scalable, modern outcome-based Learning Management System (LMS)</strong> built for institutions that value performance, reliability, and ease of use.
  Designed with <strong>Node.js, TypeScript, PostgreSQL (via Drizzle ORM)</strong>, and <strong>Redis (for the social layer)</strong> — Haideron-LMS delivers a smooth, secure, and intuitive learning experience for administrators, faculty, and students.
</p>

<br>

<p>
  ⭐ <b>If you find this project helpful, consider giving it a star on GitHub — it motivates us to keep improving!</b> ⭐
</p>

<br>

## 📑 Table of Contents
- [✨ Features](#-features)
  - [🔑 Authentication & Security](#-authentication--security)
  - [📚 Core Academic Management](#-core-academic-management)
  - [🎓 Outcomes & Mapping](#-outcomes--mapping)
  - [👩‍🏫 Teacher Dashboard](#-teacher-dashboard)
  - [👨‍🎓 Student Dashboard](#-student-dashboard)
  - [🌐 Social Layer (Community)](#-social-layer-community)
  - [⚙️ Admin Features](#-admin-features)
- [🛠️ Installation & Setup](#️-installation--setup)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

<br>

## ✨ Features

### 🔑 Authentication & Security
- 🔒 **Custom JWT-Auth System** with refresh & access tokens  
- ⏱️ **15-minute access tokens** (auto-refresh every 10 minutes) for a seamless experience  
- 🧑‍⚖️ **Strict Role-Based Access Control (RBAC)**  
- 🚦 **Rate Limiting** & Input Sanitization for security  
- 📝 **Audit Logs** – all critical academic actions logged for compliance  
- 🔑 **Google Login** for quick sign-in  
- 🧩 **Advanced Registration/Login System**  
  - Reset password flow  
  - Email migration (if allowed by admin)  
  - Session logout management  
  - **Dark Mode** (academic layer only – social layer coming soon)

<br>

### 📚 Core Academic Management
- 🎓 **Program Management** – create & manage degree programs  
- 📑 **Catalogue Management** – share course catalogues across multiple batches  
  - Catalogue templates act as **blueprints for semester creation**  
  - Easily reuse the same courses across multiple semesters  
- 📖 **Course & Course Offering Management**  
  - Handle **pre-requisite & co-requisite** requirements  
  - Support **multiple sections per course**  
  - Assign course instructors seamlessly  
- 🗓️ **Semester Management**  
  - One-click **semester activation & deactivation**  
  - Auto-fetch relevant data for the active semester  
  - Built-in **deadline handling** for smooth academic operations  
- 👥 **Batch Management** – create/edit/delete batches (e.g., `2022-CS`), auto-enroll students  
- 👩‍🏫 **Faculty Management** – add/edit/remove faculty (by department heads)  

<br>

### 🎓 Outcomes & Mapping
- 🏆 **PEOs, PLOs, CLOs** – manage program, learning & course outcomes  
- 🛠️ **Mapping Tools** – robust PEO↔PLO & PLO↔CLO mapping for accreditation readiness  

<br>

### 👩‍🏫 Teacher Dashboard
- 📥 Auto-fetch assigned courses for the active semester  
- 🗓️ **Attendance Management** – create date-specific attendance, reuse across sections  
- 📝 **Assessment Management** – create, mark & grade assessments  
- 📊 **Custom Grading Schemes** per course offering  
- ✅ **Result Finalization** – submit results to department heads for approval  

<br>

### 👨‍🎓 Student Dashboard
- 📌 Automatically shows enrolled courses for the active semester  
- 🎯 One-click **section enrollment**  
- 👀 Simple & clean interface for **attendance & grade visibility**  
- 📄 **Academic Transcript**  
  - Handles repeated/failed course scenarios automatically  
  - Generates a clean, accurate transcript view  

<br>

### 🌐 Social Layer (Community)
- 💬 Forums, posts, comments with likes/upvotes/downvotes  
- 🖼️ Multiple post formats (text, media, etc.)  
- 🔄 **Infinite Scrolling + Pagination** (Reddit/Instagram style)  
- 📱 Clean, mobile-friendly UX  
- ⚡ **Backed by Redis** for blazing-fast performance  

<br>

### ⚙️ Admin Features
- 🛠️ **Admin Panel** – configure system settings with ease  
- 👤 **User Management** – bulk user creation, password reset, avatar changes, user deletion  
- 📜 **Logging System** – track & audit critical operations  
- 🧠 **Minimal Training Required** – optimized for usability by non-technical staff  

<br>

## 🛠️ Installation & Setup

```bash
# Clone the repo
git clone https://github.com/haider-sama/Haideron-LMS.git

# Install dependencies
cd Haideron-LMS
cd client/
npm install
cd server/
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with DB credentials, JWT secrets, etc.

# Run migrations
cd server/
npm run db:migrate
npm run db:push

# Start development server
cd client/
npm run dev
cd server/
npm run dev
```

<br>

## 🤝 Contributing

We ❤️ contributions from developers!
- Fork the repository
- Create a new branch (git checkout -b feature/your-feature-name)
- Commit your changes (git commit -m "Add feature: your feature name")
- Push to your branch (git push origin feature/your-feature-name)
- Open a Pull Request and describe your changes

💡 Pro Tip: Check open issues or create a new one before starting to avoid duplicate work.

<br>

## 📄 License
- This project is licensed under the Commercial License for institutions.
- ✅ Free for personal, educational, and non-commercial research use
- 💰 Commercial License required for universities, colleges, or organizations (500 USD/year)

📜 See LICENSE for details or contact us for commercial usage
