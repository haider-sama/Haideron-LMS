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

---

## 🛠️ Tech Stack

| Layer | Technology |
|------|-------------|
| **Backend** | Node.js + TypeScript |
| **Database** | PostgreSQL (Drizzle ORM) |
| **Caching / Realtime** | Redis (for social features) |
| **Auth** | JWT + Refresh Tokens |
| **UI/UX** | Modern, responsive, mobile-first |

---

## 📸 Screenshots / Demo
*(Add screenshots or a GIF demo here once available)*

---

## 🏗️ Installation & Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/HaideronOS-LMS.git

# Install dependencies
cd HaideronOS-LMS
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with DB credentials, JWT secrets, etc.

# Run migrations
npm run db:migrate

# Start development server
npm run dev
