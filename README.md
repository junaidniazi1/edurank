# 🏆 EduRank — Student Leaderboard & Grading System

A full-stack academic management system for teachers and students with real-time rankings, mark entry, and grade tracking.

---

## 🚀 Features

### For Teachers
- ✅ Create courses with semester/year tracking
- ✅ Enroll students with roll numbers
- ✅ Create assessments (Assignment, Quiz, Mid, Final, Activity, Project, Viva)
- ✅ Enter marks with percentage calculation and feedback
- ✅ Configure grade weightages per course (must total 100%)
- ✅ View live leaderboard with podium for top 3
- ✅ Export marks to CSV

### For Students
- ✅ Personal dashboard with rank, score, and grade
- ✅ Class leaderboard with own position highlighted
- ✅ Rank card with percentile and GPA
- ✅ Category-wise marks breakdown

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/edurank.git
cd edurank
npm install
```

### 2. Set up Supabase
1. Go to supabase.com → New Project
2. Open SQL Editor → Run supabase/schema.sql
3. Copy your keys from Settings → API

### 3. Configure environment
```bash
cp .env.example .env.local
# Fill in your Supabase URL, keys, and JWT secret
```

### 4. Seed demo data
```bash
npm run dev
# Visit: http://localhost:3000/api/setup
```

Demo: teacher@demo.com / demo123 and student@demo.com / demo123

---

## 🌐 Deploy to Vercel

1. Push to GitHub
2. Import repo on vercel.com
3. Add environment variables
4. Deploy!

---

## 📁 Structure
```
app/api/          - Backend API routes
app/dashboard/    - Teacher + Student pages
components/       - Shared components
lib/              - Auth + Supabase utilities
supabase/         - Database schema SQL
```
