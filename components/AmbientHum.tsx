'use client';
import { useEffect, useRef, useState } from 'react';

type Nodes = {
  ctx: AudioContext;
  master: GainNode;
  oscs: OscillatorNode[];
  lfo: OscillatorNode;
  padLfo: OscillatorNode;
  pluckFilter: BiquadFilterNode;
  heartFilter: BiquadFilterNode;
  padFilter: BiquadFilterNode;
  padBus: GainNode;
  pluckTimer: number;
  heartTimer: number;
  chordTimer: number;
  stopped: boolean;
};

// A minor pentatonic, lowered ~one octave for a deeper moog-ish range
const NOTES = [
  98, 110, 130.81, 146.83, 164.81, 196, 220, 261.63, 293.66, 329.63, 392,
];

// NOTES indices map: 0=G2 1=A2 2=C3 3=D3 4=E3 5=G3 6=A3 7=C4 8=D4 9=E4 10=G4
// Gentle A-minor progression — Am → Em7 → Dsus → Cadd9, all within the pentatonic
const CHORDS: number[][] = [
  [1, 4, 6, 9],   // Am7:     A2 · E3 · A3 · E4
  [4, 5, 8, 9],   // Em7 (no B): E3 · G3 · D4 · E4
  [3, 5, 6, 10],  // Dsus4:   D3 · G3 · A3 · G4
  [2, 5, 7, 9],   // Cadd9 (sparse): C3 · G3 · C4 · E4
];

// 4 notes per chord, each gap in ms. Sum ~= CHORD_MS so melody re-syncs with chord.
const MELODIES: [number, number][][] = [
  [[9, 2300], [7, 2100], [6, 2800], [4, 2100]],   // Am7
  [[9, 2300], [8, 2100], [5, 2800], [4, 2100]],   // Em7
  [[10, 2300], [8, 2100], [6, 2800], [5, 2100]],  // Dsus4
  [[9, 2300], [7, 2100], [5, 2800], [2, 2100]],   // Cadd9
];

const CHORD_MS = 9300;

export function AmbientHum() {
  const [on, setOn] = useState(false);
  const nodesRef = useRef<Nodes | null>(null);

  useEffect(() => {
    if (!on) {
      const n = nodesRef.current;
      if (!n) return;
      n.stopped = true;
      clearTimeout(n.pluckTimer);
      clearInterval(n.heartTimer);
      clearInterval(n.chordTimer);
      const now = n.ctx.currentTime;
      n.master.gain.cancelScheduledValues(now);
      n.master.gain.setValueAtTime(n.master.gain.value, now);
      n.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      const stopAt = setTimeout(() => {
        try {
          n.oscs.forEach((o) => o.stop());
          n.lfo.stop();
          n.padLfo.stop();
          n.ctx.close();
        } catch {}
      }, 700);
      nodesRef.current = null;
      return () => clearTimeout(stopAt);
    }

    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0.0001;

    // --- master chain: compressor → highshelf EQ → destination ---
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 14;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.012;
    compressor.release.value = 0.28;

    const masterEQ = ctx.createBiquadFilter();
    masterEQ.type = 'highshelf';
    masterEQ.frequency.value = 4500;
    masterEQ.gain.value = -5;

    const masterLow = ctx.createBiquadFilter();
    masterLow.type = 'lowshelf';
    masterLow.frequency.value = 120;
    masterLow.gain.value = 2;

    master.connect(compressor);
    compressor.connect(masterEQ);
    masterEQ.connect(masterLow);
    masterLow.connect(ctx.destination);

    // --- deep drone bed (very low, rumbly — the city at night) ---
    const droneBus = ctx.createGain();
    droneBus.gain.value = 0.22;
    droneBus.connect(master);
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 220;
    droneFilter.Q.value = 0.7;
    droneFilter.connect(droneBus);

    const mkOsc = (freq: number, type: OscillatorType, gain: number, detune = 0) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = gain;
      o.connect(g);
      g.connect(droneFilter);
      o.start();
      return o;
    };
    const oscs = [
      mkOsc(55, 'sine', 1.0),
      mkOsc(55, 'sine', 0.55, 8),
      mkOsc(110, 'sine', 0.12),
    ];

    // breathing LFO on master
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);
    lfo.start();

    // --- chord pad bus — slow-moving, wet, resonant sweep ---
    const padBus = ctx.createGain();
    padBus.gain.value = 0.22;
    padBus.connect(master);
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 600;
    padFilter.Q.value = 3;
    padFilter.connect(padBus);

    // pad filter LFO — slow neon drift
    const padLfo = ctx.createOscillator();
    padLfo.type = 'sine';
    padLfo.frequency.value = 0.06;
    const padLfoGain = ctx.createGain();
    padLfoGain.gain.value = 260;
    padLfo.connect(padLfoGain);
    padLfoGain.connect(padFilter.frequency);
    padLfo.start();

    // --- pluck bus + dual-tap delay wash (widens the space) ---
    const pluckBus = ctx.createGain();
    pluckBus.gain.value = 0.28;
    pluckBus.connect(master);
    const pluckFilter = ctx.createBiquadFilter();
    pluckFilter.type = 'lowpass';
    pluckFilter.frequency.value = 2200;
    pluckFilter.Q.value = 0.6;
    pluckFilter.connect(pluckBus);

    const delay = ctx.createDelay(3);
    delay.delayTime.value = 0.46;
    const delayGain = ctx.createGain();
    delayGain.gain.value = 0.55;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.6;
    pluckBus.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(master);
    delay.connect(feedback);
    feedback.connect(delay);

    // second delay tap at a different time for pseudo-stereo width
    const delay2 = ctx.createDelay(3);
    delay2.delayTime.value = 0.72;
    const delay2Gain = ctx.createGain();
    delay2Gain.gain.value = 0.3;
    pluckBus.connect(delay2);
    delay2.connect(delay2Gain);
    delay2Gain.connect(master);

    // --- heartbeat bus ---
    const heartBus = ctx.createGain();
    heartBus.gain.value = 0.42;
    heartBus.connect(master);
    const heartFilter = ctx.createBiquadFilter();
    heartFilter.type = 'lowpass';
    heartFilter.frequency.value = 160;
    heartFilter.Q.value = 0.9;
    heartFilter.connect(heartBus);

    // dedicated delay on heartbeat — a couple soft echoes to feel like a memory
    const heartDelay = ctx.createDelay(1.5);
    heartDelay.delayTime.value = 0.38;
    const heartDelayGain = ctx.createGain();
    heartDelayGain.gain.value = 0.35;
    const heartFeedback = ctx.createGain();
    heartFeedback.gain.value = 0.35;
    heartBus.connect(heartDelay);
    heartDelay.connect(heartDelayGain);
    heartDelayGain.connect(master);
    heartDelay.connect(heartFeedback);
    heartFeedback.connect(heartDelay);

    const scheduleThump = (when: number, peak: number) => {
      const n = nodesRef.current;
      if (!n) return;
      const o = n.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(90, when);
      o.frequency.exponentialRampToValueAtTime(45, when + 0.18);
      const g = n.ctx.createGain();
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(n.heartFilter);
      g.gain.exponentialRampToValueAtTime(peak, when + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
      o.start(when);
      o.stop(when + 0.3);
    };

    master.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 1.5);

    const heartTimer = window.setInterval(() => {
      const n = nodesRef.current;
      if (!n || n.stopped) return;
      const t0 = n.ctx.currentTime + 0.02;
      scheduleThump(t0, 0.38);
      scheduleThump(t0 + 0.24, 0.26);
    }, 3200);

    let chordIdx = 0;
    let melIdx = 0;

    // --- chord voice: slow-attack pad triad fading through padFilter ---
    const spawnChord = (which: number, when: number) => {
      const n = nodesRef.current;
      if (!n) return;
      const chord = CHORDS[which];
      // lower two notes = pad body, higher notes = shimmer
      chord.forEach((ni, i) => {
        const freq = NOTES[ni];
        const o1 = n.ctx.createOscillator();
        o1.type = i < 2 ? 'sawtooth' : 'triangle';
        o1.frequency.value = freq;
        o1.detune.value = -6;
        const o2 = n.ctx.createOscillator();
        o2.type = i < 2 ? 'sawtooth' : 'triangle';
        o2.frequency.value = freq;
        o2.detune.value = 6;
        const g = n.ctx.createGain();
        g.gain.value = 0.0001;
        o1.connect(g);
        o2.connect(g);
        g.connect(n.padFilter);
        const peak = i < 2 ? 0.06 : 0.035;
        g.gain.exponentialRampToValueAtTime(peak, when + 1.6);
        g.gain.setValueAtTime(peak, when + CHORD_MS / 1000 - 1.2);
        g.gain.exponentialRampToValueAtTime(0.0001, when + CHORD_MS / 1000 + 0.6);
        o1.start(when);
        o2.start(when);
        o1.stop(when + CHORD_MS / 1000 + 0.8);
        o2.stop(when + CHORD_MS / 1000 + 0.8);
      });
    };

    // kick off first chord + progression
    spawnChord(chordIdx, ctx.currentTime + 0.2);
    const chordTimer = window.setInterval(() => {
      const n = nodesRef.current;
      if (!n || n.stopped) return;
      chordIdx = (chordIdx + 1) % CHORDS.length;
      melIdx = 0;
      spawnChord(chordIdx, n.ctx.currentTime + 0.02);
    }, CHORD_MS);

    const playFibPluck = () => {
      const n = nodesRef.current;
      if (!n || n.stopped) return;
      const melody = MELODIES[chordIdx];
      const [noteIdx, gap] = melody[melIdx % melody.length];
      const t0 = n.ctx.currentTime;
      const freq = NOTES[noteIdx];

      // saw + detuned saw for moog-ish thickness
      const o1 = n.ctx.createOscillator();
      o1.type = 'sawtooth';
      o1.frequency.value = freq;
      o1.detune.value = -7;
      const o2 = n.ctx.createOscillator();
      o2.type = 'sawtooth';
      o2.frequency.value = freq;
      o2.detune.value = 7;
      // sub sine an octave down for weight
      const sub = n.ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.value = freq * 0.5;

      // per-note resonant lowpass with gentler envelope sweep
      const filt = n.ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.Q.value = 5.5;
      filt.frequency.setValueAtTime(200, t0);
      filt.frequency.exponentialRampToValueAtTime(1100, t0 + 0.08);
      filt.frequency.exponentialRampToValueAtTime(240, t0 + 2.2);

      const g = n.ctx.createGain();
      g.gain.value = 0.0001;
      o1.connect(filt);
      o2.connect(filt);
      sub.connect(g);
      filt.connect(g);
      g.connect(n.pluckFilter);

      const vel = 0.07 + Math.random() * 0.05;
      const decay = 3.6 + Math.random() * 2.2;
      g.gain.exponentialRampToValueAtTime(vel, t0 + 0.14);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
      o1.start(t0);
      o2.start(t0);
      sub.start(t0);
      o1.stop(t0 + decay + 0.1);
      o2.stop(t0 + decay + 0.1);
      sub.stop(t0 + decay + 0.1);

      melIdx = melIdx + 1;
      const next = window.setTimeout(playFibPluck, gap);
      if (nodesRef.current) nodesRef.current.pluckTimer = next;
    };

    const pluckTimer = window.setTimeout(playFibPluck, 1400);

    nodesRef.current = {
      ctx,
      master,
      oscs,
      lfo,
      padLfo,
      pluckFilter,
      heartFilter,
      padFilter,
      padBus,
      pluckTimer,
      heartTimer,
      chordTimer,
      stopped: false,
    };
  }, [on]);

  useEffect(
    () => () => {
      const n = nodesRef.current;
      if (!n) return;
      try {
        clearTimeout(n.pluckTimer);
        clearInterval(n.heartTimer);
        clearInterval(n.chordTimer);
        n.oscs.forEach((o) => o.stop());
        n.lfo.stop();
        n.padLfo.stop();
        n.ctx.close();
      } catch {}
    },
    []
  );

  return (
    <button
      type="button"
      className={`nav-theme${on ? ' on' : ''}`}
      aria-label={on ? 'Stop ambient rain music' : 'Play ambient rain music'}
      onClick={() => setOn((v) => !v)}
    >
      {on ? '● Rain' : '○ Rain'}
    </button>
  );
}
