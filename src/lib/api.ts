import type { DemoData } from "@/data/types";

/** Sunucudaki giriş hesabı (şifre bilgisi asla gelmez) */
export interface AppUser {
  id: string;
  username: string;
  role: "inst" | "teacher" | "student" | "parent";
  entityId: string;
  name: string;
  mustChange: boolean;
}

export interface Account extends AppUser {
  createdAt: string;
  lastLogin?: string;
}

export class ApiError extends Error {
  status: number;
  problems?: string[];
  constructor(message: string, status: number, problems?: string[]) {
    super(message);
    this.status = status;
    this.problems = problems;
  }
}

async function req<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/app/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.", 0);
  }
  let j: Record<string, unknown> = {};
  try {
    j = await res.json();
  } catch {
    /* boş yanıt */
  }
  if (!res.ok) throw new ApiError(String(j.error ?? "Beklenmeyen bir hata oluştu"), res.status, j.problems as string[] | undefined);
  return j as T;
}

export type Changes = Partial<Record<string, { upsert?: unknown[]; delete?: string[] }>>;

export const api = {
  state: () => req<{ user: AppUser | null; setupRequired: boolean; data?: Partial<DemoData> }>("state"),
  setup: (b: { code: string; name: string; username: string; password: string }) => req<{ user: AppUser }>("setup", b),
  login: (username: string, password: string) => req<{ user: AppUser }>("login", { username, password }),
  logout: () => req<{ ok: true }>("logout", {}),
  password: (current: string, next: string) => req<{ user: AppUser }>("password", { current, next }),
  sync: (changes: Changes) => req<{ ok: true; rejected: number }>("sync", { changes }),
  accounts: () => req<{ accounts: Account[] }>("accounts"),
  createAccount: (b: { role: AppUser["role"]; entityId: string; username: string; name?: string }) =>
    req<{ account: AppUser; tempPassword: string }>("accounts/create", b),
  resetAccount: (id: string) => req<{ tempPassword: string }>("accounts/reset", { id }),
  deleteAccount: (id: string) => req<{ ok: true }>("accounts/delete", { id }),
};

/** Kılavuzdaki şifre kuralları: ekranda anlık gösterim için (asıl denetim sunucuda) */
export function passwordRules(pw: string, username: string) {
  const u = username.toLocaleLowerCase("tr");
  return [
    { ok: pw.length >= 8, text: "En az 8 karakter" },
    { ok: /[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(pw) && /\d/.test(pw), text: "En az bir harf ve bir rakam" },
    { ok: !(u.length >= 3 && pw.toLocaleLowerCase("tr").includes(u)) && !(/^\d{11}$/.test(u) && pw.includes(u.slice(-6))), text: "Kullanıcı adını / TC'yi içermez" },
  ];
}

/** Türkçe karakterleri sadeleştirip kullanıcı adı önerisi üretir: "Ece Örnek" → ece.ornek */
export function suggestUsername(name: string) {
  return name
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 40);
}

/** Silinen kişilerin giriş hesaplarını da kaldırır (yalnızca kurum yöneticisi) */
export async function deleteAccountsOf(entityIds: string[]) {
  const { accounts } = await api.accounts();
  const gone = accounts.filter((a) => a.role !== "inst" && entityIds.includes(a.entityId));
  for (const a of gone) await api.deleteAccount(a.id);
  return gone.length;
}
