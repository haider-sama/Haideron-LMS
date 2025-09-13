<p align="center">
  <img src="https://github.com/haider-sama/Haideron-LMS/blob/master/devlog/github_banner.png" alt="Banner" width="512" height="128">
</p>

# 📚 HaideronOS-LMS

A **scalable, modern Learning Management System (LMS)** built for institutions that value performance, reliability, and ease of use.  
Designed with **Node.js, TypeScript, PostgreSQL (via Drizzle ORM)**, and **Redis (for the social layer)** — HaideronOS-LMS delivers a smooth, secure, and intuitive learning experience for administrators, faculty, and students.

---

## 🚀 Key Features

### 🔑 Authentication & Security
- **Custom JWT-based authentication** with refresh tokens  
- **15-minute access tokens** (auto-refresh every 10 minutes) for a seamless user experience  
- **Role-Based Access Control (RBAC)**  
- **Rate limiting & input sanitization** for security  
- **Audit logs** — all critical actions logged for compliance  

---

### 🏫 Core LMS Modules
- **Program Management** – create & manage degree programs  
- **Catalogue Management** – share course catalogues across multiple batches  
- **Course & Course Offering Management** – manage courses per semester  
- **Semester Management** – activate semesters & auto-fetch relevant data  
- **Batch Management** – create/edit/delete batches (e.g., `2022-CS`), enroll students automatically by department  
- **Faculty Management** – department heads can add/edit/remove faculty  

---

### 🎓 Outcomes & Mapping
- **PEOs, PLOs, CLOs** – manage program, learning, and course outcomes  
- **Mapping tools** – PEO↔PLO and PLO↔CLO mapping for accreditation readiness  

---

### 👩‍🏫 Teacher Dashboard
- Auto-fetch assigned courses for the activated semester  
- **Attendance Management** – create date-specific attendance, reuse across sections  
- **Assessment Management** – create, mark, and grade assessments  
- **Custom Grading Schemes** per course offering  
- **Result Finalization** – submit results to department heads for approval/review  

---

### 👨‍🎓 Student Dashboard
- Automatically shows enrolled courses for the active semester  
- One-click **section enrollment**  
- Simple, clean interface for **attendance & grades visibility**  

---

### 🌐 Social Layer (Community)
- Forums, posts, comments with likes/upvotes/downvotes  
- Multiple post formats (text, media, etc.)  
- **Infinite scrolling + pagination** (Reddit/Instagram-style)  
- Clean, mobile-friendly UX  
- Backed by **Redis** for performance  

---

### ⚙️ Admin Features
- **Admin Panel** – configure system settings with ease  
- **Logging System** – track and audit critical operations  
- **Minimal Training Required** – optimized for usability by non-technical staff  


## ⚙️ Installation & Setup

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
