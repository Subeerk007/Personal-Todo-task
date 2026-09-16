import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Planner — Daily Task Manager",
  description:
    "A beautiful personal daily planner to organize your tasks, track progress, and stay inspired with daily motivational quotes.",
  keywords: ["planner", "todo", "task manager", "daily planner", "personal planner"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#FDF6F0" />
      </head>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
