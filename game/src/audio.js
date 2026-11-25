// Ember Lane Kitchen — every sound is synthesized with WebAudio: no audio files,
// no network, nothing but oscillators and filtered noise, built fresh at runtime.

/** A tiny pentatonic riff that loops quietly under the shift. */
const MELODY = [
  [523.25, 0.22], [587.33, 0.22], [659.25, 0.22], [783.99, 0.34],
  [659.25, 0.22], [587.33, 0.22], [523.25, 0.44], [0, 0.22],
  [698.46, 0.22], [783.99, 0.22], [880.0, 0.34], [783.99, 0.22],
  [659.25, 0.22], [587.33, 0.44], [0, 0.22],
];

export function createSoundBank() {
  let context = null;
  let master = null;
  let musicGain = null;
  let sizzleSource = null;
  let sizzleGain = null;
  let muted = false;
  let musicTimer = 0;
  let melodyStep = 0;

  function ensureContext() {
    if (context) return true;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = 0.5;
    master.connect(context.destination);
    musicGain = context.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
    return true;
  }

  /** Resume the context from a user gesture; browsers block sound before one. */
  function unlock() {
    if (!ensureContext()) return;
    if (context.state === 'suspended') void context.resume();
  }

  function tone(frequency, duration, type, volume, when = 0, slideTo = 0) {
    if (!context || muted) return;
    const start = context.currentTime + when;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo > 0) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  function noiseBurst(duration, volume, filterFrequency, when = 0) {
    if (!context || muted) return;
    const start = context.currentTime + when;
    const length = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFrequency;
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(start);
  }

  function playMelodyStep() {
    if (!context || muted || musicTimer === 0) return;
    const [frequency, length] = MELODY[melodyStep % MELODY.length];
    melodyStep += 1;
    if (frequency > 0) tone(frequency, length * 0.9, 'triangle', 0.5);
  }

  return {
    unlock,
    isMuted() { return muted; },

    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      if (muted) this.stopSizzle();
      return muted;
    },

    /** The music loop ticks from the main loop; it schedules one note per call. */
    tickMusic(deltaSeconds) {
      if (!context || muted || musicTimer === 0) return;
      musicTimer -= deltaSeconds;
      if (musicTimer > 0) return;
      playMelodyStep();
      const [, length] = MELODY[(melodyStep - 1 + MELODY.length) % MELODY.length];
      musicTimer = length;
    },

    startMusic() {
      if (!ensureContext()) return;
      musicTimer = 0.01;
      melodyStep = 0;
    },

    stopMusic() { musicTimer = 0; },

    playGrab() { tone(660, 0.07, 'sine', 0.35); tone(880, 0.08, 'sine', 0.25, 0.05); },
    playChop() { noiseBurst(0.09, 0.5, 1800); tone(180, 0.08, 'square', 0.22, 0, 90); },
    playChopped() { tone(520, 0.09, 'triangle', 0.4); tone(780, 0.12, 'triangle', 0.35, 0.07); },
    playCookStart() { noiseBurst(0.25, 0.25, 3200); },
    playCookDone() { tone(880, 0.1, 'sine', 0.4); tone(1174, 0.16, 'sine', 0.35, 0.09); },
    playBurnt() { tone(220, 0.25, 'sawtooth', 0.3, 0, 110); },
    playPlate() { tone(440, 0.08, 'triangle', 0.35); tone(660, 0.1, 'triangle', 0.3, 0.06); },
    playServe() { tone(784, 0.12, 'sine', 0.45); tone(1047, 0.14, 'sine', 0.4, 0.1); tone(1319, 0.22, 'sine', 0.4, 0.2); },
    playError() { tone(160, 0.16, 'square', 0.28, 0, 110); },
    playExpire() { tone(392, 0.18, 'triangle', 0.4, 0, 262); tone(262, 0.3, 'triangle', 0.4, 0.16); },
    playLevelUp() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'triangle', 0.4, i * 0.09)); },
    playDayEnd() { [784, 659, 587, 523].forEach((f, i) => tone(f, 0.22, 'triangle', 0.4, i * 0.16)); },
    playClick() { tone(500, 0.05, 'sine', 0.25); },

    /** A soft looping hiss while anything cooks on the stove. */
    startSizzle() {
      if (!context || muted || sizzleSource) return;
      const length = context.sampleRate;
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      sizzleSource = context.createBufferSource();
      sizzleSource.buffer = buffer;
      sizzleSource.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 4200;
      sizzleGain = context.createGain();
      sizzleGain.gain.value = 0.05;
      sizzleSource.connect(filter);
      filter.connect(sizzleGain);
      sizzleGain.connect(master);
      sizzleSource.start();
    },

    stopSizzle() {
      if (!sizzleSource) return;
      try { sizzleSource.stop(); } catch (error) { /* already stopped */ }
      sizzleSource = null;
      sizzleGain = null;
    },
  };
}
