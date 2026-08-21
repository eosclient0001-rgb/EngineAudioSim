import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EngineSimulator, CAR_CONFIGS, EngineConfig } from './lib/EngineSimulator';
import { Play, Square, ChevronUp, ChevronDown, Gauge, Zap, Wind, Activity } from 'lucide-react';

const GEAR_RATIOS = [3.5, 2.3, 1.6, 1.2, 1.0, 0.8, 0.6]; // Simple gear ratios
const FINAL_DRIVE = 3.5;

function Toggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: (c: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="relative">
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-red-600' : 'bg-zinc-700'}`}></div>
        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
      </div>
      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</span>
    </label>
  );
}

function Slider({ label, value, onChange, min = 0, max = 100 }: { label: string, value: number, onChange: (v: number) => void, min?: number, max?: number }) {
  return (
    <div className="flex flex-col gap-2 bg-zinc-900/50 px-4 py-3 rounded-xl border border-zinc-800 min-w-[200px]">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono text-zinc-500">{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-red-600"
      />
    </div>
  );
}

export default function App() {
  const [selectedCarKey, setSelectedCarKey] = useState<string>('demon');
  const [isRunning, setIsRunning] = useState(false);
  const [rpm, setRpm] = useState(800);
  const [throttle, setThrottle] = useState(0);
  const [gear, setGear] = useState(1);
  const [speed, setSpeed] = useState(0);
  const [valveTicking, setValveTicking] = useState(true);
  const [intakeResonance, setIntakeResonance] = useState(true);
  const [advancedRasp, setAdvancedRasp] = useState(true);
  const [gtrV6CamMod, setGtrV6CamMod] = useState(true);
  
  const [demonSuperchargerGrit, setDemonSuperchargerGrit] = useState(true);
  const [demonThrottleBark, setDemonThrottleBark] = useState(true);
  const [gtrAntiLag, setGtrAntiLag] = useState(true);
  const [spyderGearWhine, setSpyderGearWhine] = useState(true);
  const [spyderExhaustValve, setSpyderExhaustValve] = useState(true);
  const [spyderHybridMotor, setSpyderHybridMotor] = useState(true);
  const [ageraLoudTurbos, setAgeraLoudTurbos] = useState(true);
  const [ageraWastegateChatter, setAgeraWastegateChatter] = useState(true);
  const [globalCombFilter, setGlobalCombFilter] = useState(true);
  const [evLegacyMode, setEvLegacyMode] = useState(false);

  const [stormModPrimary, setStormModPrimary] = useState(true);
  const [stormModSecondary, setStormModSecondary] = useState(true);
  const [stormModGear, setStormModGear] = useState(true);
  const [stormModInverter, setStormModInverter] = useState(true);
  const [stormModTurbine, setStormModTurbine] = useState(true);
  const [stormModRumble, setStormModRumble] = useState(true);

  const [taycanModPrimary, setTaycanModPrimary] = useState(true);
  const [taycanModSecondary, setTaycanModSecondary] = useState(true);
  const [taycanModGear, setTaycanModGear] = useState(true);
  const [taycanModHarmonicSweep, setTaycanModHarmonicSweep] = useState(true);
  const [taycanModSurge, setTaycanModSurge] = useState(true);
  const [taycanModRumble, setTaycanModRumble] = useState(true);
  
  const engineRef = useRef<EngineSimulator | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const config = CAR_CONFIGS[selectedCarKey];

  // Initialize engine
  useEffect(() => {
    engineRef.current = new EngineSimulator(config);
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  // Handle car change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setConfig(config);
      engineRef.current.setValveTickingEnabled(valveTicking);
      engineRef.current.setIntakeResonanceEnabled(intakeResonance);
      engineRef.current.setAdvancedRaspEnabled(advancedRasp);
      engineRef.current.setGtrV6CamModEnabled(gtrV6CamMod);
      
      engineRef.current.demonSuperchargerGrit = demonSuperchargerGrit;
      engineRef.current.demonThrottleBark = demonThrottleBark;
      engineRef.current.gtrAntiLag = gtrAntiLag;
      engineRef.current.spyderGearWhine = spyderGearWhine;
      engineRef.current.spyderExhaustValve = spyderExhaustValve;
      engineRef.current.spyderHybridMotor = spyderHybridMotor;
      engineRef.current.ageraLoudTurbos = ageraLoudTurbos;
      engineRef.current.ageraWastegateChatter = ageraWastegateChatter;
      engineRef.current.globalCombFilter = globalCombFilter;
      engineRef.current.setEVLegacyBlend(evLegacyMode ? 1.0 : 0.0);

      engineRef.current.stormModPrimary = stormModPrimary;
      engineRef.current.stormModSecondary = stormModSecondary;
      engineRef.current.stormModGear = stormModGear;
      engineRef.current.stormModInverter = stormModInverter;
      engineRef.current.stormModTurbine = stormModTurbine;
      engineRef.current.setStormModRumble(stormModRumble);

      engineRef.current.taycanModPrimary = taycanModPrimary;
      engineRef.current.taycanModSecondary = taycanModSecondary;
      engineRef.current.taycanModGear = taycanModGear;
      engineRef.current.taycanModHarmonicSweep = taycanModHarmonicSweep;
      engineRef.current.taycanModSurge = taycanModSurge;
      engineRef.current.setTaycanModRumble(taycanModRumble);

      setRpm(config.idleRPM);
      setGear(1);
      setSpeed(0);
    }
  }, [selectedCarKey]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setValveTickingEnabled(valveTicking);
    }
  }, [valveTicking]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setIntakeResonanceEnabled(intakeResonance);
    }
  }, [intakeResonance]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setAdvancedRaspEnabled(advancedRasp);
    }
  }, [advancedRasp]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setGtrV6CamModEnabled(gtrV6CamMod);
    }
  }, [gtrV6CamMod]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.demonSuperchargerGrit = demonSuperchargerGrit;
      engineRef.current.demonThrottleBark = demonThrottleBark;
      engineRef.current.gtrAntiLag = gtrAntiLag;
      engineRef.current.spyderGearWhine = spyderGearWhine;
      engineRef.current.spyderExhaustValve = spyderExhaustValve;
      engineRef.current.spyderHybridMotor = spyderHybridMotor;
      engineRef.current.ageraLoudTurbos = ageraLoudTurbos;
      engineRef.current.ageraWastegateChatter = ageraWastegateChatter;
      engineRef.current.globalCombFilter = globalCombFilter;
      engineRef.current.stormModPrimary = stormModPrimary;
      engineRef.current.stormModSecondary = stormModSecondary;
      engineRef.current.stormModGear = stormModGear;
      engineRef.current.stormModInverter = stormModInverter;
      engineRef.current.stormModTurbine = stormModTurbine;

      engineRef.current.taycanModPrimary = taycanModPrimary;
      engineRef.current.taycanModSecondary = taycanModSecondary;
      engineRef.current.taycanModGear = taycanModGear;
      engineRef.current.taycanModHarmonicSweep = taycanModHarmonicSweep;
      engineRef.current.taycanModSurge = taycanModSurge;
    }
  }, [demonSuperchargerGrit, demonThrottleBark, gtrAntiLag, spyderGearWhine, spyderExhaustValve, spyderHybridMotor, ageraLoudTurbos, ageraWastegateChatter, globalCombFilter, stormModPrimary, stormModSecondary, stormModGear, stormModInverter, stormModTurbine, taycanModPrimary, taycanModSecondary, taycanModGear, taycanModHarmonicSweep, taycanModSurge]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setEVLegacyBlend(evLegacyMode ? 1.0 : 0.0);
    }
  }, [evLegacyMode]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setStormModRumble(stormModRumble);
    }
  }, [stormModRumble]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTaycanModRumble(taycanModRumble);
    }
  }, [taycanModRumble]);

  const toggleEngine = () => {
    if (isRunning) {
      engineRef.current?.stop();
      setIsRunning(false);
      setRpm(0);
    } else {
      engineRef.current?.start();
      setIsRunning(true);
      setRpm(config.idleRPM);
    }
  };

  // Physics loop
  const update = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    if (isRunning) {
      setRpm(prevRpm => {
        // Engine physics
        const inertia = 5000; // Resistance to change
        const power = throttle * 15000; // Acceleration force
        const friction = prevRpm * 0.5; // Drag
        
        // Load from wheels
        const wheelLoad = speed * 0.1 * GEAR_RATIOS[gear - 1];
        
        let targetRpmDelta = (power - friction - wheelLoad) / inertia;
        
        // Rev limiter
        let nextRpm = prevRpm + targetRpmDelta * deltaTime * 1000;
        if (nextRpm > config.maxRPM) {
          nextRpm = config.maxRPM - Math.random() * 200; // Bounce off limiter
        }
        if (nextRpm < config.idleRPM) nextRpm = config.idleRPM;

        // Update audio
        engineRef.current?.setParameters(nextRpm, throttle);
        
        // Update speed based on RPM and Gear
        const newSpeed = (nextRpm / GEAR_RATIOS[gear - 1] / FINAL_DRIVE) * 0.15;
        setSpeed(newSpeed);

        return nextRpm;
      });
    }

    requestRef.current = requestAnimationFrame(update);
  }, [isRunning, throttle, gear, speed, config]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') setThrottle(1);
    if (e.key === 'ArrowDown') setThrottle(0);
    if (e.key === 'w' || e.key === 'W') setThrottle(1);
    if (e.key === 's' || e.key === 'S') setThrottle(0);
    if (e.key === 'e' || e.key === 'E') shiftUp();
    if (e.key === 'q' || e.key === 'Q') shiftDown();
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') setThrottle(0);
  };

  const shiftUp = () => {
    if (gear < GEAR_RATIOS.length) {
      setGear(g => g + 1);
      setRpm(r => r * (GEAR_RATIOS[gear] / GEAR_RATIOS[gear - 1]));
    }
  };

  const shiftDown = () => {
    if (gear > 1) {
      setGear(g => g - 1);
      setRpm(r => r * (GEAR_RATIOS[gear - 2] / GEAR_RATIOS[gear - 1]));
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-red-500/30 overflow-hidden"
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      tabIndex={0}
    >
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20 blur-[120px]"
          style={{ backgroundColor: config.color }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Car Selection & Info */}
        <div className="lg:col-span-4 space-y-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-2">
              Rev<span className="text-red-600">Sim</span>
            </h1>
            <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">Engine Audio Laboratory v1.0</p>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Select Vehicle</label>
            <div className="grid gap-3">
              {Object.entries(CAR_CONFIGS).map(([key, car]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCarKey(key)}
                  className={`group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                    selectedCarKey === key 
                      ? 'bg-zinc-900 border-zinc-700 shadow-xl' 
                      : 'bg-transparent border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div 
                    className="w-2 h-12 rounded-full transition-transform group-hover:scale-y-110"
                    style={{ backgroundColor: car.color }}
                  />
                  <div className="text-left">
                    <h3 className={`font-bold transition-colors ${selectedCarKey === key ? 'text-white' : 'text-zinc-400'}`}>
                      {car.name}
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono">
                      {car.isElectric ? 'ELECTRIC MOTOR' : `${car.cylinders} CYL • ${car.hasTurbo ? 'TWIN TURBO' : car.hasSupercharger ? 'SUPERCHARGED' : 'NATURALLY ASPIRATED'}`}
                    </p>
                  </div>
                  {selectedCarKey === key && (
                    <motion.div 
                      layoutId="active-car"
                      className="absolute inset-0 rounded-xl border-2"
                      style={{ borderColor: car.color, opacity: 0.3 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Telemetry
            </h4>
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">LOAD</span>
                <span className="text-white">{(throttle * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-red-500"
                  animate={{ width: `${throttle * 100}%` }}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">GEAR</span>
                <span className="text-white">{gear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">STATUS</span>
                <span className={isRunning ? 'text-green-500' : 'text-red-500'}>
                  {isRunning ? 'RUNNING' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Gauges & Controls */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center gap-12">
          {/* Main Gauges */}
          <div className="relative w-full aspect-square max-w-[500px] flex items-center justify-center">
            {/* RPM Gauge */}
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
              {/* Background Track */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#18181b"
                strokeWidth="12"
                strokeDasharray="377 502" // 3/4 circle
                strokeLinecap="round"
              />
              {/* Redline Area */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#ef4444"
                strokeWidth="12"
                strokeDasharray={`${(1 - config.redlineRPM / config.maxRPM) * 377} 502`}
                strokeDashoffset={-377 + (1 - config.redlineRPM / config.maxRPM) * 377}
                strokeLinecap="round"
                className="opacity-30"
              />
              {/* Active RPM Track */}
              <motion.circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={config.color}
                strokeWidth="12"
                strokeDasharray="377 502"
                animate={{ strokeDashoffset: 377 - (rpm / config.maxRPM) * 377 }}
                transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 8px ${config.color}44)` }}
              />
            </svg>

            {/* Inner Display */}
            <div className="absolute flex flex-col items-center text-center">
              <motion.span 
                className="text-7xl font-black italic tracking-tighter"
                animate={{ scale: rpm > config.redlineRPM ? [1, 1.05, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 0.1 }}
              >
                {Math.round(rpm)}
              </motion.span>
              <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">RPM</span>
              
              <div className="mt-8 flex flex-col items-center">
                <span className="text-4xl font-bold">{Math.round(speed)}</span>
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">KM/H</span>
              </div>
            </div>

            {/* Shift Indicator */}
            <AnimatePresence>
              {rpm > config.redlineRPM - 500 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse"
                >
                  Shift Up
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap justify-center gap-6 w-full">
            <button
              onClick={toggleEngine}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
                isRunning 
                  ? 'bg-zinc-800 text-red-500 hover:bg-zinc-700' 
                  : 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20'
              }`}
            >
              {isRunning ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              {isRunning ? 'Stop Engine' : 'Start Engine'}
            </button>

            <div className="flex gap-2">
              <button 
                onClick={shiftDown}
                className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
                title="Shift Down (Q)"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
              <div className="w-16 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-2xl font-black text-2xl italic">
                {gear}
              </div>
              <button 
                onClick={shiftUp}
                className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
                title="Shift Up (E)"
              >
                <ChevronUp className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800">
              <div className="p-3 rounded-xl bg-zinc-800">
                <Zap className={`w-5 h-5 ${throttle > 0 ? 'text-yellow-400' : 'text-zinc-600'}`} />
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={throttle}
                onChange={(e) => setThrottle(parseFloat(e.target.value))}
                className="w-32 accent-red-600"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap justify-center gap-4 w-full mt-4">
            {selectedCarKey !== 'storm_modular' && selectedCarKey !== 'taycan_modular' && (
              <>
                <Toggle label="Valve Ticking" checked={valveTicking} onChange={setValveTicking} />
                <Toggle label="Intake Howl" checked={intakeResonance} onChange={setIntakeResonance} />
                <Toggle label="AM Rasp Beating" checked={advancedRasp} onChange={setAdvancedRasp} />
                <Toggle label="Exhaust Comb Filter" checked={globalCombFilter} onChange={setGlobalCombFilter} />
              </>
            )}
            
            {(selectedCarKey === 'demon' || selectedCarKey === 'mustang_exorcist') && (
              <>
                <Toggle label="Supercharger Grit" checked={demonSuperchargerGrit} onChange={setDemonSuperchargerGrit} />
                <Toggle label="Throttle Bark" checked={demonThrottleBark} onChange={setDemonThrottleBark} />
              </>
            )}
            
            {selectedCarKey === 'gtr' && (
              <>
                <Toggle label="V6 Cam Mod" checked={gtrV6CamMod} onChange={setGtrV6CamMod} />
                <Toggle label="Anti-Lag Crackle" checked={gtrAntiLag} onChange={setGtrAntiLag} />
              </>
            )}
            
            {selectedCarKey === 'spyder' && (
              <>
                <Toggle label="Gear Whine" checked={spyderGearWhine} onChange={setSpyderGearWhine} />
                <Toggle label="Exhaust Valve" checked={spyderExhaustValve} onChange={setSpyderExhaustValve} />
                <Toggle label="Hybrid Motor" checked={spyderHybridMotor} onChange={setSpyderHybridMotor} />
              </>
            )}
            
            {selectedCarKey === 'agera' && (
              <>
                <Toggle label="Loud Turbos" checked={ageraLoudTurbos} onChange={setAgeraLoudTurbos} />
                <Toggle label="Wastegate Chatter" checked={ageraWastegateChatter} onChange={setAgeraWastegateChatter} />
              </>
            )}
            
            {config.isElectric && (
              <>
                <Toggle label="Legacy High-Pitch Mode" checked={evLegacyMode} onChange={setEvLegacyMode} />
                <div className="w-full text-center mt-2 text-xs text-zinc-500 font-mono uppercase tracking-widest">
                  EV Synthesis Mode Active
                </div>
              </>
            )}

            {selectedCarKey === 'storm_modular' && (
              <>
                <Toggle label="Primary Motor Whine" checked={stormModPrimary} onChange={setStormModPrimary} />
                <Toggle label="Secondary Motor Sweep" checked={stormModSecondary} onChange={setStormModSecondary} />
                <Toggle label="Gear Reduction Whine" checked={stormModGear} onChange={setStormModGear} />
                <Toggle label="Inverter Buzz" checked={stormModInverter} onChange={setStormModInverter} />
                <Toggle label="Turbine Surge Noise" checked={stormModTurbine} onChange={setStormModTurbine} />
                <Toggle label="Sub-Bass Hybrid Rumble" checked={stormModRumble} onChange={setStormModRumble} />
                
                <div className="w-full text-center mt-2 text-xs text-zinc-500 font-mono uppercase tracking-widest">
                  Modular EV Mode Active
                </div>
              </>
            )}

            {selectedCarKey === 'taycan_modular' && (
              <>
                <Toggle label="Primary Motor Whine" checked={taycanModPrimary} onChange={setTaycanModPrimary} />
                <Toggle label="Secondary Motor Sweep" checked={taycanModSecondary} onChange={setTaycanModSecondary} />
                <Toggle label="Gear Reduction Whine" checked={taycanModGear} onChange={setTaycanModGear} />
                <Toggle label="Harmonic Shift Filters" checked={taycanModHarmonicSweep} onChange={setTaycanModHarmonicSweep} />
                <Toggle label="Turbine Surge Noise" checked={taycanModSurge} onChange={setTaycanModSurge} />
                <Toggle label="Sub-Bass EV Throb" checked={taycanModRumble} onChange={setTaycanModRumble} />
                
                <div className="w-full text-center mt-2 text-xs text-zinc-500 font-mono uppercase tracking-widest">
                  Modular EV Mode Active
                </div>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest flex gap-8">
            <span className="flex items-center gap-2"><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">W / ↑</kbd> Throttle</span>
            <span className="flex items-center gap-2"><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">Q / E</kbd> Shift</span>
          </div>
        </div>
      </main>

      {/* Visual FX: Turbo/Supercharger indicators */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4">
        {config.hasTurbo && (
          <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all ${throttle > 0.5 ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-zinc-900/50 border-zinc-800 text-zinc-600'}`}>
            <Wind className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Turbo Spooling</span>
          </div>
        )}
        {config.hasSupercharger && (
          <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all ${rpm > 3000 ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' : 'bg-zinc-900/50 border-zinc-800 text-zinc-600'}`}>
            <Gauge className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Supercharger Whine</span>
          </div>
        )}
      </div>
    </div>
  );
}
