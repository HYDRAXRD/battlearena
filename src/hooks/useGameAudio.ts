import { useEffect, useRef, useCallback, useState } from 'react';

// ─────────────────────────────────────────────────────────────────
// useGameAudio — Procedurally generated audio via Web Audio API
// All sounds are synthesized in code: 100% royalty-free.
// ─────────────────────────────────────────────────────────────────

type AudioMode = 'menu' | 'battle' | 'off';

interface UseGameAudioReturn {
  muted: boolean;
  toggleMute: () => void;
  playMode: (mode: AudioMode) => void;
  stopAll: () => void;
  playSfx: (type: 'hit' | 'win' | 'lose' | 'ability' | 'buy') => void;
}

export function useGameAudio(): UseGameAudioReturn {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const loopRef = useRef<number | null>(null);
  const currentModeRef = useRef<AudioMode>('off');
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  // ── Init AudioContext on first interaction ──
  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterRef.current = ctxRef.current.createGain();
      masterRef.current.gain.value = 0.35;
      masterRef.current.connect(ctxRef.current.destination);
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // ── Low-level oscillator helper ──
  const playNote = useCallback((
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = 'square',
    gainVal = 0.18,
    ctx?: AudioContext,
    master?: GainNode,
  ) => {
    const c = ctx || ctxRef.current;
    const m = master || masterRef.current;
    if (!c || !m || mutedRef.current) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gainVal, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(g);
    g.connect(m);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }, []);

  // ── SFX ──
  const playSfx = useCallback((type: 'hit' | 'win' | 'lose' | 'ability' | 'buy') => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const m = masterRef.current!;
    const t = ctx.currentTime;
    switch (type) {
      case 'hit': {
        // Short low thud
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const src = ctx.createBufferSource();
        const g = ctx.createGain();
        src.buffer = buf;
        g.gain.value = 0.4;
        src.connect(g); g.connect(m);
        src.start(t);
        break;
      }
      case 'ability': {
        // Rising sweep
        playNote(220, t, 0.06, 'sawtooth', 0.22, ctx, m);
        playNote(440, t + 0.06, 0.06, 'sawtooth', 0.22, ctx, m);
        playNote(880, t + 0.12, 0.1, 'sawtooth', 0.22, ctx, m);
        break;
      }
      case 'win': {
        // Victory fanfare arpeggio
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => playNote(f, t + i * 0.1, 0.18, 'square', 0.25, ctx, m));
        break;
      }
      case 'lose': {
        // Descending sad melody
        const notes = [392, 349, 311, 261];
        notes.forEach((f, i) => playNote(f, t + i * 0.15, 0.22, 'triangle', 0.25, ctx, m));
        break;
      }
      case 'buy': {
        // Coin chime
        playNote(1047, t, 0.08, 'sine', 0.3, ctx, m);
        playNote(1319, t + 0.08, 0.1, 'sine', 0.3, ctx, m);
        break;
      }
    }
  }, [getCtx, playNote]);

  // ── MENU MUSIC — ambient chiptune loop ──
  const startMenuMusic = useCallback(() => {
    const ctx = getCtx();
    const m = masterRef.current!;
    // C major pentatonic: C D E G A
    const scale = [261, 294, 329, 392, 440, 523, 587, 659];
    const melody = [0, 2, 4, 7, 4, 2, 0, 5, 4, 2, 7, 4, 2, 0, 3, 5];
    const beatLen = 0.22; // seconds per step
    let step = 0;
    let nextTime = ctx.currentTime + 0.05;

    const schedule = () => {
      if (mutedRef.current || currentModeRef.current !== 'menu') return;
      const bufferAhead = 0.5;
      while (nextTime < ctx.currentTime + bufferAhead) {
        const freq = scale[melody[step % melody.length]];
        // Melody (triangle)
        playNote(freq, nextTime, beatLen * 0.7, 'triangle', 0.15, ctx, m);
        // Chord pad (sine, lower octave) on every 4 beats
        if (step % 4 === 0) {
          playNote(freq / 2, nextTime, beatLen * 3.5, 'sine', 0.07, ctx, m);
        }
        // Subtle percussion pulse every 2 beats
        if (step % 2 === 0) {
          const buf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * 0.3;
          const src = ctx.createBufferSource();
          const g = ctx.createGain();
          src.buffer = buf; g.gain.value = 0.12;
          src.connect(g); g.connect(m);
          src.start(nextTime);
        }
        nextTime += beatLen;
        step++;
      }
      loopRef.current = window.setTimeout(schedule, 100);
    };
    schedule();
  }, [getCtx, playNote]);

  // ── BATTLE MUSIC — driving chiptune loop ──
  const startBattleMusic = useCallback(() => {
    const ctx = getCtx();
    const m = masterRef.current!;
    // Minor pentatonic: A C D E G
    const scale = [220, 261, 294, 329, 392, 440, 523, 587];
    const melody = [4, 7, 5, 4, 2, 4, 7, 5, 3, 2, 4, 5, 7, 5, 4, 2];
    const bass =   [0, 0, 2, 2, 3, 3, 0, 0, 2, 2, 4, 4, 0, 0, 2, 3];
    const beatLen = 0.14; // faster tempo for battle
    let step = 0;
    let nextTime = ctx.currentTime + 0.05;

    const schedule = () => {
      if (mutedRef.current || currentModeRef.current !== 'battle') return;
      const bufferAhead = 0.5;
      while (nextTime < ctx.currentTime + bufferAhead) {
        // Melody (sawtooth — aggressive)
        playNote(scale[melody[step % melody.length]], nextTime, beatLen * 0.65, 'sawtooth', 0.14, ctx, m);
        // Bass (square — every 2 beats)
        if (step % 2 === 0) {
          playNote(scale[bass[step % bass.length]] / 2, nextTime, beatLen * 1.8, 'square', 0.1, ctx, m);
        }
        // Kick drum (noise burst every 4 beats)
        if (step % 4 === 0) {
          const buf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
          const src = ctx.createBufferSource();
          const g = ctx.createGain(); g.gain.value = 0.5;
          src.buffer = buf; src.connect(g); g.connect(m);
          src.start(nextTime);
        }
        // Hi-hat (every beat)
        {
          const buf = ctx.createBuffer(1, ctx.sampleRate * 0.025, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
          const src = ctx.createBufferSource();
          const g = ctx.createGain(); g.gain.value = 0.12;
          src.buffer = buf; src.connect(g); g.connect(m);
          src.start(nextTime);
        }
        nextTime += beatLen;
        step++;
      }
      loopRef.current = window.setTimeout(schedule, 80);
    };
    schedule();
  }, [getCtx, playNote]);

  // ── Stop everything ──
  const stopAll = useCallback(() => {
    if (loopRef.current !== null) {
      clearTimeout(loopRef.current);
      loopRef.current = null;
    }
    currentModeRef.current = 'off';
  }, []);

  // ── Play mode ──
  const playMode = useCallback((mode: AudioMode) => {
    stopAll();
    if (mode === 'off' || mutedRef.current) return;
    currentModeRef.current = mode;
    if (mode === 'menu') startMenuMusic();
    else if (mode === 'battle') startBattleMusic();
  }, [stopAll, startMenuMusic, startBattleMusic]);

  // ── Toggle mute ──
  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    if (mutedRef.current) {
      stopAll();
    } else {
      // Resume current mode
      const mode = currentModeRef.current;
      currentModeRef.current = 'off';
      if (mode !== 'off') playMode(mode);
    }
  }, [stopAll, playMode]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      stopAll();
      ctxRef.current?.close();
    };
  }, [stopAll]);

  return { muted, toggleMute, playMode, stopAll, playSfx };
}
