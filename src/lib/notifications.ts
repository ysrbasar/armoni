import type { DemoData, Lesson } from "@/data/types";
import type { Session } from "@/store/useStore";
import { instrumentById } from "@/data/catalog";
import { addDays, todayISO } from "./date";

/**
 * Ders hatırlatmaları: dersten 24 saat önce bildirim.
 * - "push": Netlify fonksiyonu Web Push ile gönderir (uygulama kapalıyken de gelir).
 * - "local": sunucu yoksa, uygulama açıkken zamanı gelen hatırlatmayı tarayıcı gösterir.
 */
export interface Reminder {
  id: string;
  at: string;
  lessonAt: string;
  title: string;
  body: string;
  url: string;
}

interface Settings {
  enabled: boolean;
  mode: "push" | "local";
  notified: string[];
  endpoint?: string;
}

const KEY = "armoni-reminders";
const API = "./api/push";

export function loadSettings(): Settings {
  try {
    return { enabled: false, mode: "local", notified: [], ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return { enabled: false, mode: "local", notified: [] };
  }
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* depolama kapalı olabilir */
  }
}

export const notificationsSupported = () => typeof window !== "undefined" && "Notification" in window;

const lessonDate = (l: Lesson) => {
  const [y, m, d] = l.date.split("-").map(Number);
  const [h, min] = l.start.split(":").map(Number);
  return new Date(y, m - 1, d, h, min);
};

/** Rolüne göre kullanıcının önümüzdeki 8 gündeki dersleri için hatırlatmalar */
export function remindersFor(data: DemoData, session: Session): Reminder[] {
  const today = todayISO();
  const until = addDays(today, 8);
  let lessons: Lesson[] = [];
  let who: (l: Lesson) => string = () => "";
  if (session.role === "student") {
    lessons = data.lessons.filter((l) => l.studentId === session.studentId);
    who = () => "";
  } else if (session.role === "parent") {
    const kids = data.parents.find((p) => p.id === session.parentId)?.childIds ?? [];
    lessons = data.lessons.filter((l) => kids.includes(l.studentId));
    who = (l) => data.students.find((s) => s.id === l.studentId)?.name.split(" ")[0] ?? "";
  } else if (session.role === "teacher") {
    lessons = data.lessons.filter((l) => l.teacherId === session.teacherId);
    who = (l) => data.students.find((s) => s.id === l.studentId)?.name ?? "";
  } else return [];

  const home = session.role === "parent" ? "#/parent/lessons" : session.role === "teacher" ? "#/teacher/lessons" : "#/student";
  return lessons
    .filter((l) => l.status === "scheduled" && l.date >= today && l.date <= until)
    .map((l) => {
      const at = lessonDate(l);
      const ins = instrumentById[l.instrument].name;
      const name = who(l);
      const title =
        session.role === "parent" ? `${name} için yarın ders var` : session.role === "teacher" ? `Yarın ${l.start} dersiniz var` : `Yarın ${ins} dersin var`;
      const body =
        session.role === "teacher"
          ? `${name} · ${ins} · ${l.start} · ${l.room}`
          : `${l.start} · ${ins} · ${l.room}${session.role === "parent" ? "" : ". Çalışmayı unutma!"}`;
      return {
        id: `${session.role}-${l.id}`,
        lessonAt: at.toISOString(),
        at: new Date(at.getTime() - 24 * 3600_000).toISOString(),
        title,
        body,
        url: home,
      };
    })
    .sort((a, b) => a.at.localeCompare(b.at));
}

async function swRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await Promise.race([navigator.serviceWorker.ready, new Promise<null>((r) => setTimeout(() => r(null), 2500))]);
  return reg;
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function showLocal(title: string, body: string, url = "#/") {
  const reg = await swRegistration();
  const opts = { body, icon: "./icons/icon-192.png", badge: "./icons/badge-96.png", data: { url }, tag: title } as NotificationOptions;
  try {
    if (reg) await reg.showNotification(title, opts);
    else new Notification(title, opts);
  } catch {
    /* Android Chrome service worker olmadan Notification oluşturmaya izin vermez */
  }
}

export async function enableReminders(reminders: Reminder[]): Promise<{ ok: boolean; mode?: "push" | "local"; error?: string }> {
  if (!notificationsSupported()) return { ok: false, error: "Bu tarayıcı bildirimleri desteklemiyor." };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, error: "Bildirim izni verilmedi. Tarayıcı ayarlarından izin verebilirsiniz." };

  const settings = loadSettings();
  const reg = await swRegistration();
  if (reg && "PushManager" in window) {
    try {
      const res = await fetch(`${API}/key`);
      if (res.ok) {
        const { publicKey } = await res.json();
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
        const save = await fetch(`${API}/subscribe`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON(), reminders }),
        });
        if (save.ok) {
          saveSettings({ ...settings, enabled: true, mode: "push", endpoint: sub.endpoint });
          return { ok: true, mode: "push" };
        }
      }
    } catch {
      /* sunucu yok: yerel moda düş */
    }
  }
  saveSettings({ ...settings, enabled: true, mode: "local" });
  return { ok: true, mode: "local" };
}

export async function disableReminders() {
  const s = loadSettings();
  const reg = await swRegistration();
  const sub = await reg?.pushManager?.getSubscription();
  if (sub) {
    fetch(`${API}/unsubscribe`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  }
  saveSettings({ ...s, enabled: false, endpoint: undefined });
}

let lastSync = "";
/** Push modunda sunucudaki hatırlatma listesini günceller (veri değiştikçe) */
export async function syncReminders(reminders: Reminder[]) {
  const s = loadSettings();
  if (!s.enabled || s.mode !== "push" || !s.endpoint) return;
  const payload = JSON.stringify({ endpoint: s.endpoint, reminders });
  if (payload === lastSync) return;
  lastSync = payload;
  fetch(`${API}/reminders`, { method: "POST", headers: { "content-type": "application/json" }, body: payload }).catch(() => {});
}

/** Yerel mod: zamanı gelmiş ama henüz gösterilmemiş hatırlatmaları göster */
export async function checkLocalReminders(reminders: Reminder[]) {
  const s = loadSettings();
  if (!s.enabled || s.mode !== "local" || !notificationsSupported() || Notification.permission !== "granted") return;
  const now = new Date().toISOString();
  const due = reminders.filter((r) => r.at <= now && r.lessonAt > now && !s.notified.includes(r.id));
  for (const r of due) await showLocal(r.title, r.body, r.url);
  if (due.length) saveSettings({ ...s, notified: [...s.notified, ...due.map((r) => r.id)].slice(-200) });
}

/** Test bildirimi: push modunda sunucudan, aksi halde yerel */
export async function sendTest(sample?: Reminder): Promise<"push" | "local"> {
  const s = loadSettings();
  const title = sample?.title ?? "Armoni bildirimleri açık";
  const body = sample?.body ?? "Derslerinden 1 gün önce burada hatırlatma göreceksin.";
  if (s.enabled && s.mode === "push" && s.endpoint) {
    const res = await fetch(`${API}/test`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint: s.endpoint, title, body, url: sample?.url ?? "#/" }),
    }).catch(() => null);
    if (res?.ok) return "push";
  }
  await showLocal(title, body, sample?.url);
  return "local";
}
