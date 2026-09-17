/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;
declare const firebase: any;
declare function importScripts(...urls: string[]): void;

// Import Firebase compat libraries inside Service Worker
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Initialize Firebase with TypeScript types and real credentials
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

if (typeof firebase !== "undefined" && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const messaging = typeof firebase !== "undefined" ? firebase.messaging() : null;

if (messaging) {
    messaging.onBackgroundMessage((payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => {
        console.log("[firebase-messaging-sw.ts] Background notification received:", payload);

        const notificationTitle = payload.notification?.title || "Task Reminder ⏰";
        const notificationOptions: NotificationOptions = {
            body: payload.notification?.body || "Stay focused and achieve your goals!",
            icon: "/marvels-spider-man-3840x2160-11990.jpeg",
            data: payload.data || {},
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
}

export { };