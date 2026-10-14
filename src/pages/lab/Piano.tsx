import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Keyboard } from "lucide-react";
import { IconButton, Tabs, cn } from "@/components/ui";
import { playNote, type Timbre } from "@/lib/audio";

const SOLFEGE = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
const LETTERS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
/** İki oktav + bir Do: alt sıra (Z…M) ve üst sıra (Q…I) — tracker düzeni */
const KEYMAP = ["z", "s", "x", "d", "c", "v", "g", "b", "h", "n", "j", "m", "q", "2", "w", "3", "e", "r", "5", "t", "6", "y", "7", "u", "i"];
const BLACK = new Set([1, 3, 6, 8, 10]);

export default function Piano() {
  const [base, setBase] = useState(60); // C4
  const [labels, setLabels] = useState<"solfege" | "letters" | "keys">("solfege");
  const [timbre, setTimbre] = useState<Timbre>("piano");
  const [down, setDown] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<string[]>([]);
  const pointerDown = useRef(false);

  const notes = Array.from({ length: 25 }, (_, i) => base + i);
  const whites = notes.filter((n) => !BLACK.has(n % 12));
  const W = 100 / whites.length;

  const press = useCallback(
    (midi: number) => {
      playNote(midi, timbre);
      setDown((d) => new Set(d).add(midi));
      setHistory((h) => [...h.slice(-11), `${SOLFEGE[midi % 12]}${Math.floor(midi / 12) - 1}`]);
    },
    [timbre],
  );
  const release = useCallback((midi: number) => {
    setDown((d) => {
      const n = new Set(d);
      n.delete(midi);
      return n;
    });
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || (e.target as HTMLElement).closest("input,textarea,select")) return;
      const i = KEYMAP.indexOf(e.key.toLowerCase());
      if (i >= 0) {
        e.preventDefault();
        press(base + i);
      } else if (e.key === "ArrowLeft") setBase((b) => Math.max(36, b - 12));
      else if (e.key === "ArrowRight") setBase((b) => Math.min(72, b + 12));
    };
    const onUp = (e: KeyboardEvent) => {
      const i = KEYMAP.indexOf(e.key.toLowerCase());
      if (i >= 0) release(base + i);
    };
    const onPointerUp = () => {
      pointerDown.current = false;
      setDown(new Set());
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [base, press, release]);

  const label = (midi: number) => {
    const i = midi - base;
    if (labels === "keys") return KEYMAP[i]?.toUpperCase();
    if (labels === "letters") return LETTERS[midi % 12] + (midi % 12 === 0 ? Math.floor(midi / 12) - 1 : "");
    return SOLFEGE[midi % 12];
  };

  const keyHandlers = (midi: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      pointerDown.current = true;
      press(midi);
    },
    onPointerEnter: () => pointerDown.current && press(midi),
    onPointerLeave: () => release(midi),
    "aria-label": `${SOLFEGE[midi % 12]} ${Math.floor(midi / 12) - 1}`,
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3 short:mb-2 short:gap-2">
        <Tabs size="sm" value={timbre} onChange={setTimbre} tabs={[{ id: "piano", label: "Piyano" }, { id: "soft", label: "Yumuşak" }, { id: "organ", label: "Org" }]} />
        <Tabs size="sm" value={labels} onChange={setLabels} tabs={[{ id: "solfege", label: "Do Re Mi" }, { id: "letters", label: "C D E" }, { id: "keys", label: "Klavye", icon: Keyboard }]} />
        <div className="ml-auto flex items-center gap-1 rounded-xl bg-canvas-2/80 p-1">
          <IconButton icon={ChevronLeft} label="Oktav aşağı (←)" className="size-7" onClick={() => setBase((b) => Math.max(36, b - 12))} disabled={base <= 36} />
          <span className="w-16 text-center text-xs font-semibold">
            Do{Math.floor(base / 12) - 1}–Do{Math.floor(base / 12) + 1}
          </span>
          <IconButton icon={ChevronRight} label="Oktav yukarı (→)" className="size-7" onClick={() => setBase((b) => Math.min(72, b + 12))} disabled={base >= 72} />
        </div>
      </div>

      <div className="rounded-3xl bg-ink p-3 pb-4 shadow-lift sm:p-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-1.5 rounded-full bg-white/25" />
            ))}
          </div>
          <div className="no-scrollbar flex min-h-6 max-w-[70%] gap-1 overflow-x-auto">
            {history.map((n, i) => (
              <span key={i} className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold", i === history.length - 1 ? "bg-[#7de3c4] text-ink" : "bg-white/10 text-white/60")}>
                {n}
              </span>
            ))}
          </div>
        </div>
        <div className="no-scrollbar overflow-x-auto">
          <div className="relative h-48 min-w-[640px] touch-none select-none sm:h-56 short:h-[max(130px,calc(100dvh-250px))]" onContextMenu={(e) => e.preventDefault()}>
            {whites.map((midi, i) => (
              <button
                key={midi}
                {...keyHandlers(midi)}
                className={cn(
                  "absolute top-0 bottom-0 flex cursor-pointer items-end justify-center rounded-b-xl border border-ink/15 pb-3 text-[11px] font-semibold transition-colors duration-75",
                  down.has(midi) ? "bg-brand-100 text-brand-700 shadow-[inset_0_-4px_0_var(--color-brand-400)]" : "bg-white text-faint shadow-[inset_0_-6px_0_#ececf1] hover:bg-[#fafafc]",
                )}
                style={{ left: `${i * W}%`, width: `calc(${W}% - 2px)` }}
              >
                {label(midi)}
              </button>
            ))}
            {notes
              .filter((n) => BLACK.has(n % 12))
              .map((midi) => {
                const whiteBefore = whites.filter((w) => w < midi).length;
                return (
                  <button
                    key={midi}
                    {...keyHandlers(midi)}
                    className={cn(
                      "absolute top-0 z-10 flex h-[60%] cursor-pointer items-end justify-center rounded-b-lg pb-2 text-[9.5px] font-semibold transition-colors duration-75",
                      down.has(midi) ? "bg-brand-500 text-white" : "bg-[#1d2240] text-white/50 shadow-[inset_0_-5px_0_#0c0f22] hover:bg-[#272d52]",
                    )}
                    style={{ left: `calc(${whiteBefore * W}% - ${W * 0.3}% - 1px)`, width: `${W * 0.6}%` }}
                  >
                    {labels === "keys" ? label(midi) : ""}
                  </button>
                );
              })}
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted short:hidden">
        Klavyeden çalmak için alt sıra <kbd className="rounded bg-canvas-2 px-1.5 py-0.5 font-sans font-semibold">Z S X D C…</kbd> ve üst sıra{" "}
        <kbd className="rounded bg-canvas-2 px-1.5 py-0.5 font-sans font-semibold">Q 2 W 3 E…</kbd> tuşlarını kullanın. Oktav değiştirmek için ← →.
      </p>
    </div>
  );
}
