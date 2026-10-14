import { useEffect, useRef, useState } from "react";
import { Eraser, Pause, Play } from "lucide-react";
import { Button, Tabs, cn } from "@/components/ui";
import { Scheduler, playDrum, type Drum } from "@/lib/audio";

const TRACKS: { id: Drum; label: string; color: string }[] = [
  { id: "hat", label: "Hi-hat", color: "#e0a126" },
  { id: "clap", label: "El çırpma", color: "#c43d62" },
  { id: "snare", label: "Trampet", color: "#14a38b" },
  { id: "kick", label: "Bas davul", color: "#5b4bdb" },
];

const P = (s: string) => s.split("").map((c) => c === "x");
const PRESETS: Record<string, Record<Drum, boolean[]>> = {
  Rock: { hat: P("x.x.x.x.x.x.x.x."), clap: P("................"), snare: P("....x.......x..."), kick: P("x.......x.x....."), },
  Pop: { hat: P("xxxxxxxxxxxxxxxx"), clap: P("....x.......x..."), snare: P("....x.......x..."), kick: P("x..x..x...x....."), },
  "Hip-hop": { hat: P("x.x.x.x.x.x.xxx."), clap: P("................"), snare: P("....x.......x..x"), kick: P("x.....x..x.x...."), },
  Bossa: { hat: P("x.x.x.x.x.x.x.x."), clap: P("x..x..x...x..x.."), snare: P("................"), kick: P("x..xx..xx..xx..x"), },
};

const clonePattern = (p: Record<Drum, boolean[]>) => JSON.parse(JSON.stringify(p)) as Record<Drum, boolean[]>;

const empty = (): Record<Drum, boolean[]> => ({ hat: Array(16).fill(false), clap: Array(16).fill(false), snare: Array(16).fill(false), kick: Array(16).fill(false) });

export default function RhythmLab() {
  const [grid, setGrid] = useState<Record<Drum, boolean[]>>(() => clonePattern(PRESETS.Rock));
  const [preset, setPreset] = useState("Rock");
  const [bpm, setBpm] = useState(100);
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const ref = useRef({ grid, bpm });
  ref.current = { grid, bpm };
  const sched = useRef<Scheduler | null>(null);
  if (!sched.current) {
    sched.current = new Scheduler(
      () => 60 / ref.current.bpm / 4,
      (s, time) => TRACKS.forEach((t) => ref.current.grid[t.id][s] && playDrum(t.id, time)),
      (s) => setStep(s),
      () => 16,
    );
  }
  useEffect(() => () => sched.current?.stop(), []);

  const toggle = () => {
    if (sched.current!.running) {
      sched.current!.stop();
      setRunning(false);
      setStep(-1);
    } else {
      sched.current!.start();
      setRunning(true);
    }
  };

  const flip = (d: Drum, i: number) => {
    setGrid((g) => ({ ...g, [d]: g[d].map((v, j) => (j === i ? !v : v)) }));
    setPreset("");
    if (!grid[d][i] && !running) playDrum(d);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Button icon={running ? Pause : Play} onClick={toggle} variant={running ? "secondary" : "primary"}>
          {running ? "Durdur" : "Çal"}
        </Button>
        <Tabs
          size="sm"
          value={preset}
          onChange={(p) => {
            setPreset(p);
            setGrid(clonePattern(PRESETS[p]));
          }}
          tabs={Object.keys(PRESETS).map((p) => ({ id: p, label: p }))}
        />
        <Button
          size="sm"
          variant="ghost"
          icon={Eraser}
          onClick={() => {
            setGrid(empty());
            setPreset("");
          }}
        >
          Temizle
        </Button>
        <div className="flex w-full items-center gap-3 sm:ml-auto sm:w-64">
          <span className="text-xs font-semibold text-muted">Tempo</span>
          <input type="range" min={60} max={180} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="range flex-1" style={{ ["--fill" as string]: `${((bpm - 60) / 120) * 100}%` }} aria-label="Tempo" />
          <span className="w-16 text-right text-sm font-bold tabular-nums">{bpm} BPM</span>
        </div>
      </div>

      <div className="no-scrollbar overflow-x-auto">
        <div className="min-w-[680px] space-y-2.5">
          <div className="grid grid-cols-[110px_repeat(16,minmax(0,1fr))] gap-1.5 pl-0">
            <span />
            {Array.from({ length: 16 }, (_, i) => (
              <span key={i} className={cn("text-center text-[10px] font-semibold tabular-nums", step === i ? "text-brand-600" : i % 4 === 0 ? "text-ink-2" : "text-faint")}>
                {i % 4 === 0 ? i / 4 + 1 : "·"}
              </span>
            ))}
          </div>
          {TRACKS.map((t) => (
            <div key={t.id} className="grid grid-cols-[110px_repeat(16,minmax(0,1fr))] gap-1.5">
              <button onClick={() => playDrum(t.id)} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 text-left text-[13px] font-semibold text-ink-2 hover:bg-canvas" title={`${t.label} sesini dinle`}>
                <span className="size-2.5 rounded-full" style={{ background: t.color }} />
                {t.label}
              </button>
              {grid[t.id].map((on, i) => (
                <button
                  key={i}
                  onClick={() => flip(t.id, i)}
                  aria-pressed={on}
                  aria-label={`${t.label}, adım ${i + 1}`}
                  className={cn(
                    "aspect-square cursor-pointer rounded-lg transition-all duration-100",
                    !on && (Math.floor(i / 4) % 2 === 0 ? "bg-canvas-2 hover:bg-line-strong" : "bg-canvas hover:bg-line-strong"),
                    step === i && "ring-2 ring-ink/70 ring-offset-1",
                    on && step === i && "scale-110",
                  )}
                  style={on ? { background: t.color } : undefined}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-5 text-xs text-muted">Kutulara dokunarak vuruş ekleyin veya kaldırın. Çalarken yaptığınız değişiklikler anında duyulur.</p>
    </div>
  );
}
