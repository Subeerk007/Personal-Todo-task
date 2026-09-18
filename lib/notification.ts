"use client";

import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase";

let currentAudio: HTMLAudioElement | null = null;
let audioContext: AudioContext | null = null;
let alarmBuffer: AudioBuffer | null = null;
const scheduledAlarms = new Map<string, { end: number; source: AudioBufferSourceNode }>();

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

async function getAlarmBuffer(context: AudioContext) {
  if (alarmBuffer) return alarmBuffer;
  const response = await fetch("/warning.mp3");
  alarmBuffer = await context.decodeAudioData(await response.arrayBuffer());
  return alarmBuffer;
}

// Schedule the alarm in the audio engine, which is not delayed by a hidden-tab
// JavaScript interval. The browser still requires that audio was enabled by a user.
export async function scheduleNotificationSound(id: string, end: number) {
  const existing = scheduledAlarms.get(id);
  if (existing?.end === end) return;
  cancelScheduledNotificationSound(id);

  const context = getAudioContext();
  if (!context || end <= Date.now()) return;

  try {
    await context.resume();
    const buffer = await getAlarmBuffer(context);
    const secondsUntilAlarm = Math.max(0, (end - Date.now()) / 1000);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(context.destination);
    source.start(context.currentTime + secondsUntilAlarm);
    source.onended = () => {
      if (scheduledAlarms.get(id)?.source === source) scheduledAlarms.delete(id);
    };
    scheduledAlarms.set(id, { end, source });
  } catch (err) {
    console.log("Could not schedule alarm audio:", err);
  }
}

export function cancelScheduledNotificationSound(id: string) {
  const alarm = scheduledAlarms.get(id);
  if (!alarm) return;
  try {
    alarm.source.stop();
    alarm.source.disconnect();
  } catch {
    // The source may already have stopped.
  }
  scheduledAlarms.delete(id);
}

// Play audio notification sound continuously until stopped
export function playNotificationSound(loop: boolean = false) {
  try {
    if (typeof window === "undefined") return;

    // Unlock and preload Web Audio while the user is interacting with the app.
    // Future alarms can then play even if the tab is minimised.
    const context = getAudioContext();
    if (context) {
      context.resume().then(() => getAlarmBuffer(context)).catch(() => undefined);
    }
    
    // Stop any previously playing audio instance
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    currentAudio = new Audio("/warning.mp3");
    currentAudio.loop = loop;
    currentAudio.play().catch((err) => {
      console.log("Audio play prevented or interrupted:", err);
    });
  } catch (err) {
    console.error("Audio error:", err);
  }
}

// Stop playing notification sound
export function stopNotificationSound() {
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
  } catch (err) {
    console.error("Audio stop error:", err);
  }
}

export async function enableNotifications() {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.log("Browser notifications are not supported.");
      return null;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission denied by user.");
      return null;
    }

    const messaging = await getFirebaseMessaging();

    if (!messaging) {
      console.log("Firebase Messaging is not supported on this browser.");
      return null;
    }

    // Register service worker explicitly
    let swRegistration;
    if ("serviceWorker" in navigator) {
      swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    const token = await getToken(messaging, {
      serviceWorkerRegistration: swRegistration,
      ...(vapidKey ? { vapidKey } : {}),
    });

    console.log("FCM Token:", token);
    
    return token;
  } catch (error) {
    console.error("Notification permission / FCM token error:", error);
    return null;
  }
}

// Foreground notification listener
export async function listenToForegroundMessages(onNotificationReceived?: (payload: any) => void) {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("Foreground FCM notification received:", payload);
    
    // Play audio notification chime
    playNotificationSound();

    if (onNotificationReceived) {
      onNotificationReceived(payload);
    }

    // Show native desktop notification if in foreground
    if (typeof window !== "undefined" && Notification.permission === "granted" && payload.notification) {
      new Notification(payload.notification.title || "Task Reminder ⏰", {
        body: payload.notification.body || "Stay focused and achieve your goals!",
        icon: "/marvels-spider-man-3840x2160-11990.jpeg",
      });
    }
  });
}
