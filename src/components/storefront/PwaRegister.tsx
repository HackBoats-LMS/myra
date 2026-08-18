"use client";
import { useEffect, useState } from "react";

export default function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => void } | null>(null);
  const [installed, setInstalled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("SW registration failed:", err);
    });

    const beforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => void });
    };
    const installedEvent = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installedEvent);

    if ("PushManager" in window && "serviceWorker" in navigator && "Notification" in window) {
      Promise.resolve()
        .then(() => setPushSupported(true))
        .then(() => Notification.requestPermission?.())
        .then((perm) => setPushEnabled(perm === "granted"));
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installedEvent);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  const handleEnablePush = async () => {
    if (!pushSupported || busy) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const key = (await getVapidKey()) as Uint8Array<ArrayBuffer>;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key as unknown as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (res.ok) setPushEnabled(true);
    } catch (err) {
      console.warn("Push subscribe failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const getVapidKey = async (): Promise<Uint8Array | null> => {
    try {
      const res = await fetch("/api/push/vapid-key");
      if (!res.ok) return null;
      const { publicKey } = await res.json();
      if (!publicKey) return null;
      const base64 = publicKey.replace(/-/g, "+").replace(/_/g, "/");
      const bin = atob(base64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return arr;
    } catch {
      return null;
    }
  };

  const showInstall = deferredPrompt && !installed && !pushSupported;

  return (
    <>
      {showInstall && (
        <button
          onClick={handleInstall}
          className="fixed bottom-20 right-4 md:right-6 z-40 flex items-center gap-2 bg-[#4A3B2C] text-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest shadow-lg rounded-none"
        >
          <i className="ri-mobile-download-line text-sm" />
          Install Myra
        </button>
      )}
      {pushSupported && !pushEnabled && (
        <button
          onClick={() => void handleEnablePush()}
          disabled={busy}
          className="fixed bottom-20 right-4 md:right-6 z-40 flex items-center gap-2 bg-[#B6925B] text-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest shadow-lg rounded-none disabled:opacity-50"
        >
          <i className="ri-notification-3-line text-sm" />
          {busy ? "Enabling..." : "Enable Notifications"}
        </button>
      )}
    </>
  );
}