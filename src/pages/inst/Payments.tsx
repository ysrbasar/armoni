import { useMemo, useState } from "react";
import { AlertTriangle, BellRing, CheckCircle2, Clock3, Search, Undo2, Wallet } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, IconButton, Input, Modal, Select, StatCard, Tabs, cn } from "@/components/ui";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { SimpleBars } from "@/components/charts";
import { instrumentById } from "@/data/catalog";
import { PAYMENT_STATE, paymentState, tl, type PaymentState } from "@/lib/selectors";
import { fmtDate, relativeDay } from "@/lib/date";
import type { Payment, PaymentMethod } from "@/data/types";

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const periodLabel = (p: string) => `${MONTHS[Number(p.slice(5, 7)) - 1]} ${p.slice(0, 4)}`;
const METHODS: PaymentMethod[] = ["Kredi kartı", "Havale/EFT", "Nakit"];

export default function Payments() {
  const data = useStore((s) => s.data);
  const instId = useStore((s) => s.session.institutionId);
  const markUnpaid = useStore((s) => s.markPaymentUnpaid);
  const remind = useStore((s) => s.remindPayment);
  const inst = data.institutions.find((i) => i.id === instId)!;
  const all = data.payments.filter((p) => p.institutionId === instId);
  const periods = useMemo(() => Array.from(new Set(all.map((p) => p.period))).sort().reverse(), [all]);
  const [period, setPeriod] = useState(periods[0] ?? "all");
  const [state, setState] = useState<"all" | PaymentState>("all");
  const [q, setQ] = useState("");
  const [collecting, setCollecting] = useState<Payment | null>(null);

  const student = (id: string) => data.students.find((s) => s.id === id);
  const inPeriod = all.filter((p) => period === "all" || p.period === period);
  const rows = inPeriod
    .filter((p) => state === "all" || paymentState(p) === state)
    .filter((p) => (student(p.studentId)?.name ?? "").toLocaleLowerCase("tr").includes(q.trim().toLocaleLowerCase("tr")))
    .sort((a, b) => {
      const order = { overdue: 0, pending: 1, paid: 2 };
      return order[paymentState(a)] - order[paymentState(b)] || a.dueDate.localeCompare(b.dueDate);
    });

  const sum = (list: Payment[]) => list.reduce((a, p) => a + p.amount, 0);
  const paid = inPeriod.filter((p) => paymentState(p) === "paid");
  const pending = inPeriod.filter((p) => paymentState(p) === "pending");
  const overdueAll = all.filter((p) => paymentState(p) === "overdue");
  const rate = Math.round((sum(paid) / Math.max(sum(inPeriod), 1)) * 100);
  const chart = [...periods].reverse().map((p) => ({ name: MONTHS[Number(p.slice(5, 7)) - 1].slice(0, 3), value: sum(all.filter((x) => x.period === p && x.paidAt)) }));

  return (
    <>
      <PageHeader title="Ödeme takibi" subtitle={`${inst.name} · aylık bireysel ders ücreti ${tl(inst.fee)}`} />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Tahsil edilen" value={tl(sum(paid))} icon={CheckCircle2} tone="mint" hint={`${paid.length} ödeme · ${period === "all" ? "tüm dönemler" : periodLabel(period)}`} />
        <StatCard label="Bekleyen" value={tl(sum(pending))} icon={Clock3} tone="sun" hint={`${pending.length} öğrenci`} onClick={() => setState("pending")} />
        <StatCard label="Gecikmiş" value={tl(sum(overdueAll))} icon={AlertTriangle} tone="rose" hint={`${overdueAll.length} ödeme · tüm dönemler`} onClick={() => { setPeriod("all"); setState("overdue"); }} />
        <StatCard label="Tahsilat oranı" value={`%${rate}`} icon={Wallet} tone="brand" hint="Seçili dönem" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-wrap items-center gap-2 p-4">
            <Tabs
              size="sm"
              value={state}
              onChange={setState}
              tabs={[
                { id: "all", label: "Tümü", count: inPeriod.length },
                { id: "overdue", label: "Gecikmiş", count: inPeriod.filter((p) => paymentState(p) === "overdue").length },
                { id: "pending", label: "Bekliyor", count: pending.length },
                { id: "paid", label: "Ödendi", count: paid.length },
              ]}
            />
            <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
              <div className="relative flex-1 sm:w-44">
                <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Öğrenci ara" className="h-9 pl-8" aria-label="Öğrenci ara" />
              </div>
              <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="h-9 w-40" aria-label="Dönem">
                <option value="all">Tüm dönemler</option>
                {periods.map((p) => (
                  <option key={p} value={p}>
                    {periodLabel(p)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="divide-y divide-line border-t border-line">
            {rows.length === 0 && <EmptyState icon={Wallet} title="Bu filtrede ödeme yok" />}
            {rows.map((p) => {
              const s = student(p.studentId);
              if (!s) return null;
              const st = paymentState(p);
              const parent = data.parents.find((x) => x.id === s.parentId);
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
                  <Avatar name={s.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-[13.5px] font-semibold">
                      {s.name}
                      <InstrumentBadge id={s.instrument} size={20} rounded="rounded-md" />
                    </p>
                    <p className="truncate text-xs text-muted">
                      {periodLabel(p.period)} · {instrumentById[s.instrument].name}
                      {parent && ` · Veli: ${parent.name}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums">{tl(p.amount)}</p>
                    <p className={cn("text-[11px]", st === "overdue" ? "font-semibold text-rose-600" : "text-muted")}>
                      {st === "paid" ? `${fmtDate(p.paidAt!)} · ${p.method}` : `Son gün: ${relativeDay(p.dueDate)}`}
                    </p>
                  </div>
                  <Badge tone={PAYMENT_STATE[st].tone} dot className="w-24 justify-center">
                    {PAYMENT_STATE[st].label}
                  </Badge>
                  <div className="flex w-full justify-end gap-1 sm:w-auto">
                    {st === "paid" ? (
                      <IconButton icon={Undo2} label="Ödeme kaydını geri al" onClick={() => markUnpaid(p.id)} />
                    ) : (
                      <>
                        <IconButton icon={BellRing} label="Veliye hatırlat" onClick={() => remind(p.id)} />
                        <Button size="sm" variant="soft" onClick={() => setCollecting(p)}>
                          Ödeme al
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Aylık tahsilat" subtitle="Son 4 dönem" />
            <div className="px-3 pt-3 pb-3">
              <SimpleBars data={chart} valueLabel="Tahsilat" unit=" TL" height={200} color="#14a38b" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Gecikmiş ödemeler" subtitle={overdueAll.length ? `${overdueAll.length} kayıt` : "Gecikme yok"} icon={AlertTriangle} />
            <ul className="space-y-1 p-3">
              {overdueAll.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{student(p.studentId)?.name}</span>
                    <span className="text-xs text-muted">{periodLabel(p.period)}</span>
                  </span>
                  <Button size="sm" variant="secondary" onClick={() => setCollecting(p)}>
                    {tl(p.amount)}
                  </Button>
                </li>
              ))}
              {overdueAll.length === 0 && <EmptyState icon={CheckCircle2} title="Tüm ödemeler güncel" />}
            </ul>
          </Card>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">Demo: ödeme alma işlemi yalnızca kayıt tutar; gerçek tahsilat veya ödeme altyapısı yoktur.</p>
      {collecting && <CollectModal payment={collecting} onClose={() => setCollecting(null)} />}
    </>
  );
}

function CollectModal({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const markPaid = useStore((s) => s.markPaymentPaid);
  const s = useStore((st) => st.data.students.find((x) => x.id === payment.studentId))!;
  const [method, setMethod] = useState<PaymentMethod>("Kredi kartı");
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Ödeme al"
      subtitle={`${s.name} · ${periodLabel(payment.period)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="mint"
            onClick={() => {
              markPaid(payment.id, method);
              onClose();
            }}
          >
            {tl(payment.amount)} tahsil edildi
          </Button>
        </>
      }
    >
      <p className="mb-2 text-[13px] font-semibold text-ink-2">Ödeme yöntemi</p>
      <div className="grid grid-cols-3 gap-2">
        {METHODS.map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={cn("h-11 cursor-pointer rounded-xl border text-[13px] font-semibold transition", method === m ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line text-ink-2")}
          >
            {m}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">Son ödeme günü: {fmtDate(payment.dueDate)}</p>
    </Modal>
  );
}
