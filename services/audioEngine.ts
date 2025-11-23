// Simple Web Audio API Synthesizer to generate previews
// This replaces the "AI Voice" with actual code-generated sound

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let activeNodes: AudioNode[] = [];
let isPlaying = false;

const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.3; // Safety volume
        masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};

const stopAudio = () => {
    activeNodes.forEach(n => {
        try { (n as any).stop?.(); } catch(e) {}
        n.disconnect();
    });
    activeNodes = [];
    isPlaying = false;
};

// --- Synthesis Patches ---

const playDrone = (ctx: AudioContext, dest: AudioNode) => {
    // 3 Oscillators slightly detuned
    [220, 329.63, 196.00].forEach((freq, i) => { // Am7 chord
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = i === 2 ? 'sawtooth' : 'sine';
        osc.frequency.value = freq / 2; // Octave down
        
        // Slight Detune LFO
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.1 + (i * 0.05);
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 2;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 2); // Slow attack

        osc.connect(gain);
        gain.connect(dest);
        osc.start();

        activeNodes.push(osc, gain, lfo, lfoGain);
    });
};

const playTechno = (ctx: AudioContext, dest: AudioNode) => {
    const tempo = 135;
    const beatTime = 60 / tempo;

    // Rumble Loop
    const scheduleKick = (time: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
        
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

        // Rumble filter
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        
        osc.start(time);
        osc.stop(time + 0.5);
        activeNodes.push(osc, gain, filter);
    };

    // HiHat
    const scheduleHat = (time: number) => {
         // White noise buffer
         const bufferSize = ctx.sampleRate * 0.1;
         const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
         const data = buffer.getChannelData(0);
         for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

         const noise = ctx.createBufferSource();
         noise.buffer = buffer;
         const filter = ctx.createBiquadFilter();
         filter.type = 'highpass';
         filter.frequency.value = 8000;
         const gain = ctx.createGain();
         gain.gain.setValueAtTime(0.3, time);
         gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

         noise.connect(filter);
         filter.connect(gain);
         gain.connect(dest);
         noise.start(time);
         activeNodes.push(noise, filter, gain);
    };

    const startTime = ctx.currentTime + 0.1;
    for(let i=0; i<8; i++) {
        scheduleKick(startTime + i * beatTime);
        scheduleHat(startTime + i * beatTime + (beatTime/2)); // Offbeat
    }
};

const playGenerative = (ctx: AudioContext, dest: AudioNode) => {
    // Random pentatonic blips
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C Major Pentatonic
    
    const scheduleNote = (time: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const freq = scale[Math.floor(Math.random() * scale.length)];
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5); // Pluck

        // Delay effect (simple echo)
        const delay = ctx.createDelay();
        delay.delayTime.value = 0.3;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.4;
        
        osc.connect(gain);
        gain.connect(dest);
        gain.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(dest);

        osc.start(time);
        osc.stop(time + 2);
        activeNodes.push(osc, gain, delay, feedback);
    };

    const startTime = ctx.currentTime;
    // Irregular timing
    let t = startTime;
    for(let i=0; i<10; i++) {
        t += Math.random() * 0.5 + 0.2;
        scheduleNote(t);
    }
};

const playIndustrial = (ctx: AudioContext, dest: AudioNode) => {
    const startTime = ctx.currentTime;
    
    // Metallic Clang (FM Synthesis)
    const scheduleClang = (time: number) => {
        const car = ctx.createOscillator();
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();
        const masterAmp = ctx.createGain();
        const dist = ctx.createWaveShaper();

        // Distortion curve
        const curve = new Float32Array(44100);
        for (let i = 0; i < 44100; i++) {
            const x = (i * 2) / 44100 - 1;
            curve[i] = (Math.PI + 50) * x / (Math.PI + 50 * Math.abs(x));
        }
        dist.curve = curve;

        car.frequency.value = 200;
        mod.frequency.value = 200 * 2.43; // Non-integer ratio
        
        modGain.gain.setValueAtTime(1000, time);
        modGain.gain.exponentialRampToValueAtTime(10, time + 0.5);

        masterAmp.gain.setValueAtTime(0.5, time);
        masterAmp.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

        mod.connect(modGain);
        modGain.connect(car.frequency);
        car.connect(masterAmp);
        masterAmp.connect(dist);
        dist.connect(dest);

        car.start(time); mod.start(time);
        car.stop(time + 0.5); mod.stop(time + 0.5);
        activeNodes.push(car, mod, modGain, masterAmp, dist);
    };

    for(let i=0; i<4; i++) scheduleClang(startTime + i * 0.6);
};

// --- Main Player ---

export const previewPatchSound = (patchId: string): boolean => {
    if (isPlaying) {
        stopAudio();
        return false;
    }

    initAudio();
    if (!audioCtx || !masterGain) return false;

    isPlaying = true;

    // Simple router
    if (patchId.includes('techno') || patchId.includes('psytrance')) {
        playTechno(audioCtx, masterGain);
    } else if (patchId.includes('ambient') || patchId.includes('lofi')) {
        playDrone(audioCtx, masterGain);
    } else if (patchId.includes('industrial') || patchId.includes('glitch')) {
        playIndustrial(audioCtx, masterGain);
    } else {
        playGenerative(audioCtx, masterGain);
    }

    // Auto stop after 5s
    setTimeout(() => {
        if(isPlaying) stopAudio();
    }, 5000);

    return true;
};

export const isAudioPlaying = () => isPlaying;