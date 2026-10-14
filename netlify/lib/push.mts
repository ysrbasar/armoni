import webpush from "web-push";
import { createHash } from "node:crypto";

/** Blob deposu için gereken en küçük arayüz (testte bellek içi sürüm verilebilir) */
export interface KV {
  get(key: string, opts: { type: "json" }): Promise<unknown>;
  setJSON(key: string, value: unknown): Promise<unknown>;
  delete(key: string): Promise<unknown>;
  list(opts: { prefix: string }): Promise<{ blobs: { key: string }[] }>;
}

export interface Reminder {
  id: string;
  at: string;
  lessonAt: string;
  title: string;
  body: string;
  url: string;
}

export interface SubRecord {
  subscription: webpush.PushSubscription;
  reminders: Reminder[];
  sent: string[];
  updatedAt: string;
}

const SUBJECT = "mailto:bildirim@armoni.app";

/** VAPID anahtarları: ortam değişkeni yoksa ilk istekte üretilip depoda saklanır */
export async function vapid(kv: KV) {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  }
  const saved = (await kv.get("vapid", { type: "json" })) as { publicKey: string; privateKey: string } | null;
  if (saved) return saved;
  const keys = webpush.generateVAPIDKeys();
  await kv.setJSON("vapid", keys);
  return keys;
}

export const subKey = (endpoint: string) => `sub:${createHash("sha256").update(endpoint).digest("hex").slice(0, 32)}`;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

export function cleanReminders(input: unknown): Reminder[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 60).flatMap((r) => {
    const at = str(r?.at, 40);
    const lessonAt = str(r?.lessonAt, 40);
    if (!at || Number.isNaN(Date.parse(at)) || Number.isNaN(Date.parse(lessonAt))) return [];
    const url = str(r?.url, 120);
    return [{ id: str(r?.id, 80), at, lessonAt, title: str(r?.title, 120), body: str(r?.body, 240), url: url.startsWith("#") ? url : "#/" }];
  });
}

export function validSubscription(s: unknown): s is webpush.PushSubscription {
  const sub = s as webpush.PushSubscription;
  return !!sub && typeof sub.endpoint === "string" && sub.endpoint.startsWith("https://") && !!sub.keys?.p256dh && !!sub.keys?.auth;
}

export async function send(kv: KV, sub: webpush.PushSubscription, payload: { title: string; body: string; url: string; tag?: string }) {
  const keys = await vapid(kv);
  webpush.setVapidDetails(SUBJECT, keys.publicKey, keys.privateKey);
  return webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 6 * 3600, urgency: "normal" });
}

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

/** /api/push/* yönlendirmesi */
export async function handlePush(req: Request, kv: KV): Promise<Response> {
  const action = new URL(req.url).pathname.split("/").filter(Boolean).pop();
  if (req.method === "GET" && action === "key") return json({ publicKey: (await vapid(kv)).publicKey });
  if (req.method !== "POST") return json({ error: "Yöntem desteklenmiyor" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Geçersiz istek gövdesi" }, 400);
  }

  if (action === "subscribe") {
    if (!validSubscription(body.subscription)) return json({ error: "Geçersiz abonelik" }, 400);
    const key = subKey(body.subscription.endpoint);
    const prev = (await kv.get(key, { type: "json" })) as SubRecord | null;
    const rec: SubRecord = { subscription: body.subscription, reminders: cleanReminders(body.reminders), sent: prev?.sent ?? [], updatedAt: new Date().toISOString() };
    await kv.setJSON(key, rec);
    return json({ ok: true, reminders: rec.reminders.length });
  }

  const endpoint = str(body.endpoint, 1000);
  if (!endpoint) return json({ error: "endpoint gerekli" }, 400);
  const key = subKey(endpoint);
  const rec = (await kv.get(key, { type: "json" })) as SubRecord | null;

  if (action === "unsubscribe") {
    await kv.delete(key);
    return json({ ok: true });
  }
  if (!rec) return json({ error: "Abonelik bulunamadı" }, 404);

  if (action === "reminders") {
    await kv.setJSON(key, { ...rec, reminders: cleanReminders(body.reminders), updatedAt: new Date().toISOString() });
    return json({ ok: true });
  }
  if (action === "test") {
    try {
      await send(kv, rec.subscription, { title: str(body.title, 120) || "Armoni", body: str(body.body, 240), url: "#/", tag: "test" });
      return json({ ok: true });
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await kv.delete(key);
      return json({ error: "Bildirim gönderilemedi" }, 502);
    }
  }
  return json({ error: "Bilinmeyen işlem" }, 404);
}

/** Zamanı gelmiş hatırlatmaları gönderir (zamanlanmış fonksiyon çağırır) */
export async function sendDueReminders(kv: KV, now = new Date()) {
  const iso = now.toISOString();
  const { blobs } = await kv.list({ prefix: "sub:" });
  let sentCount = 0;
  for (const { key } of blobs) {
    const rec = (await kv.get(key, { type: "json" })) as SubRecord | null;
    if (!rec) continue;
    const due = rec.reminders.filter((r) => r.at <= iso && r.lessonAt > iso && !rec.sent.includes(r.id));
    if (!due.length) continue;
    const sent: string[] = [];
    let gone = false;
    for (const r of due) {
      try {
        await send(kv, rec.subscription, { title: r.title, body: r.body, url: r.url, tag: r.id });
        sent.push(r.id);
        sentCount++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone = true;
        break;
      }
    }
    if (gone) await kv.delete(key);
    else if (sent.length) await kv.setJSON(key, { ...rec, sent: [...rec.sent, ...sent].slice(-300) });
  }
  return sentCount;
}
