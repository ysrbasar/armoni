import { useState } from "react";
import { Drum, Music4, Piano as PianoIcon, Timer, Volume2, VolumeX, type LucideIcon } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Card, cn } from "@/components/ui";
import { setMuted, setVolume } from "@/lib/audio";
import Piano from "./Piano";
import Metronome from "./Metronome";
import RhythmLab from "./RhythmLab";
import NoteGame from "./NoteGame";
import { PageHeader } from "@/components/layout/AdminShell";

type Tool = "piano" | "metronome" | "rhythm" | "notes";

const TOOLS: { id: Tool; label: string; text: string; icon: LucideIcon; tint: string; tone: string }[] = [
  { id: "piano", label: "Sanal piyano", text: "Fare, dokunma veya klavyeyle çal", icon: PianoIcon, tint: "#efecff", tone: "#5b4bdb" },
  { id: "metronome", label: "Metronom", text: "Tempo ve vuruş çalışması", icon: Timer, tint: "#fdf3e1", tone: "#b97f12" },
  { id: "rhythm", label: "Ritim laboratuvarı", text: "Kendi ritmini oluştur", icon: Drum, tint: "#e6f6f1", tone: "#0f8a75" },
  { id: "notes", label: "Nota oyunu", text: "Portedeki notayı bul", icon: Music4, tint: "#fdeef1", tone: "#c43d62" },
];

export default function MusicLab({ initial }: { initial?: string }) {
  const role = useStore((s) => s.session.role);
  const [initTool, initBpm] = (initial ?? "").split("-");
  const [tool, setTool] = useState<Tool>(TOOLS.some((t) => t.id === initTool) ? (initTool as Tool) : "piano");
  const [vol, setVol] = useState(70);
  const [mute, setMute] = useState(false);

  const volumeControl = (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2">
      <button
        onClick={() => {
          setMute(!mute);
          setMuted(!mute);
        }}
        className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink-2 hover:bg-canvas"
        aria-label={mute ? "Sesi aç" : "Sesi kapat"}
        title={mute ? "Sesi aç" : "Sesi kapat"}
      >
        {mute || vol === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        value={vol}
        aria-label="Ses düzeyi"
        className="range w-28"
        style={{ ["--fill" as string]: `${vol}%` }}
        onChange={(e) => {
          const v = Number(e.target.value);
          setVol(v);
          setVolume(v / 100);
          if (mute) {
            setMute(false);
            setMuted(false);
          }
        }}
      />
      <span className="w-8 text-right text-xs font-semibold text-muted tabular-nums">{mute ? 0 : vol}</span>
    </div>
  );

  return (
    <>
      {role === "teacher" ? (
        <PageHeader title="Müzik Laboratuvarı" subtitle="Derste ve evde kullanılabilen etkileşimli araçlar" actions={volumeControl} />
      ) : (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-muted">Çal, dinle, keşfet</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.03em]">Müzik Laboratuvarı</h1>
          </div>
          {volumeControl}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" role="tablist" aria-label="Laboratuvar araçları">
        {TOOLS.map((t) => {
          const active = t.id === tool;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTool(t.id)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition sm:p-4",
                active ? "border-transparent bg-ink text-white shadow-lift" : "border-line bg-surface hover:border-line-strong",
              )}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={active ? { background: "rgba(255,255,255,.12)", color: "#fff" } : { background: t.tint, color: t.tone }}>
                <t.icon size={21} strokeWidth={1.8} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-bold">{t.label}</span>
                <span className={cn("hidden truncate text-xs sm:block", active ? "text-white/60" : "text-muted")}>{t.text}</span>
              </span>
            </button>
          );
        })}
      </div>

      <Card className="p-4 sm:p-6">
        {tool === "piano" && <Piano />}
        {tool === "metronome" && <Metronome initialBpm={initTool === "metronome" && Number(initBpm) ? Number(initBpm) : undefined} />}
        {tool === "rhythm" && <RhythmLab />}
        {tool === "notes" && <NoteGame />}
      </Card>
    </>
  );
}
