import { useEffect, useRef, useState } from "react";
import { Hand, Minus, Pause, Play, Plus } from "lucide-react";
import { Button, IconButton, Tabs, cn } from "@/components/ui";
import { Scheduler, playClick } from "@/lib/audio";

const tempoName = (b: number) =>
  b < 60 ? "Largo" : b < 76 ? "Adagio" : b < 108 ? "Andante" : b < 120 ? "Moderato" : b < 168 ? "Allegro" : "Presto";

export default function Metronome({ initialBpm }: { initialBpm?: number }) {
  const [bpm, setBpm] = useState(initialBpm ?? 96);
  const [beats, setBeats] = useState("4");
  const [accent, setAccent] = useState(true);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  const [count, setCount] = useState(0);
  const cfg = useRef({ bpm, beats: Number(beats), accent });
  cfg.current = { bpm, beats: Number(beats), accent };
  const taps = useRef<number[]>([]);

  const sched = useRef<Scheduler | null>(null);
  if (!sched.current) {
    sched.current = new Scheduler(
      () => 60 / cfg.current.bpm,
      (step, time) => playClick(cfg.current.accent && step === 0, time),
      (step) => {
        setBeat(step);
        setCount((c) => c + 1);
      },
      () => cfg.current.beats,
    );
  }

  const toggle = () => {
    if (sched.current!.running) {
      sched.current!.stop();
      setRunning(false);
      setBeat(-1);
    } else {
      sched.current!.start();
      setRunning(true);
      setCount(0);
    }
  };

  // Vuruş sayısı değişince ölçüyü baştan başlat
  useEffect(() => {
    if (sched.current?.running) {
      sched.current.stop();
      sched.current.start();
    }
  }, [beats]);

  useEffect(() => () => sched.current?.stop(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select,button")) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const tap = () => {
    const now = performance.now();
    taps.current = [...taps.current.filter((t) => now - t < 2500), now].slice(-6);
    if (taps.current.length >= 2) {
      const gaps = taps.current.slice(1).map((t, i) => t - taps.current[i]);
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      setBpm(Math.max(40, Math.min(220, Math.round(60000 / avg))));
    }
  };

  const clamp = (v: number) => setBpm(Math.max(40, Math.min(220, v)));
  const n = Number(beats);
  const swing = beat < 0 ? 0 : count % 2 === 0 ? -24 : 24;

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_1fr] short:grid-cols-[1fr_1.4fr] short:gap-4">
      <div className="flex flex-col items-center">
        {/* Sarkaç */}
        <div className="relative h-56 w-56">
          <svg viewBox="0 0 200 200" className="absolute inset-0" aria-hidden>
            <path d="M60 190 L80 30 L120 30 L140 190 Z" fill="var(--color-canvas)" stroke="var(--color-line-strong)" strokeWidth="2" strokeLinejoin="round" />
            {[50, 70, 90, 110, 130, 150].map((y) => (
              <line key={y} x1={88} x2={112} y1={y} y2={y} stroke="var(--color-line-strong)" strokeWidth="1.5" />
            ))}
          </svg>
          <div
            className="absolute bottom-[18px] left-1/2 h-[170px] w-[3px] origin-bottom rounded-full bg-ink"
            style={{
              transform: `translateX(-50%) rotate(${swing}deg)`,
              transition: running ? `transform ${60 / bpm}s cubic-bezier(.45,0,.55,1)` : "transform .3s ease",
            }}
          >
            <span className="absolute left-1/2 -translate-x-1/2 rounded-md bg-sun-500 shadow-card" style={{ top: `${20 + ((bpm - 40) / 180) * 90}px`, width: 18, height: 14 }} />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          {Array.from({ length: n }, (_, i) => (
            <span
              key={i}
              className={cn(
                "size-5 rounded-full transition-all duration-75",
                beat === i ? (i === 0 && accent ? "scale-125 bg-sun-500" : "scale-125 bg-brand-500") : i === 0 && accent ? "bg-sun-100" : "bg-canvas-2",
              )}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-center text-sm font-semibold text-muted lg:text-left">{tempoName(bpm)}</p>
        <div className="mt-1 flex items-center justify-center gap-4 lg:justify-start">
          <IconButton icon={Minus} label="Tempoyu azalt" onClick={() => clamp(bpm - 1)} className="size-11 border border-line" />
          <p className="w-40 text-center">
            <span className="text-6xl font-extrabold tracking-tight tabular-nums">{bpm}</span>
            <span className="ml-1 text-sm font-semibold text-muted">BPM</span>
          </p>
          <IconButton icon={Plus} label="Tempoyu artır" onClick={() => clamp(bpm + 1)} className="size-11 border border-line" />
        </div>
        <input
          type="range"
          min={40}
          max={220}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="range mt-6 w-full"
          style={{ ["--fill" as string]: `${((bpm - 40) / 180) * 100}%` }}
          aria-label="Tempo"
        />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-[13px] font-semibold text-ink-2">Ölçü</span>
          <Tabs size="sm" value={beats} onChange={setBeats} tabs={["2", "3", "4", "6"].map((b) => ({ id: b, label: `${b}/4` }))} />
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink-2">
            <input type="checkbox" checked={accent} onChange={(e) => setAccent(e.target.checked)} className="size-4 accent-brand-600" />
            İlk vuruşu vurgula
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <Button size="lg" icon={running ? Pause : Play} onClick={toggle} className="flex-1" variant={running ? "secondary" : "primary"}>
            {running ? "Durdur" : "Başlat"}
          </Button>
          <Button size="lg" variant="secondary" icon={Hand} onClick={tap} title="Ritimle birkaç kez dokunun">
            Tap tempo
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted">İpucu: Boşluk tuşu ile başlat / durdur.</p>
      </div>
    </div>
  );
}
