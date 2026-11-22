// Night Vault Heist — synthesised sound.
// Every sound is a small WebAudio oscillator envelope; no audio files are
// shipped. The context is created on the first user gesture, and every
// call is guarded so the game never breaks when audio is unavailable.

export function createAudio() {
  const audio = {
    ctx: null,
    muted: false,
    ensure() {
      if (audio.ctx) return;
      try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return;
        audio.ctx = new Ctor();
      } catch (err) {
        audio.ctx = null;
      }
    },
    tone(freq, dur, type, gain, slideTo) {
      if (audio.muted || !audio.ctx) return;
      try {
        if (audio.ctx.state === 'suspended') void audio.ctx.resume();
        const osc = audio.ctx.createOscillator();
        const amp = audio.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, audio.ctx.currentTime);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, audio.ctx.currentTime + dur);
        amp.gain.setValueAtTime(gain || 0.08, audio.ctx.currentTime);
        amp.gain.exponentialRampToValueAtTime(0.0001, audio.ctx.currentTime + dur);
        osc.connect(amp);
        amp.connect(audio.ctx.destination);
        osc.start();
        osc.stop(audio.ctx.currentTime + dur);
      } catch (err) {
        // Sound is garnish; a failure here must never stop the game.
      }
    },
    pickup() {
      audio.tone(880, 0.12, 'sine', 0.09);
      setTimeout(() => audio.tone(1318, 0.14, 'sine', 0.07), 70);
    },
    alarmTick() {
      audio.tone(1175, 0.07, 'square', 0.03);
    },
    smoke() {
      audio.tone(220, 0.35, 'sine', 0.06, 90);
    },
    emp() {
      audio.tone(1400, 0.25, 'sawtooth', 0.05, 120);
    },
    unlock() {
      audio.tone(520, 0.08, 'triangle', 0.08);
      setTimeout(() => audio.tone(780, 0.1, 'triangle', 0.08), 80);
    },
    caught() {
      audio.tone(320, 0.5, 'sawtooth', 0.1, 60);
    },
    win() {
      audio.tone(523, 0.16, 'sine', 0.09);
      setTimeout(() => audio.tone(659, 0.16, 'sine', 0.09), 140);
      setTimeout(() => audio.tone(784, 0.3, 'sine', 0.09), 280);
    },
  };
  return audio;
}
