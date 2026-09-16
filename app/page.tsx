"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, set, push, remove, update } from "firebase/database";

/* ───────── Types ───────── */
type Category = "Work" | "Personal" | "Study";

type Task = {
  id: string;
  text: string;
  done: boolean;
  category: Category;
  createdAt: number;
};

type TaskMap = Record<string, Task[]>;
type FilterType = "all" | "pending" | "completed";

/* ───────── Constants ───────── */
const QUOTE_STORAGE_KEY = "daily-quote-v1";
const DB_TASKS_PATH = "tasks";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CATEGORIES: { label: Category; color: string; bg: string }[] = [
  { label: "Work", color: "text-tagWorkText", bg: "bg-tagWork" },
  { label: "Personal", color: "text-tagPersonalText", bg: "bg-tagPersonal" },
  { label: "Study", color: "text-tagStudyText", bg: "bg-tagStudy" },
];

const FALLBACK_QUOTES = [
  { q: "A little progress each day adds up to big results.", a: "Satya Nani" },
  { q: "The secret of getting ahead is getting started.", a: "Mark Twain" },
  { q: "It always seems impossible until it's done.", a: "Nelson Mandela" },
  { q: "Your limitation—it's only your imagination.", a: "Unknown" },
  { q: "Push yourself, because no one else is going to do it for you.", a: "Unknown" },
  { q: "Great things never come from comfort zones.", a: "Unknown" },
  { q: "Dream it. Wish it. Do it.", a: "Unknown" },
  { q: "Success doesn't just find you. You have to go out and get it.", a: "Unknown" },
  { q: "The harder you work for something, the greater you'll feel when you achieve it.", a: "Unknown" },
  { q: "Don't stop when you're tired. Stop when you're done.", a: "Unknown" },
];

/* ───────── Helpers ───────── */
function toKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDayInfo(date: Date) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  return {
    day: date.getDate(),
    weekday,
    month: MONTHS[date.getMonth()],
    monthShort: MONTH_SHORT[date.getMonth()],
    year: date.getFullYear(),
  };
}

function generateTimeOptions() {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hr = h % 12 || 12;
      const ampm = h < 12 ? "AM" : "PM";
      const min = String(m).padStart(2, "0");
      times.push(`${String(hr).padStart(2, "0")}:${min} ${ampm}`);
    }
  }
  return times;
}

const TIME_OPTIONS = generateTimeOptions();

/* ───────── Icons ───────── */
function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function EditIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CalendarIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ChevronLeft({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function SunIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="5" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </g>
    </svg>
  );
}

function ListIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function QuoteIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" opacity="0.15">
      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
    </svg>
  );
}

function TaskCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="3" fill="#C75B39" fillOpacity="0.1" stroke="#C75B39" strokeWidth="1.5" />
      <path d="M8 12l2.5 2.5L16 9" stroke="#C75B39" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CompletedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="12" cy="12" r="9" fill="#27AE60" fillOpacity="0.1" stroke="#27AE60" strokeWidth="1.5" />
      <path d="M8 12l2.5 2.5L16 9" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="12" cy="12" r="9" fill="#E67E22" fillOpacity="0.1" stroke="#E67E22" strokeWidth="1.5" />
      <path d="M12 7v5l3 3" stroke="#E67E22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <rect x="3" y="4" width="18" height="18" rx="3" fill="#2C3E50" fillOpacity="0.1" stroke="#2C3E50" strokeWidth="1.5" />
      <line x1="8" y1="2" x2="8" y2="6" stroke="#2C3E50" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="2" x2="16" y2="6" stroke="#2C3E50" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="10" x2="21" y2="10" stroke="#2C3E50" strokeWidth="1.5" />
    </svg>
  );
}

/* ─────── Edit Modal ─────── */
function EditModal({
  task,
  onSave,
  onClose,
}: {
  task: Task;
  onSave: (updated: Task) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(task.text);
  const [category, setCategory] = useState<Category>(task.category);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSave() {
    if (!text.trim()) return;
    onSave({ ...task, text: text.trim(), category });
  }

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-cardHover animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-heading text-lg font-semibold text-navy mb-4">Edit Task</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-navyLight mb-1.5">Task Description</label>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              className="task-input w-full rounded-xl border border-borderLight bg-cream/50 px-4 py-2.5 text-sm text-navy placeholder:text-navyFaint outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-navyLight mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="task-input w-full rounded-xl border border-borderLight bg-cream/50 px-4 py-2.5 text-sm text-navy outline-none appearance-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.label} value={c.label} className="bg-slate-800 text-white">{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-navyLight border border-borderLight hover:bg-cream transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="add-btn rounded-xl bg-terra px-5 py-2.5 text-sm font-medium text-white shadow-button"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ MAIN COMPONENT ═══════════════════════════ */
export default function Home() {
  const today = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState<Date>(today);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [tasks, setTasks] = useState<TaskMap>({});
  const [draft, setDraft] = useState("");

  const [draftCategory, setDraftCategory] = useState<Category>("Work");
  const [filter, setFilter] = useState<FilterType>("all");
  const [hydrated, setHydrated] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [quote, setQuote] = useState<{ q: string; a: string } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Sync tasks from Firebase Realtime Database ── */
  useEffect(() => {
    const tasksRef = ref(db, DB_TASKS_PATH);
    const unsubscribe = onValue(
      tasksRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          // Convert Firebase object structure to TaskMap
          const taskMap: TaskMap = {};
          for (const dateKey in data) {
            const dateTasks = data[dateKey];
            taskMap[dateKey] = Object.keys(dateTasks).map((taskId) => ({
              ...dateTasks[taskId],
              id: taskId,
            }));
          }
          setTasks(taskMap);
        } else {
          setTasks({});
        }
        setHydrated(true);
      },
      (error) => {
        console.error("Firebase read error:", error);
        setHydrated(true);
      }
    );

    return () => unsubscribe();
  }, []);

  /* ── Fetch daily quote ── */
  useEffect(() => {
    const todayKey = toKey(today);

    // Check cache first
    try {
      const cached = window.localStorage.getItem(QUOTE_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.date === todayKey && parsed.quote) {
          setQuote(parsed.quote);
          setQuoteLoading(false);
          return;
        }
      }
    } catch (e) {
      // ignore
    }

    // Fetch from API
    async function fetchQuote() {
      try {
        const res = await fetch("/api/quote");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (data && data[0]) {
          const q = { q: data[0].q, a: data[0].a };
          setQuote(q);
          window.localStorage.setItem(
            QUOTE_STORAGE_KEY,
            JSON.stringify({ date: todayKey, quote: q })
          );
        }
      } catch {
        // Use fallback
        const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
        setQuote(fallback);
      } finally {
        setQuoteLoading(false);
      }
    }
    fetchQuote();
  }, [today]);

  /* ── Derived state ── */
  const selectedKey = toKey(selected);
  const { day, weekday, month, monthShort, year } = formatDayInfo(selected);
  const dayTasks = tasks[selectedKey] || [];
  const completedCount = dayTasks.filter((t) => t.done).length;
  const pendingCount = dayTasks.length - completedCount;

  const filteredTasks = useMemo(() => {
    if (filter === "pending") return dayTasks.filter((t) => !t.done);
    if (filter === "completed") return dayTasks.filter((t) => t.done);
    return dayTasks;
  }, [dayTasks, filter]);

  /* ── Calendar grid ── */
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // Previous month trailing days
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
  const cells: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({
      date: new Date(viewYear, viewMonth - 1, prevMonthDays - i),
      isCurrentMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(viewYear, viewMonth, d), isCurrentMonth: true });
  }
  // Fill remaining to complete 6 rows
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      date: new Date(viewYear, viewMonth + 1, d),
      isCurrentMonth: false,
    });
  }

  /* ── Handlers ── */
  function goPrevMonth() {
    setViewMonth((m) => (m === 0 ? 11 : m - 1));
    if (viewMonth === 0) setViewYear((y) => y - 1);
  }
  function goNextMonth() {
    setViewMonth((m) => (m === 11 ? 0 : m + 1));
    if (viewMonth === 11) setViewYear((y) => y + 1);
  }
  function goToday() {
    setSelected(today);
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
  }

  function addTask() {
    const text = draft.trim();
    if (!text) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      done: false,
      category: draftCategory,
      createdAt: Date.now(),
    };

    // Optimistically update local state immediately
    setTasks((prev) => {
      const currentList = prev[selectedKey] || [];
      return { ...prev, [selectedKey]: [newTask, ...currentList] };
    });
    setDraft("");
    inputRef.current?.focus();

    // Push to Firebase Realtime Database
    try {
      const dateRef = ref(db, `${DB_TASKS_PATH}/${selectedKey}`);
      push(dateRef, {
        text: newTask.text,
        done: newTask.done,
        category: newTask.category,
        createdAt: newTask.createdAt,
      }).catch((err) => {
        console.error("Firebase push error:", err);
      });
    } catch (e) {
      console.error("Firebase connection error:", e);
    }
  }

  const toggleTask = useCallback(
    (id: string) => {
      // Optimistic update
      setTasks((prev) => {
        const currentList = prev[selectedKey] || [];
        return {
          ...prev,
          [selectedKey]: currentList.map((t) =>
            t.id === id ? { ...t, done: !t.done } : t
          ),
        };
      });

      try {
        const taskRef = ref(db, `${DB_TASKS_PATH}/${selectedKey}/${id}`);
        const task = (tasks[selectedKey] || []).find((t) => t.id === id);
        if (task) {
          update(taskRef, { done: !task.done }).catch((err) =>
            console.error("Firebase update error:", err)
          );
        }
      } catch (e) {
        console.error("Firebase connection error:", e);
      }
    },
    [selectedKey, tasks]
  );

  const deleteTask = useCallback(
    (id: string) => {
      // Optimistic update
      setTasks((prev) => {
        const currentList = prev[selectedKey] || [];
        return {
          ...prev,
          [selectedKey]: currentList.filter((t) => t.id !== id),
        };
      });

      try {
        const taskRef = ref(db, `${DB_TASKS_PATH}/${selectedKey}/${id}`);
        remove(taskRef).catch((err) => console.error("Firebase remove error:", err));
      } catch (e) {
        console.error("Firebase connection error:", e);
      }
    },
    [selectedKey]
  );

  function saveEditedTask(updated: Task) {
    // Optimistic update
    setTasks((prev) => {
      const currentList = prev[selectedKey] || [];
      return {
        ...prev,
        [selectedKey]: currentList.map((t) => (t.id === updated.id ? updated : t)),
      };
    });
    setEditingTask(null);

    try {
      const taskRef = ref(db, `${DB_TASKS_PATH}/${selectedKey}/${updated.id}`);
      const { id, ...taskData } = updated;
      set(taskRef, taskData).catch((err) => console.error("Firebase set error:", err));
    } catch (e) {
      console.error("Firebase connection error:", e);
    }
  }

  const getCategoryStyle = (cat: Category) => {
    const found = CATEGORIES.find((c) => c.label === cat);
    return found || CATEGORIES[0];
  };

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <main
      className="min-h-screen relative p-4 md:p-6 lg:p-8 bg-cover bg-center bg-fixed bg-no-repeat text-white"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.6)), url('/marvels-spider-man-3840x2160-11990.jpeg')`,
      }}
    >
      <div className="mx-auto max-w-[1200px] relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">

          {/* ══════════ LEFT SIDEBAR ══════════ */}
          <aside className="space-y-6">
            {/* Date Card */}
            <div className="glass-panel rounded-2xl p-6 shadow-card animate-fadeUp">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-terra uppercase">
                    {weekday}
                  </p>
                  <p className="font-heading text-6xl font-bold text-navy mt-1 leading-none">
                    {day}
                  </p>
                  <p className="font-heading text-lg text-navyLight mt-1">
                    {month} {year}
                  </p>
                </div>
                <button
                  id="today-button"
                  onClick={goToday}
                  className="today-btn flex items-center gap-2 rounded-xl border border-borderLight px-3.5 py-2 text-xs font-medium text-terra"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Today
                </button>
              </div>

              {/* Calendar */}
              <div className="rounded-xl border border-borderLight bg-white/50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    id="prev-month-btn"
                    onClick={goPrevMonth}
                    aria-label="Previous month"
                    className="rounded-lg p-1.5 text-navyFaint hover:bg-cream hover:text-navy transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="font-heading text-sm font-semibold text-navy">
                    {MONTHS[viewMonth]} {viewYear}
                  </h2>
                  <button
                    id="next-month-btn"
                    onClick={goNextMonth}
                    aria-label="Next month"
                    className="rounded-lg p-1.5 text-navyFaint hover:bg-cream hover:text-navy transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-2">
                  {WEEKDAYS.map((w, i) => (
                    <div key={i} className="text-center text-[11px] font-semibold text-navyFaint py-1">
                      {w}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-y-1">
                  {cells.map(({ date: cellDate, isCurrentMonth }, idx) => {
                    const key = toKey(cellDate);
                    const isSelected = key === selectedKey;
                    const isToday = key === toKey(today);
                    const hasTasks = (tasks[key] || []).length > 0;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelected(cellDate);
                          if (!isCurrentMonth) {
                            setViewMonth(cellDate.getMonth());
                            setViewYear(cellDate.getFullYear());
                          }
                        }}
                        className={[
                          "cal-day relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium",
                          !isCurrentMonth && "opacity-30",
                          isSelected && "selected",
                          isToday && !isSelected && "today-ring",
                          !isSelected && !isToday && isCurrentMonth && "text-navy",
                          hasTasks && !isSelected && "has-tasks",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {cellDate.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quote Card */}
            <div className="glass-panel rounded-2xl p-6 shadow-card animate-fadeUp quote-section" style={{ animationDelay: "0.1s" }}>
              <div className="relative">
                <QuoteIcon className="absolute -top-1 -left-1 w-10 h-10 text-terra" />
                {quoteLoading ? (
                  <div className="space-y-2 pl-2 pt-3">
                    <div className="h-3 w-full rounded shimmer-bg animate-shimmer" />
                    <div className="h-3 w-4/5 rounded shimmer-bg animate-shimmer" />
                    <div className="h-3 w-2/5 rounded shimmer-bg animate-shimmer mt-3" />
                  </div>
                ) : quote ? (
                  <div className="pl-2 pt-3">
                    <p className="text-sm text-navy/80 leading-relaxed italic">
                      {quote.q}
                    </p>
                    <p className="mt-3 text-xs font-semibold text-terra">
                      — {quote.a}
                    </p>
                    <p className="text-[10px] text-navyFaint mt-1">Keep going!</p>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>

          {/* ══════════ RIGHT PANEL ══════════ */}
          <section className="space-y-6">
            {/* Header */}
            <div className="glass-panel rounded-2xl p-6 shadow-card animate-fadeUp" style={{ animationDelay: "0.05s" }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-heading text-2xl font-bold text-navy">Tasks</h1>
                  <p className="text-sm text-navyFaint mt-0.5">Organize your day, one task at a time.</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-borderLight px-3.5 py-2">
                  <SunIcon className="w-4 h-4 text-amber" />
                  <span className="text-xs font-medium text-navy">Today</span>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="stat-card rounded-xl border border-borderLight bg-white/60 p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <TaskCheckIcon />
                  </div>
                  <p className="font-heading text-2xl font-bold text-navy">{dayTasks.length}</p>
                  <p className="text-[11px] font-medium text-navyFaint mt-0.5">Total Tasks</p>
                </div>
                <div className="stat-card rounded-xl border border-borderLight bg-white/60 p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <CompletedIcon />
                  </div>
                  <p className="font-heading text-2xl font-bold text-forest">{completedCount}</p>
                  <p className="text-[11px] font-medium text-navyFaint mt-0.5">Completed</p>
                </div>
                <div className="stat-card rounded-xl border border-borderLight bg-white/60 p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <PendingIcon />
                  </div>
                  <p className="font-heading text-2xl font-bold text-amber">{pendingCount}</p>
                  <p className="text-[11px] font-medium text-navyFaint mt-0.5">Pending</p>
                </div>
                <div className="stat-card rounded-xl border border-borderLight bg-white/60 p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <DateIcon />
                  </div>
                  <p className="font-heading text-2xl font-bold text-navy">
                    {day} {monthShort}
                  </p>
                  <p className="text-[11px] font-medium text-navyFaint mt-0.5">Selected Date</p>
                </div>
              </div>
            </div>

            {/* Add Task */}
            <div className="glass-panel rounded-2xl p-5 shadow-card animate-fadeUp" style={{ animationDelay: "0.1s" }}>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-3 flex-1 rounded-xl border border-borderLight bg-white/60 px-4 py-2.5">
                  <ListIcon className="w-4 h-4 text-navyFaint shrink-0" />
                  <input
                    id="task-input"
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        addTask();
                      }
                    }}
                    placeholder="Task ka description likho..."
                    className="task-input flex-1 bg-transparent text-sm text-navy placeholder:text-navyFaint/60 outline-none border-none"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    id="category-select"
                    value={draftCategory}
                    onChange={(e) => setDraftCategory(e.target.value as Category)}
                    className="rounded-xl border border-borderLight bg-white/60 px-3 py-2.5 text-xs font-medium text-navy outline-none appearance-none cursor-pointer hover:border-terra/30 transition-all"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.label} value={c.label} className="bg-slate-800 text-white">{c.label}</option>
                    ))}
                  </select>
                  <button
                    id="add-task-btn"
                    onClick={addTask}
                    className="add-btn flex items-center gap-2 rounded-xl bg-terra px-5 py-2.5 text-sm font-semibold text-white shadow-button whitespace-nowrap"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Task
                  </button>
                </div>
              </div>
            </div>

            {/* Task List */}
            <div className="glass-panel rounded-2xl p-5 shadow-card animate-fadeUp" style={{ animationDelay: "0.15s" }}>
              {/* Filter + Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h2 className="font-heading text-lg font-semibold text-navy">
                  Today&apos;s Tasks
                </h2>
                <div className="flex items-center gap-1.5 rounded-xl bg-cream/80 p-1">
                  <button
                    id="filter-all"
                    onClick={() => setFilter("all")}
                    className={`filter-tab rounded-lg px-4 py-1.5 text-xs font-semibold ${
                      filter === "all" ? "active" : "text-navyLight hover:text-navy"
                    }`}
                  >
                    All {dayTasks.length > 0 && <span className="ml-1 opacity-80">{dayTasks.length}</span>}
                  </button>
                  <button
                    id="filter-pending"
                    onClick={() => setFilter("pending")}
                    className={`filter-tab rounded-lg px-4 py-1.5 text-xs font-semibold ${
                      filter === "pending" ? "active" : "text-navyLight hover:text-navy"
                    }`}
                  >
                    Pending {pendingCount > 0 && <span className="ml-1 opacity-80">{pendingCount}</span>}
                  </button>
                  <button
                    id="filter-completed"
                    onClick={() => setFilter("completed")}
                    className={`filter-tab rounded-lg px-4 py-1.5 text-xs font-semibold ${
                      filter === "completed" ? "active" : "text-navyLight hover:text-navy"
                    }`}
                  >
                    Completed {completedCount > 0 && <span className="ml-1 opacity-80">{completedCount}</span>}
                  </button>
                </div>
              </div>

              {/* Task Items */}
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center mb-4">
                    <CalendarIcon className="w-7 h-7 text-navyFaint" />
                  </div>
                  <p className="font-heading text-sm font-medium text-navyLight">
                    {filter === "all"
                      ? "No tasks for this date yet"
                      : filter === "pending"
                      ? "No pending tasks"
                      : "No completed tasks"
                    }
                  </p>
                  <p className="text-xs text-navyFaint mt-1">
                    {filter === "all" ? "Add a task above to get started!" : "Keep going!"}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                  {filteredTasks.map((t, i) => {
                    const catStyle = getCategoryStyle(t.category);
                    return (
                      <li
                        key={t.id}
                        className="task-item group flex items-center gap-4 rounded-xl border border-borderLight bg-white/60 px-4 py-3.5 animate-fadeUp"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        {/* Checkbox */}
                        <button
                          id={`toggle-${t.id}`}
                          onClick={() => toggleTask(t.id)}
                          className={[
                            "task-checkbox shrink-0 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                            t.done
                              ? "checked border-forest bg-forest"
                              : "border-borderMedium hover:border-terra",
                          ].join(" ")}
                        >
                          {t.done && <CheckIcon className="w-3 h-3 text-white animate-checkmark" />}
                        </button>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={[
                              "text-sm font-medium truncate transition-all",
                              t.done ? "text-navyFaint line-through" : "text-navy",
                            ].join(" ")}
                          >
                            {t.text}
                          </p>
                        </div>



                        {/* Category Tag */}
                        <span
                          className={`category-tag hidden sm:inline-block shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${catStyle.bg} ${catStyle.color}`}
                        >
                          {t.category}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            id={`edit-${t.id}`}
                            onClick={() => setEditingTask(t)}
                            className="edit-btn rounded-lg p-1.5"
                            aria-label="Edit task"
                          >
                            <EditIcon className="w-3.5 h-3.5 text-navyFaint" />
                          </button>
                          <button
                            id={`delete-${t.id}`}
                            onClick={() => deleteTask(t.id)}
                            className="delete-btn rounded-lg p-1.5"
                            aria-label="Delete task"
                          >
                            <TrashIcon className="w-3.5 h-3.5 text-navyFaint" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTask && (
        <EditModal
          task={editingTask}
          onSave={saveEditedTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </main>
  );
}
