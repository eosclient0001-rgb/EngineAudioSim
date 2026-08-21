/**
 * Realistic Engine Audio Simulator using Web Audio API
 * Implements AudioWorklet for sample-accurate, glitch-free synthesis.  AA
 */

export type EngineConfig = {
  name: string;
  cylinders: number;
  idleRPM: number;
  maxRPM: number;
  redlineRPM: number;
  firingOrder: number[];
  basePitch: number; // Base frequency of a single firing pulse
  harmonics: number[]; // Harmonic weights
  hasTurbo: boolean;
  hasSupercharger: boolean;
  isFlatPlane: boolean; // Determines the "loping" idle character
  resonanceVolume: number; // Controls the high-RPM exhaust scream
  color: string;
  camModOrder?: number;
  camModDepth?: number;
  isElectric?: boolean; // Disables combustion features, enables EV synthesis
};

export const CAR_CONFIGS: Record<string, EngineConfig> = {
  laferrari: {
    name: "Ferrari LaFerrari",
    cylinders: 12,
    idleRPM: 1000,
    maxRPM: 9250,
    redlineRPM: 9000,
    firingOrder: [1, 12, 5, 8, 3, 10, 6, 7, 2, 11, 4, 9],
    basePitch: 58, // Lowered for deep hollow bark
    harmonics: [0.8, 1.0, 0.5, 0.9, 0.4, 0.6, 0.3, 0.2], // Dominant 2nd and 4th
    hasTurbo: false,
    hasSupercharger: false,
    isFlatPlane: false, // 65-degree V12 has slight uneven pulse
    resonanceVolume: 2.0, // Push this high to trigger the new rasp logic
    color: "#ef4444", // Ferrari Red
    camModOrder: 6,
    camModDepth: 0.1,
  },
  viper: {
    name: "Dodge Viper ACR",
    cylinders: 10,
    idleRPM: 750,
    maxRPM: 6200,
    redlineRPM: 6000,
    firingOrder: [1, 6, 5, 10, 2, 7, 3, 8, 4, 9],
    basePitch: 38, // LOW — 8.4 liters = deep bass thump
    harmonics: [1.0, 0.9, 0.4, 0.7, 0.3, 0.5], // Strong 1st+2nd (bass), 4th (V10 howl)
    hasTurbo: false,
    hasSupercharger: false,
    isFlatPlane: false, // Cross-plane = the signature "loping" idle
    resonanceVolume: 0.5, // Moderate — it's a howl, not a scream
    color: "#dc2626", // Viper Red
    camModOrder: 5,
    camModDepth: 0.2,
  },
  demon: {
    name: "Dodge Challenger SRT Demon",
    cylinders: 8,
    idleRPM: 800,
    maxRPM: 6500,
    redlineRPM: 6000,
    firingOrder: [1, 8, 4, 3, 6, 5, 7, 2],
    basePitch: 35,
    harmonics: [1.0, 0.8, 0.6, 0.5, 0.3, 0.2],
    hasTurbo: false,
    hasSupercharger: true,
    isFlatPlane: false, // Cross-plane V8 (burble)
    resonanceVolume: 0.3, // Mostly blower and V8 rumble
    color: "#ef4444", // Red
    camModOrder: 4,
    camModDepth: 0.2,
  },
  gtr: {
    name: "Nissan GT-R Nismo",
    cylinders: 6,
    idleRPM: 900,
    maxRPM: 7500,
    redlineRPM: 7000,
    firingOrder: [1, 4, 2, 5, 3, 6],
    basePitch: 48,
    harmonics: [1.0, 0.6, 0.9, 0.7, 0.4, 0.3],
    hasTurbo: true,
    hasSupercharger: false,
    isFlatPlane: false,
    resonanceVolume: 0.7, // V6 howl
    color: "#3b82f6", // Blue
    camModOrder: 3,
    camModDepth: 0.15,
  },
  spyder: {
    name: "Porsche 918 Spyder",
    cylinders: 8,
    idleRPM: 1000,
    maxRPM: 9150,
    redlineRPM: 8700,
    firingOrder: [1, 8, 3, 6, 4, 5, 2, 7], // Corrected Porsche flat-plane order
    basePitch: 65,
    harmonics: [1.0, 1.4, 0.6, 0.8],
    hasTurbo: false,
    hasSupercharger: false,
    isFlatPlane: true, // Flat-plane V8 (scream)
    resonanceVolume: 1.5, // F1-like scream
    color: "#10b981", // Emerald
    camModOrder: 4,
    camModDepth: 0.0,
  },
  agera: {
    name: "Koenigsegg Agera RS",
    cylinders: 8,
    idleRPM: 800,
    maxRPM: 8250,
    redlineRPM: 7800,
    firingOrder: [1, 5, 4, 8, 2, 6, 3, 7],
    basePitch: 58,
    harmonics: [1.2, 0.5, 1.1, 0.4, 0.9, 0.3, 0.7],
    hasTurbo: true,
    hasSupercharger: false,
    isFlatPlane: true, // Koenigsegg uses flat-plane V8s
    resonanceVolume: 1.3, // Flat-plane rasp
    color: "#f59e0b", // Amber
    camModOrder: 4,
    camModDepth: 0.0,
  },
  taycan_modular: {
    name: "Porsche Taycan (Modular)",
    cylinders: 2,
    idleRPM: 0,
    maxRPM: 16000,
    redlineRPM: 15000,
    firingOrder: [1, 2],
    basePitch: 35,
    harmonics: [0.5, 0.2],
    hasTurbo: false,
    hasSupercharger: false,
    isFlatPlane: true,
    resonanceVolume: 0.0,
    color: "#f43f5e",
    camModOrder: 2,
    camModDepth: 0.0,
    isElectric: true,
  },
  mustang_exorcist: {
    name: "Mustang 'Exorcist' Custom",
    cylinders: 8,
    idleRPM: 850,
    maxRPM: 8000,
    redlineRPM: 7500,
    firingOrder: [1, 5, 4, 8, 6, 3, 7, 2],
    basePitch: 33, // Very deep idle
    harmonics: [1.0, 0.8, 0.6, 0.4, 0.2, 0.1],
    hasTurbo: false,
    hasSupercharger: true, // Huge blower
    isFlatPlane: false,
    resonanceVolume: 1.5,
    color: "#000000",
    camModOrder: 4,
    camModDepth: 0.35,
  },
  storm_modular: {
    name: "Jackson Storm (Modular)",
    cylinders: 2,
    idleRPM: 1500,
    maxRPM: 15000,
    redlineRPM: 14000,
    firingOrder: [1, 2],
    basePitch: 41, 
    harmonics: [0.4, 0.2, 0.1, 0.05],
    hasTurbo: false,
    hasSupercharger: false,
    isFlatPlane: true,
    resonanceVolume: 0.0,
    color: "#2563eb", 
    camModOrder: 2,
    camModDepth: 0.0,
    isElectric: true,
  },
  jackson_storm: {
    name: "Jackson Storm (Next-Gen EV)",
    cylinders: 2, // Sub-bass generator
    idleRPM: 1500, // EVs idle high
    maxRPM: 15000,
    redlineRPM: 14000,
    firingOrder: [1, 2],
    basePitch: 40, // Deep electromagnetic throb
    harmonics: [0.4, 0.2, 0.1, 0.05], // Slightly more body
    hasTurbo: false,
    hasSupercharger: false,
    isFlatPlane: true,
    resonanceVolume: 0.0,
    color: "#1e293b", // Storm dark blue-gray
    camModOrder: 2,
    camModDepth: 0.0,
    isElectric: true,
  },
  taycan: {
    name: "Porsche Taycan Turbo",
    cylinders: 2, // Sub-bass generator
    idleRPM: 1000, // Calmer idle
    maxRPM: 16000, // 2-speed rear axle
    redlineRPM: 15000,
    firingOrder: [1, 2],
    basePitch: 35, // Refined low hum
    harmonics: [0.3, 0.15, 0.08, 0.04],
    hasTurbo: false,
    hasSupercharger: false,
    isFlatPlane: true,
    resonanceVolume: 0.0,
    color: "#6366f1", // Electric purple/indigo
    camModOrder: 2,
    camModDepth: 0.0,
    isElectric: true,
  },
};

const engineWorkletCode = `
class EngineProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.cylindersState = Array(16).fill(0).map(() => ({ active: false, time: 0 }));
    this.currentStep = 0;
    this.time = 0;
    this.nextFireTime = 0;
    this.camPhase = 0;

    this.rpm = 800;
    this.load = 0;
    this.cylinders = 8;
    this.basePitch = 50;
    this.harmonics = [1, 0.8, 0.5, 0.3];
    this.isFlatPlane = false;
    this.firingOrder = [1, 2, 3, 4, 5, 6, 7, 8];
    this.nextFireTime = 0;
    this.currentStep = 0;
    this.valveTickingEnabled = true;
    this.intakeResonanceEnabled = true;
    this.advancedRaspEnabled = true;
    this.gtrV6CamModEnabled = true;
    this.resonanceVolume = 0.5;
    this.camModOrder = 4;
    this.camModDepth = 0.2;
    this.isElectric = false;
    this.evLegacyBlend = 0.0;
    this.stormModRumble = true;
    this.taycanModRumble = true;

    // --- NEW: Asymmetric Combustion Pulse Wavetable ---
    this.pulseTable = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      let phase = i / 512;
      let val = 0;
      if (phase < 0.05) {
        val = phase / 0.05; // Rapid spike
      } else if (phase < 0.3) {
        let p = (phase - 0.05) / 0.25;
        val = 1.0 - 1.2 * p; // Slower blowdown to -0.2
      } else if (phase < 0.6) {
        let p = (phase - 0.3) / 0.3;
        val = -0.2 * (1.0 - p); // Rarefaction recovery to 0
      } else {
        val = 0;
      }
      this.pulseTable[i] = val;
    }

    this.port.onmessage = (e) => {
      if (e.data.type === 'update') {
        this.rpm = e.data.rpm;
        this.load = e.data.load;
      } else if (e.data.type === 'toggleValveTicking') {
        this.valveTickingEnabled = e.data.enabled;
      } else if (e.data.type === 'toggleIntakeResonance') {
        this.intakeResonanceEnabled = e.data.enabled;
      } else if (e.data.type === 'toggleAdvancedRasp') {
        this.advancedRaspEnabled = e.data.enabled;
      } else if (e.data.type === 'toggleGtrV6CamMod') {
        this.gtrV6CamModEnabled = e.data.enabled;
      } else if (e.data.type === 'setEVLegacyBlend') {
        this.evLegacyBlend = e.data.blend;
      } else if (e.data.type === 'setStormModRumble') {
        this.stormModRumble = e.data.enabled;
      } else if (e.data.type === 'setTaycanModRumble') {
        this.taycanModRumble = e.data.enabled;
      } else if (e.data.type === 'config') {
        this.cylinders = e.data.config.cylinders;
        this.basePitch = e.data.config.basePitch;
        this.harmonics = e.data.config.harmonics;
        this.isFlatPlane = e.data.config.isFlatPlane;
        this.firingOrder = e.data.config.firingOrder;
        this.resonanceVolume = e.data.config.resonanceVolume || 0.5;
        this.camModOrder = e.data.config.camModOrder || 4;
        this.camModDepth = e.data.config.camModDepth || 0.2;
        this.isElectric = e.data.config.isElectric || false;
        this.time = 0;
        this.nextFireTime = 0;
        this.currentStep = 0;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const leftChannel = output[0];
    const rightChannel = output.length > 1 ? output[1] : output[0];
    const sampleRate = globalThis.sampleRate || 44100;
    const dt = 1.0 / sampleRate;

    const firingsPerSec = (this.rpm / 60) * (this.cylinders / 2);
    const fireInterval = 1.0 / firingsPerSec;

    // Camshaft runs at half crank speed
    const camFreq = (this.rpm / 60) / 2;
    const camPhaseInc = camFreq * dt;

    // --- OPTIMIZATION: Precalculate block-level variables ---
    const rpmFactor = this.rpm / 8000;
    
    const lerp = (a, b, t) => a + (b - a) * t;
    
    let actualBasePitch = this.basePitch;
    if (this.isElectric) {
      const legacyPitch = this.basePitch === 40 ? 120 : (this.basePitch === 35 ? 90 : this.basePitch);
      actualBasePitch = lerp(this.basePitch, legacyPitch, this.evLegacyBlend);
    }
    const thumpFreq = actualBasePitch + (rpmFactor * 15);

    // Precalculate dynamic harmonics for this block
    const numHarmonics = 24;
    const harmonicAmps = new Float32Array(numHarmonics);
    const peakHarmonic = 1 + rpmFactor * (8 + this.resonanceVolume * 4);
    
    for (let h = 0; h < numHarmonics; h++) {
      let harmonicNum = h + 1;
      let baseAmp = (h < this.harmonics.length) ? this.harmonics[h] : (0.5 / Math.pow(harmonicNum, 1.2));
      let dist = Math.abs(harmonicNum - peakHarmonic);
      let rpmBoost = Math.max(0, 1.0 - dist / 4.0);
      let loadBoost = this.load * (harmonicNum / numHarmonics) * 2.0;
      harmonicAmps[h] = baseAmp * (1.0 + rpmBoost * 1.5 + loadBoost);
    }

    // Pre-render body wavetable for this block to save CPU
    const bodyTable = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      let phase = i / 512;
      let val = 0;
      for (let h = 0; h < numHarmonics; h++) {
        val += Math.sin(2 * Math.PI * (h + 2) * phase) * harmonicAmps[h];
      }
      bodyTable[i] = val * 0.15; // Normalize
    }

    for (let i = 0; i < leftChannel.length; i++) {
      this.time += dt;
      this.camPhase += camPhaseInc;
      if (this.camPhase > 1) this.camPhase -= 1;

      if (this.time >= this.nextFireTime) {
        // Use the actual firing order from the car config!
        const cylNum = this.firingOrder[this.currentStep];
        const cylIndex = cylNum - 1; // 0-indexed
        this.cylindersState[cylIndex] = { active: true, time: 0 };
        
        this.currentStep = (this.currentStep + 1) % this.cylinders;

        // Add slight mechanical jitter for realism
        const jitter = (Math.random() * 0.05) * fireInterval;
        this.nextFireTime += fireInterval + jitter;
      }

      let leftSample = 0;
      let rightSample = 0;
      
      let camMod = 1.0;
      if (!this.isFlatPlane) {
        if (this.gtrV6CamModEnabled) {
          camMod = (1.0 - this.camModDepth) + this.camModDepth * Math.sin(this.camModOrder * 2 * Math.PI * this.camPhase);
        } else {
          camMod = 0.8 + 0.2 * Math.sin(2 * Math.PI * this.camPhase);
        }
      }

      for (let c = 0; c < this.cylinders; c++) {
        let state = this.cylindersState[c];
        if (state.active) {
          state.time += dt;
          const t = state.time;

          // Decay gets faster at high RPM to prevent mush/overlapping
          const decayRate = 15 + (this.rpm / 1000) * 3;
          const envelope = Math.exp(-t * decayRate);

          if (envelope < 0.001) {
            state.active = false;
            continue;
          }

          // --- NEW: Asymmetric Pulse & Dynamic Harmonics (Wavetable Optimized) ---
          let phase = (thumpFreq * t) % 1.0;
          let index = Math.floor(phase * 512);
          if (index >= 512) index = 511; // Safety bounds
          if (index < 0) index = 0;

          const thump = this.pulseTable[index] * envelope;
          const body = bodyTable[index] * envelope;

          // High frequency exhaust crackle (4-8kHz)
          let noise = 0;
          let ring = 0;
          
          if (!this.isElectric) {
            const noiseEnv = Math.exp(-t * (40 + this.load * 60));
            noise = (Math.random() * 2 - 1) * noiseEnv * (0.1 + this.load * 0.4);
            
            // Metallic ringing ("spoon against glass")
            if (this.valveTickingEnabled) {
              const ringFreq = 5000 + (c % 3) * 1000; // 5k, 6k, 7k ringing
              const ringRpmFade = Math.max(0, 1.0 - (this.rpm / 4000)); // Fades out by 4000 RPM
              ring = Math.sin(2 * Math.PI * ringFreq * t) * noiseEnv * (0.1 + this.load * 0.2) * ringRpmFade;
            }
          }

          // --- NEW: F1/V12 Tearing Rasp ---
          let rasp = 0;
          if (this.resonanceVolume > 1.0) {
            if (this.advancedRaspEnabled) {
              // Complex harmonic beating between banks (AM Modulation)
              const carrier = Math.sin(2 * Math.PI * thumpFreq * 3 * t);
              const modulator = Math.sin(2 * Math.PI * thumpFreq * 0.5 * t); // Half-order beating
              const raspAmount = Math.max(0, rpmFactor - 0.2) * this.load * (this.resonanceVolume - 1.0);
              rasp = carrier * modulator * envelope * raspAmount * 1.5;
            } else {
              // Old simple rasp
              const raspPhase1 = (thumpFreq * 3 * t) % 1.0;
              const raspPhase2 = (thumpFreq * 6 * t) % 1.0;
              const saw1 = raspPhase1 * 2.0 - 1.0;
              const saw2 = raspPhase2 * 2.0 - 1.0;
              const raspAmount = Math.max(0, rpmFactor - 0.2) * this.load * (this.resonanceVolume - 1.0);
              rasp = (saw1 * 0.5 + saw2) * envelope * raspAmount * 0.5;
            }
          }

          // --- NEW: Intake Resonance (Airbox Howl) ---
          let intake = 0;
          if (!this.isElectric && this.intakeResonanceEnabled && this.cylinders >= 10 && this.load > 0.2) {
            // Intake howl kicks in at higher RPMs
            const intakeRpmFactor = Math.max(0, (this.rpm - 4000) / 5000);
            if (intakeRpmFactor > 0) {
              // Hollow sound: fundamental + 2nd harmonic + noise
              const intakeTone = Math.sin(2 * Math.PI * thumpFreq * t) * 0.6 + Math.sin(2 * Math.PI * thumpFreq * 2 * t) * 0.4;
              const intakeNoise = (Math.random() * 2 - 1) * 0.2;
              intake = (intakeTone + intakeNoise) * envelope * intakeRpmFactor * this.load * 0.8;
            }
          }

          let evThumpMult = 0.05;
          let evBodyMult = 0.03;
          if (this.isElectric) {
            const isTaycan = this.basePitch === 35 && !this.config.name.includes("Modular");
            const isTaycanMod = this.config.name.includes("Taycan (Modular)");
            const isStormMod = this.basePitch === 41;
            const legacyThump = (isTaycan || isTaycanMod) ? 0.0 : 0.15;
            const legacyBody = (isTaycan || isTaycanMod) ? 0.0 : 0.1;
            evThumpMult = lerp(0.05, legacyThump, this.evLegacyBlend);
            evBodyMult = lerp(0.03, legacyBody, this.evLegacyBlend);

            if (isStormMod && !this.stormModRumble) {
              evThumpMult = 0;
              evBodyMult = 0;
            }
            if (isTaycanMod && !this.taycanModRumble) {
              evThumpMult = 0;
              evBodyMult = 0;
            }
          }

          const cylSample = (thump * (this.isElectric ? evThumpMult : 0.8) + body * (this.isElectric ? evBodyMult : 0.6) + noise + ring + rasp + intake) * camMod;
          
          // True Bank Separation: Odd cylinders (1,3,5,7) = Left Bank, Even (2,4,6,8) = Right Bank
          const isLeftBank = (c % 2) === 0;
          const panL = isLeftBank ? 0.85 : 0.15;
          const panR = isLeftBank ? 0.15 : 0.85;
          
          leftSample += cylSample * panL;
          rightSample += cylSample * panR;
        }
      }

      // Master soft clip and load-based gain
      leftChannel[i] = Math.tanh(leftSample * (1.0 + this.load * 0.8));
      if (output.length > 1) {
        rightChannel[i] = Math.tanh(rightSample * (1.0 + this.load * 0.8));
      }
    }
    return true;
  }
}
registerProcessor('engine-processor', EngineProcessor);
`;

export class EngineSimulator {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private workletUrl: string | null = null;
  
  private rpm: number = 0;
  private load: number = 0;
  private config: EngineConfig;
  private isRunning: boolean = false;
  private updateTimer: number | null = null;

  // Charger nodes
  private chargerOscs: { osc: OscillatorNode, mult: number }[] = [];
  private chargerGain: GainNode | null = null;
  
  private turboWhine: OscillatorNode | null = null;
  private turboNoise: AudioBufferSourceNode | null = null;
  private turboFilter: BiquadFilterNode | null = null;
  private turboGain: GainNode | null = null;

  private lastThrottle: number = 0;

  // Feature Toggles
  public demonSuperchargerGrit: boolean = true;
  public demonThrottleBark: boolean = true;
  public gtrAntiLag: boolean = true;
  public spyderGearWhine: boolean = true;
  public spyderExhaustValve: boolean = true;
  public spyderHybridMotor: boolean = true;
  public ageraLoudTurbos: boolean = true;
  public ageraWastegateChatter: boolean = true;
  public globalCombFilter: boolean = true;
  public evLegacyBlend: number = 0.0;

  public stormModPrimary: boolean = true;
  public stormModSecondary: boolean = true;
  public stormModGear: boolean = true;
  public stormModInverter: boolean = true;
  public stormModTurbine: boolean = true;

  public taycanModPrimary: boolean = true;
  public taycanModSecondary: boolean = true;
  public taycanModGear: boolean = true;
  public taycanModHarmonicSweep: boolean = true;
  public taycanModSurge: boolean = true;

  // 918 Specific Nodes
  private gearWhineOsc: OscillatorNode | null = null;
  private gearWhineGain: GainNode | null = null;
  private hybridMotorOsc: OscillatorNode | null = null;
  private hybridMotorGain: GainNode | null = null;
  private exhaustValveFilter: BiquadFilterNode | null = null;
  
  // EV Specific Nodes
  private evMotorOsc1: OscillatorNode | null = null;
  private evMotorOsc2: OscillatorNode | null = null;
  private evMotorOsc2Gain: GainNode | null = null;
  private evMotorGain: GainNode | null = null;
  private evGearOsc: OscillatorNode | null = null;
  private evGearGain: GainNode | null = null;
  private evTurbineNoise: AudioBufferSourceNode | null = null;
  private evTurbineFilter: BiquadFilterNode | null = null;
  private evTurbineGain: GainNode | null = null;
  private evSurgeNoise: AudioBufferSourceNode | null = null;
  private evSurgeFilter: BiquadFilterNode | null = null;
  private evSurgeGain: GainNode | null = null;
  private evShaper: WaveShaperNode | null = null;
  
  private evInverterOsc: OscillatorNode | null = null;
  private evInverterFilter: BiquadFilterNode | null = null;
  private evInverterGain: GainNode | null = null;
  
  // Taycan specific
  private taycanHarmonicFilters: BiquadFilterNode[] = [];

  constructor(config: EngineConfig) {
    this.config = config;
    this.rpm = config.idleRPM;
  }

  public async start() {
    if (this.isRunning) return;
    
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 1.5;
    
    // 918 Exhaust Valve Filter
    this.exhaustValveFilter = this.audioCtx.createBiquadFilter();
    this.exhaustValveFilter.type = "highpass";
    this.exhaustValveFilter.frequency.value = 10; // Default low
    this.exhaustValveFilter.connect(this.audioCtx.destination);
    
    // Global Comb Filter (Exhaust Pipe Resonance)
    this.combDelay = this.audioCtx.createDelay(0.1);
    this.combDelay.delayTime.value = 0.002; // 2ms default
    this.combFeedback = this.audioCtx.createGain();
    this.combFeedback.gain.value = 0.3;
    
    this.masterGain.connect(this.combDelay);
    this.combDelay.connect(this.combFeedback);
    this.combFeedback.connect(this.combDelay);
    
    this.combDelay.connect(this.exhaustValveFilter);
    this.masterGain.connect(this.exhaustValveFilter);

    // Initialize AudioWorklet
    const blob = new Blob([engineWorkletCode], { type: 'application/javascript' });
    this.workletUrl = URL.createObjectURL(blob);
    
    try {
      await this.audioCtx.audioWorklet.addModule(this.workletUrl);
      this.workletNode = new AudioWorkletNode(this.audioCtx, 'engine-processor', {
        outputChannelCount: [2] // Force stereo output for bank separation
      });
      this.workletNode.connect(this.masterGain);
      
      // Send initial config
      this.workletNode.port.postMessage({ type: 'config', config: this.config });
    } catch (e) {
      console.error("Failed to load AudioWorklet:", e);
      return;
    }

    if (this.config.isElectric) {
      this.setupEVMotor();
    } else {
      if (this.config.hasSupercharger) this.setupSupercharger();
      if (this.config.hasTurbo) this.setupTurbo();
      this.setupSpyderExtras();
    }

    this.isRunning = true;
    this.updateLoop();
  }

  private makeSoftClipperCurve(amount: number) {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = Math.tanh(x * amount);
    }
    return curve;
  }

  private setupSupercharger() {
    if (!this.audioCtx || !this.masterGain) return;
    
    this.chargerGain = this.audioCtx.createGain();
    this.chargerGain.gain.value = 0;

    const shaper = this.audioCtx.createWaveShaper();
    shaper.curve = this.makeSoftClipperCurve(this.demonSuperchargerGrit ? 8.0 : 5.0); // Heavy distortion for mechanical whine

    this.chargerOscs = [];
    // 4 harmonics for the straight-cut gear whine
    const multipliers = this.demonSuperchargerGrit ? [1, 2, 2.7, 3] : [1, 2, 3];
    multipliers.forEach(mult => {
      const osc = this.audioCtx!.createOscillator();
      osc.type = "sine";
      osc.connect(shaper);
      osc.start();
      this.chargerOscs.push({ osc, mult });
    });

    shaper.connect(this.chargerGain);
    this.chargerGain.connect(this.masterGain);
  }

  private setupTurbo() {
    if (!this.audioCtx || !this.masterGain) return;
    
    this.turboGain = this.audioCtx.createGain();
    this.turboGain.gain.value = 0;

    // Compressor Whine (Primary)
    this.turboWhine = this.audioCtx.createOscillator();
    this.turboWhine.type = "sine";
    this.turboWhine.connect(this.turboGain);
    this.turboWhine.start();

    // Air Rush
    const bufferSize = 2 * this.audioCtx.sampleRate;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    this.turboNoise = this.audioCtx.createBufferSource();
    this.turboNoise.buffer = noiseBuffer;
    this.turboNoise.loop = true;

    this.turboFilter = this.audioCtx.createBiquadFilter();
    this.turboFilter.type = "bandpass";
    this.turboFilter.Q.value = 1.5; // Slightly wider for more aggressive rush
    
    this.turboNoise.connect(this.turboFilter);
    this.turboFilter.connect(this.turboGain);
    this.turboNoise.start();

    this.turboGain.connect(this.masterGain);
  }

  private setupSpyderExtras() {
    if (!this.audioCtx || !this.masterGain) return;

    // Gear Whine
    this.gearWhineGain = this.audioCtx.createGain();
    this.gearWhineGain.gain.value = 0;
    this.gearWhineOsc = this.audioCtx.createOscillator();
    this.gearWhineOsc.type = "sine";
    this.gearWhineOsc.connect(this.gearWhineGain);
    this.gearWhineGain.connect(this.masterGain);
    this.gearWhineOsc.start();

    // Hybrid Motor
    this.hybridMotorGain = this.audioCtx.createGain();
    this.hybridMotorGain.gain.value = 0;
    this.hybridMotorOsc = this.audioCtx.createOscillator();
    this.hybridMotorOsc.type = "sine";
    this.hybridMotorOsc.connect(this.hybridMotorGain);
    this.hybridMotorGain.connect(this.masterGain);
    this.hybridMotorOsc.start();
  }

  private setupEVMotor() {
    if (!this.audioCtx || !this.masterGain) return;

    const isStorm = this.config.name.includes("Storm");
    const isTaycan = this.config.name.includes("Taycan");

    // 1. Primary Motor Whine / Hum
    this.evMotorGain = this.audioCtx.createGain();
    this.evMotorGain.gain.value = 0;
    
    this.evShaper = this.audioCtx.createWaveShaper();
    this.evShaper.curve = this.makeSoftClipperCurve(isStorm ? 1.0 : 1.5); // Taycan is warmer
    
    this.evMotorOsc1 = this.audioCtx.createOscillator();
    this.evMotorOsc1.type = "sine";
    this.evMotorOsc1.connect(this.evShaper);
    this.evMotorOsc1.start();

    if (isTaycan || isStorm) {
      this.evMotorOsc2 = this.audioCtx.createOscillator();
      this.evMotorOsc2.type = "sine";
      this.evMotorOsc2Gain = this.audioCtx.createGain();
      this.evMotorOsc2Gain.gain.value = isTaycan ? 0.55 : 0.4; // 55/45 mix for Taycan
      this.evMotorOsc2.connect(this.evMotorOsc2Gain);
      this.evMotorOsc2Gain.connect(this.evShaper);
      this.evMotorOsc2.start();
    }

    // 2. Gear Reduction Whine
    this.evGearGain = this.audioCtx.createGain();
    this.evGearGain.gain.value = 0;
    
    const gearShaper = this.audioCtx.createWaveShaper();
    gearShaper.curve = this.makeSoftClipperCurve(isStorm ? 2.0 : 1.0);
    
    this.evGearOsc = this.audioCtx.createOscillator();
    this.evGearOsc.type = "sine";
    this.evGearOsc.connect(gearShaper);
    gearShaper.connect(this.evGearGain);
    this.evGearOsc.start();

    // 3. Turbine Hum / Surge
    const bufferSize = 2 * this.audioCtx.sampleRate;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    if (isStorm) {
      // Inverter Buzz
      this.evInverterGain = this.audioCtx.createGain();
      this.evInverterGain.gain.value = 0;
      
      this.evInverterFilter = this.audioCtx.createBiquadFilter();
      this.evInverterFilter.type = "bandpass";
      this.evInverterFilter.frequency.value = 500;
      this.evInverterFilter.Q.value = 2.0;
      
      this.evInverterOsc = this.audioCtx.createOscillator();
      this.evInverterOsc.type = "square";
      
      this.evInverterOsc.connect(this.evInverterFilter);
      this.evInverterFilter.connect(this.evInverterGain);
      this.evInverterGain.connect(this.masterGain);
      this.evInverterOsc.start();

      this.evTurbineGain = this.audioCtx.createGain();
      this.evTurbineGain.gain.value = 0;
      
      this.evTurbineFilter = this.audioCtx.createBiquadFilter();
      this.evTurbineFilter.type = "bandpass";
      this.evTurbineFilter.frequency.value = 250;
      this.evTurbineFilter.Q.value = 0.7;
      
      this.evTurbineNoise = this.audioCtx.createBufferSource();
      this.evTurbineNoise.buffer = noiseBuffer;
      this.evTurbineNoise.loop = true;
      
      this.evTurbineNoise.connect(this.evTurbineFilter);
      this.evTurbineFilter.connect(this.evTurbineGain);
      this.evTurbineGain.connect(this.masterGain);
      this.evTurbineNoise.start();
    }

    if (isTaycan) {
      this.evSurgeGain = this.audioCtx.createGain();
      this.evSurgeGain.gain.value = 0;
      
      this.evSurgeFilter = this.audioCtx.createBiquadFilter();
      this.evSurgeFilter.type = "bandpass";
      this.evSurgeFilter.frequency.value = 2000;
      this.evSurgeFilter.Q.value = 0.5;
      
      this.evSurgeNoise = this.audioCtx.createBufferSource();
      this.evSurgeNoise.buffer = noiseBuffer;
      this.evSurgeNoise.loop = true;
      
      this.evSurgeNoise.connect(this.evSurgeFilter);
      this.evSurgeFilter.connect(this.evSurgeGain);
      this.evSurgeGain.connect(this.masterGain);
      this.evSurgeNoise.start();

      // Taycan Harmonic Sweep Filters
      this.taycanHarmonicFilters = [200, 800, 2000].map(freq => {
        const f = this.audioCtx!.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = freq;
        f.Q.value = 1.0;
        return f;
      });
      
      // Route motor through harmonic filters in parallel
      const filterMixer = this.audioCtx.createGain();
      this.evShaper.connect(this.taycanHarmonicFilters[0]);
      this.evShaper.connect(this.taycanHarmonicFilters[1]);
      this.evShaper.connect(this.taycanHarmonicFilters[2]);
      
      this.taycanHarmonicFilters.forEach(f => f.connect(filterMixer));
      filterMixer.connect(this.evMotorGain);
    } else {
      this.evShaper.connect(this.evMotorGain);
    }

    this.evMotorGain.connect(this.masterGain);
    this.evGearGain.connect(this.masterGain);
  }

  private updateLoop() {
    if (!this.isRunning) return;
    this.updateContinuousNodes();
    this.updateTimer = window.setTimeout(() => this.updateLoop(), 50);
  }

  public setValveTickingEnabled(enabled: boolean) {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'toggleValveTicking', enabled });
    }
  }

  public setIntakeResonanceEnabled(enabled: boolean) {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'toggleIntakeResonance', enabled });
    }
  }

  public setAdvancedRaspEnabled(enabled: boolean) {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'toggleAdvancedRasp', enabled });
    }
  }

  public setGtrV6CamModEnabled(enabled: boolean) {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'toggleGtrV6CamMod', enabled });
    }
  }

  public setEVLegacyBlend(blend: number) {
    this.evLegacyBlend = blend;
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'setEVLegacyBlend', blend });
    }
  }

  public setStormModRumble(enabled: boolean) {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'setStormModRumble', enabled });
    }
  }

  public setTaycanModRumble(enabled: boolean) {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'setTaycanModRumble', enabled });
    }
  }

  public setParameters(rpm: number, load: number) {
    const prevThrottle = this.load;
    this.rpm = Math.max(this.config.idleRPM, rpm);
    this.load = load;
    
    // Send to worklet
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'update', rpm: this.rpm, load: this.load });
    }
    
    // Blow-off valve sound on lift (Turbo flutter)
    if (this.config.hasTurbo && prevThrottle > 0.7 && load < 0.1 && this.rpm > 3000) {
      if (this.gtrAntiLag && this.config.name.includes("GT-R") && this.rpm > 4000) {
        this.scheduleAntiLag();
      } else {
        this.scheduleBlowOff();
      }
    }

    // Backfire on lift
    if (prevThrottle > 0.6 && load < 0.1 && this.rpm > this.config.redlineRPM * 0.6) {
      if (Math.random() > 0.8) this.scheduleBackfire();
    }

    // Demon Throttle Bark
    if (this.demonThrottleBark && (this.config.name.includes("Demon") || this.config.name.includes("Exorcist")) && prevThrottle < 0.1 && load > 0.8) {
      this.playThrottleBark();
    }

    this.lastThrottle = this.load;
  }

  private playThrottleBark() {
    if (!this.audioCtx || !this.masterGain) return;
    const time = this.audioCtx.currentTime;

    const noise = this.audioCtx.createBufferSource();
    const noiseBuffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 0.1, this.audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = noiseBuffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 600;
    filter.Q.value = 1.0;

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(1.5, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
  }

  private scheduleAntiLag() {
    if (!this.audioCtx || !this.masterGain) return;
    const time = this.audioCtx.currentTime;
    const numPops = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numPops; i++) {
      const popTime = time + i * (0.05 + Math.random() * 0.03);
      
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      osc.type = "square";
      osc.frequency.setValueAtTime(80 + Math.random() * 40, popTime);
      osc.frequency.exponentialRampToValueAtTime(30, popTime + 0.1);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(3000, popTime);

      gain.gain.setValueAtTime(0, popTime);
      gain.gain.linearRampToValueAtTime(3.0, popTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(popTime);
      osc.stop(popTime + 0.1);
    }
  }

  private scheduleBlowOff() {
    if (!this.audioCtx || !this.masterGain) return;
    const time = this.audioCtx.currentTime;

    // Noise source
    const noise = this.audioCtx.createBufferSource();
    const noiseBuffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 1.0, this.audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = noiseBuffer;

    // Filter
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(3000, time);
    filter.frequency.exponentialRampToValueAtTime(1000, time + 0.8);

    // Main Envelope
    const envGain = this.audioCtx.createGain();
    envGain.gain.setValueAtTime(0, time);
    envGain.gain.linearRampToValueAtTime(0.8, time + 0.02);
    envGain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);

    // Flutter AM (Stut-stut-stut)
    const flutterOsc = this.audioCtx.createOscillator();
    flutterOsc.type = "sine";
    const flutterFreq = (this.ageraWastegateChatter && this.config.name.includes("Agera")) ? 25 : 14;
    flutterOsc.frequency.value = flutterFreq;
    
    // Agera low frequency thump
    if (this.ageraWastegateChatter && this.config.name.includes("Agera")) {
      const thumpOsc = this.audioCtx.createOscillator();
      thumpOsc.type = "sine";
      thumpOsc.frequency.value = 60;
      const thumpGain = this.audioCtx.createGain();
      thumpGain.gain.setValueAtTime(0, time);
      thumpGain.gain.linearRampToValueAtTime(1.0, time + 0.02);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
      thumpOsc.connect(thumpGain);
      thumpGain.connect(this.masterGain);
      thumpOsc.start(time);
      thumpOsc.stop(time + 0.5);
    }

    const flutterGain = this.audioCtx.createGain();
    flutterGain.gain.value = 0.5;
    
    const flutterModGain = this.audioCtx.createGain();
    flutterModGain.gain.value = 0.5;
    
    flutterOsc.connect(flutterModGain);
    flutterModGain.connect(flutterGain.gain);

    // Routing
    noise.connect(filter);
    filter.connect(envGain);
    envGain.connect(flutterGain);
    flutterGain.connect(this.masterGain);

    noise.start(time);
    flutterOsc.start(time);
    
    noise.stop(time + 1.0);
    flutterOsc.stop(time + 1.0);
  }

  private scheduleBackfire() {
    if (!this.audioCtx || !this.masterGain) return;
    const time = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(100, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.2);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2000, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(2.0, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.2);

    // Add noise crackle
    const noise = this.audioCtx.createBufferSource();
    const nGain = this.audioCtx.createGain();
    const nBuffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 0.1, this.audioCtx.sampleRate);
    const nData = nBuffer.getChannelData(0);
    for (let i = 0; i < nData.length; i++) nData[i] = Math.random() * 2 - 1;
    noise.buffer = nBuffer;

    nGain.gain.setValueAtTime(0, time);
    nGain.gain.linearRampToValueAtTime(1.0, time + 0.002);
    nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    noise.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(time);
  }

  private updateContinuousNodes() {
    if (!this.audioCtx || !this.isRunning) return;
    const now = this.audioCtx.currentTime;

    if (this.config.hasSupercharger && this.chargerGain) {
      const baseFreq = this.rpm * 1.5;
      this.chargerOscs.forEach(({ osc, mult }) => {
        osc.frequency.setTargetAtTime(baseFreq * mult, now, 0.05);
      });
      
      let surge = 0;
      if (this.demonSuperchargerGrit && (this.config.name.includes("Demon") || this.config.name.includes("Exorcist"))) {
        surge = Math.sin(now * 2 * Math.PI * 3) * 0.05;
      }
      
      const whineVol = (this.rpm / this.config.maxRPM) * 0.3 * (0.2 + this.load * 0.8) + surge;
      this.chargerGain.gain.setTargetAtTime(Math.max(0, whineVol), now, 0.1);
    }

    if (this.config.hasTurbo && this.turboGain && this.turboWhine && this.turboFilter) {
      const spoolRatio = (this.rpm / this.config.maxRPM) * this.load;
      
      const isGtr = this.config.name.includes("GT-R");
      const baseWhine = isGtr ? 2500 : 4000;
      const maxWhine = isGtr ? 4000 : 8000;
      
      this.turboWhine.frequency.setTargetAtTime(baseWhine + spoolRatio * maxWhine, now, 0.2);
      this.turboFilter.frequency.setTargetAtTime(2000 + spoolRatio * 6000, now, 0.2);
      
      const isAgera = this.config.name.includes("Agera");
      const turboVol = spoolRatio * (isAgera && this.ageraLoudTurbos ? 0.7 : 0.4);
      this.turboGain.gain.setTargetAtTime(turboVol, now, 0.2);
    }

    // 918 Spyder Extras
    if (this.config.name.includes("Spyder")) {
      if (this.gearWhineGain && this.gearWhineOsc) {
        if (this.spyderGearWhine) {
          const gearRatio = 3.5; // Approximation
          this.gearWhineOsc.frequency.setTargetAtTime(this.rpm * gearRatio * 0.8, now, 0.1);
          this.gearWhineGain.gain.setTargetAtTime(0.03 * (this.rpm / this.config.maxRPM), now, 0.1);
        } else {
          this.gearWhineGain.gain.setTargetAtTime(0, now, 0.1);
        }
      }

      if (this.hybridMotorGain && this.hybridMotorOsc) {
        if (this.spyderHybridMotor) {
          this.hybridMotorOsc.frequency.setTargetAtTime(200 + this.load * 600, now, 0.1);
          this.hybridMotorGain.gain.setTargetAtTime(this.load * 0.03, now, 0.1);
        } else {
          this.hybridMotorGain.gain.setTargetAtTime(0, now, 0.1);
        }
      }

      if (this.exhaustValveFilter) {
        if (this.spyderExhaustValve) {
          const cutoff = this.rpm > 5000 ? 100 : 300;
          this.exhaustValveFilter.frequency.setTargetAtTime(cutoff, now, 0.2);
        } else {
          this.exhaustValveFilter.frequency.setTargetAtTime(10, now, 0.2);
        }
      }
    } else if (this.exhaustValveFilter) {
      this.exhaustValveFilter.frequency.setTargetAtTime(10, now, 0.2);
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const blend = this.evLegacyBlend;

    // Global Comb Filter Update
    if (this.combFeedback && this.combDelay) {
      if (this.globalCombFilter) {
        const delayMs = this.config.cylinders > 8 ? 0.0015 : 0.0025;
        this.combDelay.delayTime.setTargetAtTime(delayMs, now, 0.1);
        const targetGain = this.config.isElectric ? lerp(0, 0.3, blend) : 0.3;
        this.combFeedback.gain.setTargetAtTime(targetGain, now, 0.1);
      } else {
        this.combFeedback.gain.setTargetAtTime(0, now, 0.1);
      }
    }

    // EV Updates
    if (this.config.isElectric) {
      const isStormMod = this.config.name.includes("Jackson Storm (Modular)");
      const isStorm = this.config.name.includes("Storm") && !isStormMod;
      const isTaycanMod = this.config.name.includes("Taycan (Modular)");
      const isTaycan = this.config.name.includes("Taycan") && !isTaycanMod;
      
      const isAnyStorm = isStorm || isStormMod;
      const isAnyTaycan = isTaycan || isTaycanMod;
      
      const rpmRatio = this.rpm / this.config.maxRPM;
      
      const modernBaseFreq = isAnyStorm ? 80 + (rpmRatio * 320) : 40 + (rpmRatio * 660);
      const legacyBaseFreq = isAnyStorm ? 800 + (rpmRatio * 5200) : 50 + (rpmRatio * 750);
      const baseFreq = lerp(modernBaseFreq, legacyBaseFreq, blend);

      // Primary Motor
      if (this.evMotorOsc1 && this.evMotorGain) {
        this.evMotorOsc1.frequency.setTargetAtTime(baseFreq, now, 0.1);
        
        if (this.evMotorOsc2) {
          const modernOsc2Freq = isAnyStorm ? 150 + (rpmRatio * 1050) : 100 + (rpmRatio * 1500);
          const legacyOsc2Freq = baseFreq * (isAnyStorm ? 2 : 2.4);
          const osc2Freq = lerp(modernOsc2Freq, legacyOsc2Freq, blend);
          this.evMotorOsc2.frequency.setTargetAtTime(osc2Freq, now, 0.1);
        }

        // Regen braking logic
        if (this.load < 0.1 && this.rpm > this.config.idleRPM + 500) {
          // Pitch drops faster on decel
          this.evMotorOsc1.frequency.setTargetAtTime(baseFreq * 0.8, now, 0.5);
          if (this.evMotorOsc2) {
            const modernOsc2Freq = isAnyStorm ? 150 + (rpmRatio * 1050) : 100 + (rpmRatio * 1500);
            const legacyOsc2Freq = baseFreq * (isAnyStorm ? 1.6 : 1.9);
            const osc2Freq = lerp(modernOsc2Freq, legacyOsc2Freq, blend);
            this.evMotorOsc2.frequency.setTargetAtTime(osc2Freq * 0.8, now, 0.5);
          }
        }

        // Full throttle surge
        let surgePitch = 1.0;
        if (this.load > 0.9 && isAnyTaycan) surgePitch = 1.05;
        this.evMotorOsc1.frequency.setTargetAtTime(baseFreq * surgePitch, now, 0.2);

        const modernMotorGain = isAnyStorm ? 0.06 + (this.load * 0.2) : 0.4 + (this.load * 0.4);
        const legacyMotorGain = 0.4 + (this.load * 0.4);
        let motorGain = lerp(modernMotorGain, legacyMotorGain, blend);
        
        if (isStormMod && !this.stormModPrimary) motorGain = 0;
        if (isTaycanMod && !this.taycanModPrimary) motorGain = 0;

        this.evMotorGain.gain.setTargetAtTime(motorGain, now, 0.1);
        
        if (this.evMotorOsc2Gain) {
          let osc2Targ = isAnyTaycan ? 0.55 : 0.4;
          if (isStormMod && !this.stormModSecondary) osc2Targ = 0;
          if (isTaycanMod && !this.taycanModSecondary) osc2Targ = 0;
          this.evMotorOsc2Gain.gain.setTargetAtTime(osc2Targ, now, 0.1);
        }
      }

      // Gear Reduction
      if (this.evGearOsc && this.evGearGain) {
        let modernGearMult = isAnyStorm ? 0.1 : 0.12;
        let legacyGearMult = isAnyStorm ? 0.3 : 0.4;
        let modernGearGain = isAnyStorm ? 0.15 : 0.2;
        let legacyGearGain = isAnyStorm ? 0.3 : 0.5;

        // Taycan 2-speed shift logic
        if (isAnyTaycan) {
          if (this.rpm > 8000) {
            modernGearMult = 0.06; // 2nd gear
            legacyGearMult = 0.2;
            // Brief silence during shift
            if (this.rpm > 8000 && this.rpm < 8500 && this.load > 0.5) {
               modernGearGain = 0;
               legacyGearGain = 0;
            }
          }
        }

        const gearMult = lerp(modernGearMult, legacyGearMult, blend);
        let gearGain = lerp(modernGearGain, legacyGearGain, blend);
        
        if (isStormMod && !this.stormModGear) gearGain = 0;
        if (isTaycanMod && !this.taycanModGear) gearGain = 0;

        this.evGearOsc.frequency.setTargetAtTime(this.rpm * gearMult, now, isAnyTaycan && this.rpm > 8000 && this.rpm < 8500 ? 0.01 : 0.1);
        this.evGearGain.gain.setTargetAtTime(gearGain * (0.5 + rpmRatio * 0.5), now, 0.1);
      }

      // Inverter Buzz (Storm)
      if (isAnyStorm && this.evInverterOsc && this.evInverterGain) {
        let invGain = lerp(0.08 * this.load, 0, blend);
        if (isStormMod && !this.stormModInverter) invGain = 0;
        this.evInverterOsc.frequency.setTargetAtTime(this.rpm * 0.04, now, 0.1);
        this.evInverterGain.gain.setTargetAtTime(invGain, now, 0.1);
      }

      // Turbine / Surge Noise
      if (isAnyStorm && this.evTurbineGain && this.evTurbineFilter) {
        let turbGain = lerp(this.load * 0.25, this.load * 0.15, blend);
        if (isStormMod && !this.stormModTurbine) turbGain = 0;
        this.evTurbineFilter.frequency.setTargetAtTime(lerp(250, 400, blend), now, 0.1);
        this.evTurbineFilter.Q.setTargetAtTime(lerp(0.7, 1.0, blend), now, 0.1);
        this.evTurbineGain.gain.setTargetAtTime(turbGain, now, 0.1);
      }

      if (isAnyTaycan && this.evSurgeGain) {
        let surgeTarg = this.load > 0.9 ? this.load * 0.08 : 0;
        if (isTaycanMod && !this.taycanModSurge) surgeTarg = 0;
        this.evSurgeGain.gain.setTargetAtTime(surgeTarg, now, 0.2);
      }

      // Taycan Harmonic Sweep
      if (isAnyTaycan && this.taycanHarmonicFilters.length > 0) {
        const legacyQ = 1.0 + (rpmRatio * 4.0); // Sweep Q from 1.0 to 5.0
        
        const rpm = this.rpm;
        const modernQ0 = rpm > 4000 ? 3.0 + ((rpm - 4000) / 12000) * 2.0 : 1.0;
        const modernQ1 = rpm > 8000 ? 3.5 + ((rpm - 8000) / 8000) * 2.0 : 1.0;
        const modernQ2 = rpm > 12000 ? 4.0 + ((rpm - 12000) / 4000) * 2.0 : 1.0;
        
        let q0 = lerp(modernQ0, legacyQ, blend);
        let q1 = lerp(modernQ1, legacyQ, blend);
        let q2 = lerp(modernQ2, legacyQ, blend);

        if (isTaycanMod && !this.taycanModHarmonicSweep) {
          q0 = 1; q1 = 1; q2 = 1;
        }

        this.taycanHarmonicFilters[0].Q.setTargetAtTime(q0, now, 0.15);
        this.taycanHarmonicFilters[1].Q.setTargetAtTime(q1, now, 0.15);
        this.taycanHarmonicFilters[2].Q.setTargetAtTime(q2, now, 0.15);
      }
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.updateTimer) clearTimeout(this.updateTimer);
    
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    
    if (this.workletUrl) {
      URL.revokeObjectURL(this.workletUrl);
      this.workletUrl = null;
    }

    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }

  public setConfig(config: EngineConfig) {
    const wasRunning = this.isRunning;
    if (wasRunning) this.stop();
    this.config = config;
    this.rpm = config.idleRPM;
    if (wasRunning) this.start();
  }
}
