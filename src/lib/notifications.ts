import { supabase } from "@/integrations/supabase/client";

const PUBLIC_VAPID_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nkx8Wk"; // Demo Key

export async function requestNotificationPermission() {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        await subscribeToPush();
    }
    return permission;
}

async function subscribeToPush() {
    if (!("serviceWorker" in navigator)) return;

    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push
    const subscription = await (registration as ServiceWorkerRegistration & { pushManager: PushManager }).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    });

    // Send subscription to backend
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/v1/notifications/subscribe`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify(subscription)
        });
    }
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
