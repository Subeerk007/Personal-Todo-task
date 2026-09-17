// Firebase Service Worker for Background Push Notifications
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Read config from search params if passed, or default to standard Firebase web config
const urlParams = new URLSearchParams(self.location.search);

firebase.initializeApp({
  apiKey: urlParams.get("apiKey") || "AIzaSyClK2djeryt-qkz6xuOPMvJzdi7G_rG3nA",
  authDomain: urlParams.get("authDomain") || "to-do-task-976df.firebaseapp.com",
  projectId: urlParams.get("projectId") || "to-do-task-976df",
  storageBucket: urlParams.get("storageBucket") || "to-do-task-976df.firebasestorage.app",
  messagingSenderId: urlParams.get("messagingSenderId") || "473344876826",
  appId: urlParams.get("appId") || "1:473344876826:web:3459ce61943f1597834ca3",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background notification received:", payload);

  const notificationTitle = payload.notification?.title || "Task Reminder ⏰";
  const notificationOptions = {
    body: payload.notification?.body || "You have a scheduled task reminder!",
    icon: "/marvels-spider-man-3840x2160-11990.jpeg",
    badge: "/marvels-spider-man-3840x2160-11990.jpeg",
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
