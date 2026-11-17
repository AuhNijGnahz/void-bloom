// Synthesised sound with WebAudio: every effect is an oscillator or a burst of
// filtered noise shaped by an envelope, so the game needs no audio files at all.
// The context is created lazily on the first user gesture (browser autoplay
// rules) and every call is a no-op until then, which keeps screenshot mode and
// muted tabs silent and safe.

export function createAudioEngine() {
  let context = null;
  let master = null;

  /** Create (or resume) the context. Call from a click or keypress handler. */
  function unlock() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    context = new AudioCtor();
    master = context.createGain();
    master.gain.value = 0.32;
    master.connect(context.destination);
  }

  /** One oscillator note with an exponential decay envelope. */
  function tone({ type = 'square', from = 440, to = null, duration = 0.12, volume = 0.5, delay = 0 }) {
    if (!context || context.state !== 'running') return;
    const start = context.currentTime + delay;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    if (to !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  /** A short noise burst, used for hits and explosions. */
  function noise({ duration = 0.15, volume = 0.4, frequency = 1200, delay = 0 }) {
    if (!context || context.state !== 'running') return;
    const start = context.currentTime + delay;
    const length = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = frequency;
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    source.connect(filter).connect(gain).connect(master);
    source.start(start);
  }

  return {
    unlock,
    shoot() { tone({ type: 'square', from: 880, to: 320, duration: 0.07, volume: 0.16 }); },
    hit() { noise({ duration: 0.06, volume: 0.18, frequency: 2400 }); },
    kill() { noise({ duration: 0.18, volume: 0.3, frequency: 900 }); tone({ type: 'triangle', from: 300, to: 60, duration: 0.18, volume: 0.25 }); },
    pickup() { tone({ type: 'sine', from: 980, to: 1560, duration: 0.07, volume: 0.14 }); },
    levelUp() {
      tone({ type: 'triangle', from: 523, duration: 0.14, volume: 0.3 });
      tone({ type: 'triangle', from: 659, duration: 0.14, volume: 0.3, delay: 0.09 });
      tone({ type: 'triangle', from: 784, duration: 0.22, volume: 0.32, delay: 0.18 });
    },
    hurt() { tone({ type: 'sawtooth', from: 220, to: 70, duration: 0.2, volume: 0.35 }); noise({ duration: 0.12, volume: 0.2, frequency: 700 }); },
    shieldPop() { tone({ type: 'sine', from: 1400, to: 500, duration: 0.12, volume: 0.25 }); },
    bossRoar() {
      tone({ type: 'sawtooth', from: 90, to: 45, duration: 0.7, volume: 0.5 });
      tone({ type: 'sawtooth', from: 135, to: 60, duration: 0.7, volume: 0.3, delay: 0.05 });
    },
    win() {
      const notes = [523, 659, 784, 1047, 784, 1047];
      notes.forEach((note, i) => tone({ type: 'triangle', from: note, duration: 0.24, volume: 0.3, delay: i * 0.13 }));
    },
    lose() {
      const notes = [392, 330, 262, 196];
      notes.forEach((note, i) => tone({ type: 'triangle', from: note, duration: 0.3, volume: 0.3, delay: i * 0.16 }));
    },
  };
}
