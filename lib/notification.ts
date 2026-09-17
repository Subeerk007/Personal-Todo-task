"use client";

import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase";

let currentAudio: HTMLAudioElement | null = null;

// Play audio notification sound continuously until stopped
export function playNotificationSound(loop: boolean = false) {
  try {
    if (typeof window === "undefined") return;
    
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
    
    // Play test notification chime sound upon activation
    playNotificationSound();
    
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