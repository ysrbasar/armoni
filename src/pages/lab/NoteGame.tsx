import { useCallback, useEffect, useState } from "react";
import { Check, RotateCcw, Trophy, X } from "lucide-react";
import { Button, ProgressBar, Tabs, cn } from "@/components/ui";
import { playNote } from "@/lib/audio";

const NAMES = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const MIDI = [0, 2, 4, 5, 7, 9, 11];
const ROUND = 10;

/** d: Do4'ten itibaren diyatonik sıra (0 = Do4 … 12 = La5) */
const RANGES = { staff: [2, 10], ledger: [0, 12] } as const;

const midiOf = (d: number) => 60 + Math.floor(d / 7) * 12 + MIDI[d % 7];

function Staff({ d, state }: { d: number; state: "idle" | "right" | "wrong" }) {
  const y = (n: number) => 112 - (n - 2) * 8; // Mi4 alt çizgi
  const ny = y(d);
  const color = state === "right" ? "var(--color-mint-500)" : state === "wrong" ? "var(--color-rose-500)" : "var(--color-ink)";
  const up = d < 6;
  return (
    <svg viewBox="0 0 320 170" className="w-full max-w-lg" role="img" aria-label="Porte üzerinde bir nota">
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={16} x2={304} y1={y(2 + i * 2)} y2={y(2 + i * 2)} stroke="var(--color-ink-2)" strokeWidth={1.4} />
      ))}
      {/* Sol anahtarı (stilize) */}
      <path
        d="M58 150 C50 151 48 141 56 140 C62 139 63 148 58 150 M58 148 L66 34 C67 18 80 20 76 38 C72 56 42 66 42 96 C42 116 70 120 74 102 C77 88 60 82 53 92 C47 101 56 111 64 108"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Yardımcı çizgiler */}
      {d <= 0 && <line x1={176} x2={224} y1={y(0)} y2={y(0)} stroke="var(--color-ink-2)" strokeWidth={1.4} />}
      {d >= 12 && <line x1={176} x2={224} y1={y(12)} y2={y(12)} stroke="var(--color-ink-2)" strokeWidth={1.4} />}
      <g key={d} className="animate-pop-in" style={{ transformOrigin: `200px ${ny}px` }}>
        <ellipse cx={200} cy={ny} rx={11} ry={8} transform={`rotate(-20 200 ${ny})`} fill={color} />
        <line x1={up ? 210 : 190} x2={up ? 210 : 190} y1={ny + (up ? -2 : 2)} y2={ny + (up ? -52 : 52)} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      </g>
    </svg>
  );
}

export default function NoteGame() {
  const [range, setRange] = useState<keyof typeof RANGES>("staff");
  const [naming, setNaming] = useState<"solfege" | "letters">("solfege");
  const [d, setD] = useState(6);
  const [q, setQ] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => {
    try {
      return Number(localStorage.getItem("armoni-notegame-best") ?? 0);
    } catch {
      return 0;
    }
  });
  const [feedback, setFeedback] = useState<{ ok: boolean; pick: number } | null>(null);
  const finished = q >= ROUND;

  const nextNote = useCallback(
    (prev: number) => {
      const [lo, hi] = RANGES[range];
      let n = prev;
      while (n === prev) n = lo + Math.floor(Math.random() * (hi - lo + 1));
      return n;
    },
    [range],
  );

  const restart = useCallback(() => {
    setQ(0);
    setScore(0);
    setCorrect(0);
    setStreak(0);
    setFeedback(null);
    setD((p) => nextNote(p));
  }, [nextNote]);

  useEffect(() => restart(), [range, restart]);

  const answer = useCallback(
    (i: number) => {
      if (feedback || finished) return;
      const ok = d % 7 === i;
      playNote(midiOf(d), "piano", 0, 1.2);
      setFeedback({ ok, pick: i });
      if (ok) {
        setCorrect((c) => c + 1);
        setStreak((s) => s + 1);
        setScore((s) => s + 10 + Math.min(streak, 5) * 2);
      } else setStreak(0);
      setTimeout(() => {
        setFeedback(null);
        setQ((x) => x + 1);
        setD((p) => nextNote(p));
      }, ok ? 650 : 1300);
    },
    [d, feedback, finished, nextNote, streak],
  );

  useEffect(() => {
    if (finished && score > best) {
      setBest(score);
      try {
        localStorage.setItem("armoni-notegame-best", String(score));
      } catch {
        /* depolama kapalı olabilir */
      }
    }
  }, [finished, score, best]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select")) return;
      const k = e.key.toLowerCase();
      const n = Number(k);
      if (n >= 1 && n <= 7) answer(n - 1);
      else if (LETTERS.map((l) => l.toLowerCase()).includes(k)) answer(LETTERS.map((l) => l.toLowerCase()).indexOf(k));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer]);

  const label = (i: number) => (naming === "solfege" ? NAMES[i] : LETTERS[i]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs size="sm" value={range} onChange={setRange} tabs={[{ id: "staff", label: "Porte içi" }, { id: "ledger", label: "Yardımcı çizgiler" }]} />
        <Tabs size="sm" value={naming} onChange={setNaming} tabs={[{ id: "solfege", label: "Do Re Mi" }, { id: "letters", label: "C D E" }]} />
        <div className="ml-auto flex items-center gap-4 text-[13px]">
          <span className="text-muted">
            Seri <b className="text-ink tabular-nums">{streak}</b>
          </span>
          <span className="text-muted">
            Puan <b className="text-ink tabular-nums">{score}</b>
          </span>
          <span className="text-muted">
            En iyi <b className="text-ink tabular-nums">{best}</b>
          </span>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <ProgressBar value={(Math.min(q, ROUND) / ROUND) * 100} tone="mint" height={8} />
        <span className="shrink-0 text-xs font-semibold text-muted tabular-nums">
          {Math.min(q + (finished ? 0 : 1), ROUND)}/{ROUND}
        </span>
      </div>

      {finished ? (
        <div className="animate-pop-in flex flex-col items-center rounded-3xl bg-canvas px-6 py-12 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-sun-50 text-sun-600">
            <Trophy size={30} />
          </span>
          <p className="mt-4 text-2xl font-extrabold tracking-tight">{correct >= 8 ? "Harika kulak, harika göz!" : correct >= 5 ? "Güzel ilerleme!" : "Pratikle hızlanacaksın"}</p>
          <p className="mt-1 text-sm text-muted">
            {ROUND} sorudan {correct} doğru · {score} puan · %{Math.round((correct / ROUND) * 100)} doğruluk
          </p>
          <Button className="mt-6" icon={RotateCcw} onClick={restart}>
            Tekrar oyna
          </Button>
        </div>
      ) : (
        <>
          <div className={cn("relative flex justify-center rounded-3xl py-6 transition-colors", feedback ? (feedback.ok ? "bg-mint-50" : "bg-rose-50") : "bg-canvas")}>
            <Staff d={d} state={feedback ? (feedback.ok ? "right" : "wrong") : "idle"} />
            {feedback && (
              <span className={cn("animate-pop-in absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-white", feedback.ok ? "bg-mint-500" : "bg-rose-500")}>
                {feedback.ok ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
                {feedback.ok ? "Doğru!" : `Doğrusu: ${label(d % 7)}`}
              </span>
            )}
          </div>
          <p className="mt-5 mb-3 text-center text-sm font-semibold text-ink-2">Bu nota hangisi?</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {NAMES.map((_, i) => {
              const isAnswer = feedback && d % 7 === i;
              const isWrongPick = feedback && !feedback.ok && feedback.pick === i;
              return (
                <button
                  key={i}
                  onClick={() => answer(i)}
                  disabled={!!feedback}
                  className={cn(
                    "h-14 cursor-pointer rounded-2xl border text-[15px] font-bold transition",
                    isAnswer ? "border-mint-500 bg-mint-500 text-white" : isWrongPick ? "border-rose-500 bg-rose-500 text-white" : "border-line bg-surface hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift",
                  )}
                >
                  {label(i)}
                  <span className={cn("block text-[10px] font-medium", isAnswer || isWrongPick ? "text-white/80" : "text-faint")}>{i + 1}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
