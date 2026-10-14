/**
 * Tarayıcı içi ses motoru (Web Audio API). Harici dosya veya servis kullanılmaz.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let volume = 0.7;
let muted = false;

export function audio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    master.gain.value = muted ? 0 : volume;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return { ctx, out: master! };
}

export function setVolume(v: number) {
  volume = v;
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : v, ctx.currentTime, 0.02);
}

export function setMuted(m: boolean) {
  muted = m;
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : volume, ctx.currentTime, 0.02);
}

export const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export type Timbre = "piano" | "soft" | "organ";

/** Piyano benzeri ton: iki osilatör, hızlı atak ve doğal sönüm */
export function playNote(midi: number, timbre: Timbre = "piano", when = 0, duration = 1.6) {
  const { ctx, out } = audio();
  const t = when || ctx.currentTime;
  const f = midiToFreq(midi);
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(timbre === "soft" ? 1400 : Math.min(9000, f * 9), t);
  filter.frequency.exponentialRampToValueAtTime(Math.max(400, f * 2), t + duration);
  filter.connect(gain).connect(out);

  const oscs: OscillatorNode[] = [];
  const add = (type: OscillatorType, mult: number, level: number, detune = 0) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = f * mult;
    o.detune.value = detune;
    g.gain.value = level;
    o.connect(g).connect(filter);
    oscs.push(o);
  };
  if (timbre === "piano") {
    add("triangle", 1, 0.6);
    add("sine", 2, 0.18, 3);
    add("sine", 3, 0.06, -4);
  } else if (timbre === "soft") {
    add("sine", 1, 0.7);
    add("triangle", 2, 0.08);
  } else {
    add("sine", 1, 0.4);
    add("sine", 2, 0.25);
    add("sine", 4, 0.12);
    add("square", 1, 0.03);
  }

  const peak = 0.32;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + (timbre === "organ" ? 0.03 : 0.006));
  if (timbre === "organ") {
    gain.gain.setTargetAtTime(peak * 0.8, t + 0.05, 0.1);
    gain.gain.setTargetAtTime(0.0001, t + duration * 0.6, 0.12);
  } else {
    gain.gain.exponentialRampToValueAtTime(peak * 0.35, t + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  }
  oscs.forEach((o) => {
    o.start(t);
    o.stop(t + duration + 0.1);
  });
}

function noise() {
  const { ctx } = audio();
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  return src;
}

export type Drum = "kick" | "snare" | "hat" | "clap";

export function playDrum(kind: Drum, when = 0) {
  const { ctx, out } = audio();
  const t = when || ctx.currentTime;
  if (kind === "kick") {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.45);
  } else if (kind === "snare") {
    const n = noise();
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 1200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    n.connect(f).connect(g).connect(out);
    n.start(t);
    n.stop(t + 0.2);
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(220, t);
    og.gain.setValueAtTime(0.5, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(og).connect(out);
    o.start(t);
    o.stop(t + 0.12);
  } else if (kind === "hat") {
    const n = noise();
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    n.connect(f).connect(g).connect(out);
    n.start(t);
    n.stop(t + 0.06);
  } else {
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1500;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    f.connect(g).connect(out);
    [0, 0.012, 0.024].forEach((d) => {
      const n = noise();
      n.connect(f);
      n.start(t + d);
      n.stop(t + d + 0.2);
    });
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.6, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  }
}

export function playClick(accent: boolean, when = 0) {
  const { ctx, out } = audio();
  const t = when || ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = accent ? 1760 : 1100;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(accent ? 0.7 : 0.45, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.08);
}

/**
 * Hassas zamanlayıcı: setInterval yalnızca ileriye bakıp sesleri AudioContext saatine planlar.
 * Görsel geri bildirim, planlanan zamana göre requestAnimationFrame ile senkronlanır.
 */
export class Scheduler {
  private timer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private raf = 0;
  private queue: { step: number; time: number }[] = [];

  constructor(
    private getInterval: () => number,
    private onSchedule: (step: number, time: number) => void,
    private onVisual: (step: number) => void,
    private steps: () => number,
  ) {}

  start() {
    const { ctx } = audio();
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.06;
    this.queue = [];
    this.timer = window.setInterval(() => this.tick(), 25);
    const draw = () => {
      const now = ctx.currentTime;
      while (this.queue.length && this.queue[0].time <= now) {
        this.onVisual(this.queue.shift()!.step);
      }
      this.raf = requestAnimationFrame(draw);
    };
    this.raf = requestAnimationFrame(draw);
  }

  private tick() {
    const { ctx } = audio();
    while (this.nextTime < ctx.currentTime + 0.12) {
      this.onSchedule(this.step, this.nextTime);
      this.queue.push({ step: this.step, time: this.nextTime });
      this.nextTime += this.getInterval();
      this.step = (this.step + 1) % this.steps();
    }
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    cancelAnimationFrame(this.raf);
    this.timer = null;
    this.queue = [];
  }

  get running() {
    return this.timer !== null;
  }
}
