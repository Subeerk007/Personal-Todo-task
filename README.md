# Planner — To-Do App (Next.js)

Simple date-wise to-do list. Left side calendar se date choose karo, right side us date ke tasks add/complete/delete karo. Abhi ke liye sab kuch browser ke localStorage mein save hota hai — koi backend/database nahi hai.

## Chalane ka tarika

```bash
cd todo-app
npm install
npm run dev
```

Phir browser mein `http://localhost:3000` kholo.

## Structure

- `app/page.tsx` — poora UI (calendar + task panel), client component
- `app/layout.tsx` — root layout
- `app/globals.css` — Tailwind + planner theme (paper texture, custom colors)
- `tailwind.config.js` — colors (`paper`, `ink`, `pen`, etc.) aur fonts

## Aage jab backend chahiye ho

Jab ready ho, `app/api/` folder banake Next.js API routes add kar sakte ho, ya kisi DB (Postgres/SQLite/Supabase) se connect kar sakte ho — abhi jo localStorage wala logic hai (`app/page.tsx` ke andar `tasks` state) usko fetch/save calls se replace karna hoga.



## Future scope of this panel
1. Push notification Implementation If I set alarm any timer in the any task then 
on that time that alarm will arise and keep motivating the worker
