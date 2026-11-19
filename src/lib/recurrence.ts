/**
 * Tekrarlayan dersler: ilk ders tarihinden bitiş tarihine kadar seçilen periyotta tarih üretir.
 *   haftalık     → her hafta aynı gün
 *   iki haftalık → iki haftada bir aynı gün
 *   aylık        → her ay aynı sıradaki aynı gün (ör. ayın 3. çarşambası; 5. yoksa ayın son o günü)
 */
export type Repeat = "once" | "weekly" | "biweekly" | "monthly";

export const REPEATS: { id: Repeat; label: string }[] = [
  { id: "once", label: "Tek seferlik" },
  { id: "weekly", label: "Haftada bir" },
  { id: "biweekly", label: "İki haftada bir" },
  { id: "monthly", label: "Ayda bir" },
];

export const MAX_SERIES = 60;

const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Ayın n. haftanın gününü bulur; o ayda yoksa son o günü döner */
function nthWeekday(year: number, month: number, weekday: number, n: number) {
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  let day = 1 + offset + (n - 1) * 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  while (day > daysInMonth) day -= 7;
  return new Date(year, month, day);
}

export function seriesDates(start: string, repeat: Repeat, until: string): string[] {
  if (!start) return [];
  if (repeat === "once") return [start];
  const first = parse(start);
  const end = parse(until || start);
  const out: string[] = [];
  if (repeat === "monthly") {
    const n = Math.ceil(first.getDate() / 7);
    for (let i = 0; out.length < MAX_SERIES; i++) {
      const d = nthWeekday(first.getFullYear(), first.getMonth() + i, first.getDay(), n);
      if (d > end) break;
      out.push(fmt(d));
    }
    return out;
  }
  const step = repeat === "weekly" ? 7 : 14;
  for (let d = new Date(first); d <= end && out.length < MAX_SERIES; d.setDate(d.getDate() + step)) out.push(fmt(d));
  return out;
}

/** Varsayılan bitiş: 3 ay sonrası */
export function defaultUntil(start: string) {
  const d = parse(start);
  d.setMonth(d.getMonth() + 3);
  return fmt(d);
}

/** "ayın 3. Çarşambası" gibi açıklama */
export function repeatText(start: string, repeat: Repeat) {
  if (!start || repeat === "once") return "";
  const d = parse(start);
  const day = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"][d.getDay()];
  if (repeat === "weekly") return `Her ${day}`;
  if (repeat === "biweekly") return `İki haftada bir ${day}`;
  const n = Math.ceil(d.getDate() / 7);
  return `Her ayın ${n >= 5 ? "son" : `${n}.`} ${day} günü`;
}
