const pad = (n: number) => String(n).padStart(2, "0");

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayISO = () => toISO(new Date());

export const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (iso: string, n: number) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

export const diffDays = (a: string, b: string) =>
  Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / 86_400_000);

/** Pazartesi başlangıçlı hafta */
export const weekStart = (iso: string) => {
  const d = parseISO(iso);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return toISO(d);
};

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
export const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
export const DAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export const dayIndex = (iso: string) => (parseISO(iso).getDay() + 6) % 7;

export const fmtDate = (iso: string) => {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export const fmtDateShort = (iso: string) => {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

export const fmtDateLong = (iso: string) => {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${DAYS[dayIndex(iso)]}`;
};

export const relativeDay = (iso: string) => {
  const n = diffDays(iso, todayISO());
  if (n === 0) return "Bugün";
  if (n === 1) return "Yarın";
  if (n === -1) return "Dün";
  if (n > 1 && n < 7) return `${n} gün sonra`;
  if (n < -1 && n > -7) return `${-n} gün önce`;
  return fmtDate(iso);
};

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const fromMinutes = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

export const timeAgo = (isoDateTime: string) => {
  const diff = (Date.now() - new Date(isoDateTime).getTime()) / 60_000;
  if (diff < 1) return "az önce";
  if (diff < 60) return `${Math.round(diff)} dk önce`;
  if (diff < 60 * 24) return `${Math.round(diff / 60)} sa önce`;
  const days = Math.round(diff / (60 * 24));
  return days === 1 ? "dün" : `${days} gün önce`;
};
