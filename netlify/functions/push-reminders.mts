import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import { sendDueReminders, type KV } from "../lib/push.mts";

/** Her 15 dakikada bir: dersine 24 saat kalan kullanıcılara bildirim gönderir */
export default async () => {
  const count = await sendDueReminders(getStore("armoni-push") as unknown as KV);
  console.log(`armoni push: ${count} hatırlatma gönderildi`);
};

export const config: Config = { schedule: "*/15 * * * *" };
