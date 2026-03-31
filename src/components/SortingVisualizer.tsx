import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ALGORITHMS, AlgorithmType, AlgorithmInfo } from '../algorithms';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  RotateCcw, 
  Settings2, 
  Code2, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  Activity,
  Database,
  Cpu,
  Volume2,
  VolumeX
} from 'lucide-react';

interface ArrayElement {
  id: string;
  value: number;
}

interface Step {
  array: ArrayElement[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
}

const MIN_SIZE = 5;
const MAX_SIZE = 100;
const INITIAL_SPEED = 50;

export default function SortingVisualizer() {
  const [array, setArray] = useState<ArrayElement[]>(() => 
    Array.from({ length: 10 }, (_, i) => ({
      id: `initial-${i}`,
      value: 20 + i * 8
    }))
  );
  const [size, setSize] = useState(10);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('bubble');
  const [isSorting, setIsSorting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<Step[]>(() => [{
    array: Array.from({ length: 10 }, (_, i) => ({ id: `initial-${i}`, value: 20 + i * 8 })),
    comparing: [],
    swapping: [],
    sorted: []
  }]);
  const [showCode, setShowCode] = useState(true);
  const [codeLanguage, setCodeLanguage] = useState<'js' | 'py'>('js');
  const [customArray, setCustomArray] = useState('');
  const [arrayType, setArrayType] = useState<'random' | 'reverse' | 'custom'>('random');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vizKey, setVizKey] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback((value: number) => {
    if (!soundEnabled) return;
    
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      // Map value (0-100) to frequency (200Hz - 1200Hz)
      const freq = 200 + (value / 100) * 1000;
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio error:", e);
    }
  }, [soundEnabled]);

  useEffect(() => {
    setSteps([{ array: [...array], comparing: [], swapping: [], sorted: [] }]);
  }, []);

  const updateArray = useCallback((newArray: ArrayElement[]) => {
    setArray(newArray);
    setSteps([{ array: [...newArray], comparing: [], swapping: [], sorted: [] }]);
    setCurrentStep(0);
    setIsSorting(false);
    setVizKey(prev => prev + 1);
  }, []);

  const generateRandomArray = useCallback((newSize: number) => {
    const newArray = Array.from({ length: newSize }, (_, i) => ({
      id: `el-${i}-${Math.random()}`,
      value: Math.floor(Math.random() * 90) + 10
    }));
    updateArray(newArray);
  }, [updateArray]);

  const generateReverseArray = useCallback((newSize: number) => {
    const newArray = Array.from({ length: newSize }, (_, i) => ({
      id: `el-${i}`,
      value: Math.floor(((newSize - i) / newSize) * 100)
    }));
    updateArray(newArray);
  }, [updateArray]);

  useEffect(() => {
    if (arrayType === 'random') generateRandomArray(size);
    else if (arrayType === 'reverse') generateReverseArray(size);
  }, [size, arrayType, generateRandomArray, generateReverseArray]);

  const handleCustomArraySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const values = customArray.split(/[\s,]+/).map(v => parseInt(v.trim())).filter(v => !isNaN(v));
    if (values.length > 0) {
      const newArray = values.slice(0, MAX_SIZE).map((v, i) => ({
        id: `custom-${i}-${Date.now()}`,
        value: Math.min(Math.max(v, 1), 100)
      }));
      setArrayType('custom');
      setSize(newArray.length);
      updateArray(newArray);
    }
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value);
    setSize(newSize);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeed(parseInt(e.target.value));
  };

  const stopSorting = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsSorting(false);
  };

  const reset = () => {
    stopSorting();
    setCurrentStep(0);
    if (steps.length > 0) {
      const initialArray = [...steps[0].array];
      setArray(initialArray);
      setSteps([{ array: initialArray, comparing: [], swapping: [], sorted: [] }]);
    }
    setVizKey(prev => prev + 1);
  };

  const startSorting = () => {
    if (isSorting) {
      stopSorting();
      return;
    }

    const currentAlgo = ALGORITHMS[algorithm];
    const newSteps = currentAlgo.fn([...array]);
    setSteps(newSteps);
    setIsSorting(true);

    const interval = Math.max(1, Math.floor(1000 * Math.pow(0.97, speed)));
    let stepIdx = currentStep;

    timerRef.current = setInterval(() => {
      if (stepIdx >= newSteps.length - 1) {
        stopSorting();
        return;
      }
      
      const nextStep = newSteps[stepIdx + 1];
      
      if (nextStep.swapping.length > 0) {
        const swapIdx = nextStep.swapping[0];
        const val = nextStep.array[swapIdx].value;
        playTone(val);
      }

      setArray(nextStep.array);
      setCurrentStep(stepIdx + 1);
      stepIdx++;
    }, interval);
  };

  useEffect(() => {
    return () => stopSorting();
  }, []);

  const currentAlgorithm = ALGORITHMS[algorithm];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Sidebar Controls */}
      <motion.aside 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-3 space-y-6"
      >
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 mb-6">
            <Settings2 className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-black uppercase tracking-widest text-primary/40">Control Center</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Algorithm</label>
              <select 
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
                disabled={isSorting}
                className="w-full bg-accent/30 border-none rounded-2xl p-4 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer disabled:opacity-50"
              >
                {Object.entries(ALGORITHMS).map(([key, info]) => (
                  <option key={key} value={key}>{(info as AlgorithmInfo).name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Data Source</label>
              <div className="grid grid-cols-2 gap-2">
                {(['random', 'reverse'] as const).map((type) => (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={type}
                    onClick={() => setArrayType(type)}
                    disabled={isSorting}
                    className={`text-[10px] font-black uppercase py-3 px-2 rounded-xl transition-all border-2 ${
                      arrayType === type 
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                        : 'bg-white border-accent/50 text-primary/60 hover:border-primary/30'
                    } disabled:opacity-50`}
                  >
                    {type}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Custom Input</label>
              <form onSubmit={handleCustomArraySubmit} className="flex gap-2">
                <input
                  type="text"
                  value={customArray}
                  onChange={(e) => setCustomArray(e.target.value)}
                  placeholder="10, 50, 20..."
                  disabled={isSorting}
                  className="flex-1 bg-accent/30 border-none rounded-xl p-3 text-xs font-bold text-primary placeholder:text-primary/30 focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isSorting || !customArray.trim()}
                  className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  <Database className="w-4 h-4" />
                </motion.button>
              </form>
              <button
                onClick={() => {
                  const demoArray = [
                    { id: 'demo-1', value: 20 }, { id: 'demo-2', value: 80 },
                    { id: 'demo-3', value: 40 }, { id: 'demo-4', value: 100 },
                    { id: 'demo-5', value: 60 }, { id: 'demo-6', value: 10 },
                    { id: 'demo-7', value: 90 }, { id: 'demo-8', value: 30 },
                  ];
                  updateArray(demoArray);
                }}
                disabled={isSorting}
                className="w-full mt-2 py-2 text-[9px] font-black uppercase tracking-widest text-primary/40 hover:text-primary transition-colors disabled:opacity-50"
              >
                Load Demo Set
              </button>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Sound Effects</label>
                <button 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-lg transition-all ${soundEnabled ? 'bg-primary/10 text-primary' : 'bg-accent text-primary/30'}`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Size</label>
                  <span className="text-[10px] font-black text-primary">{size}</span>
                </div>
                <input 
                  type="range" min={MIN_SIZE} max={MAX_SIZE} value={size}
                  onChange={handleSizeChange} disabled={isSorting}
                  className="w-full h-1.5 bg-accent rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Speed</label>
                  <span className="text-[10px] font-black text-primary">{speed}%</span>
                </div>
                <input 
                  type="range" min="1" max="200" value={speed}
                  onChange={handleSpeedChange}
                  className="w-full h-1.5 bg-accent rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startSorting}
                className={`flex items-center justify-center gap-3 py-4 rounded-2xl shadow-xl transition-all font-black uppercase text-xs tracking-widest ${
                  isSorting 
                    ? 'bg-ink text-white shadow-ink/20' 
                    : 'bg-primary text-white shadow-primary/30'
                }`}
              >
                {isSorting ? <Activity className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
                {isSorting ? 'Stop' : 'Start Sorting'}
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={reset}
                className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white border-2 border-accent text-primary font-black uppercase text-xs tracking-widest hover:border-primary/30 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </motion.button>
            </div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-secondary/10 rounded-3xl p-6 border border-secondary/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-secondary" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-secondary">Algorithm Info</h2>
          </div>
          <p className="text-xs leading-relaxed text-primary/80 font-medium italic mb-4">
            {currentAlgorithm.description}
          </p>
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-secondary/10">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-1.5">Time</div>
              <div className="text-sm font-black text-secondary tracking-tight">{currentAlgorithm.timeComplexity}</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-1.5">Space</div>
              <div className="text-sm font-black text-secondary tracking-tight">{currentAlgorithm.spaceComplexity}</div>
            </div>
          </div>
        </motion.div>
      </motion.aside>

      {/* Main Visualization Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-9 space-y-6"
      >
        <div className="bg-white rounded-[2rem] p-8 shadow-2xl shadow-primary/5 border border-primary/5 min-h-[500px] flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/50 rounded-2xl flex items-center justify-center text-primary">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-primary tracking-tight uppercase">Visualizer</h2>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isSorting ? 'bg-amber-500 animate-pulse' : 'bg-success'}`}></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">
                    {isSorting ? 'Processing Algorithm...' : 'System Ready'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 bg-accent/20 px-6 py-3 rounded-2xl border border-accent/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-secondary rounded-md shadow-sm"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Idle</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-md shadow-sm"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Compare</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-ink rounded-md shadow-sm"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Swap</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded-md shadow-sm"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Sorted</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            <div className="flex-1 h-[400px] bg-accent/10 rounded-[1.5rem] relative overflow-hidden border border-accent/20">
              {array.length > 0 ? (
                <svg key={vizKey} width="100%" height="100%" viewBox="0 0 1000 400" preserveAspectRatio="none" className="block">
                  {(() => {
                    const maxVal = Math.max(...array.map(item => item.value), 1);
                    const barWidth = 1000 / array.length;
                    
                    return array.map((item, idx) => {
                      const step = steps[currentStep] || { comparing: [], swapping: [], sorted: [] };
                      const isComparing = step.comparing?.includes(idx);
                      const isSwapping = step.swapping?.includes(idx);
                      const isSorted = step.sorted?.includes(idx);
                      
                      let color = '#8E9DCC'; // Secondary
                      if (isComparing) color = '#7D84B2'; // Primary
                      if (isSwapping) color = '#141414'; // Ink
                      if (isSorted) color = '#DBF4A7'; // Success

                      const h = Math.max((item.value / maxVal) * 360, 10);
                      const x = idx * barWidth;
                      const y = 400 - h;

                      return (
                        <motion.rect
                          layout
                          key={item.id}
                          x={x}
                          y={y}
                          width={Math.max(barWidth - 2, 1)}
                          height={h}
                          fill={color}
                          rx={Math.min(barWidth / 4, 8)}
                          className="transition-colors duration-200"
                        />
                      );
                    });
                  })()}
                </svg>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-primary/20 font-black uppercase tracking-[0.5em]">
                  No Data
                </div>
              )}
            </div>

            {/* ARRAY LEGEND */}
            <div className="bg-accent/20 p-6 rounded-3xl border border-accent/30">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-3 h-3 text-primary/40" />
                <div className="text-[10px] font-black uppercase tracking-widest text-primary/40">Memory State</div>
              </div>
              <div className="font-mono text-[11px] break-all leading-relaxed flex flex-wrap gap-x-2 gap-y-1">
                <span className="text-primary/30">[</span>
                {array.map((item, idx) => {
                  const step = steps[currentStep] || { comparing: [], swapping: [], sorted: [] };
                  const isComparing = step.comparing?.includes(idx);
                  const isSwapping = step.swapping?.includes(idx);
                  const isSorted = step.sorted?.includes(idx);
                  
                  let textColor = 'text-primary/60';
                  let bgColor = 'transparent';
                  if (isComparing) { textColor = 'text-white'; bgColor = 'bg-primary'; }
                  if (isSwapping) { textColor = 'text-white'; bgColor = 'bg-ink'; }
                  if (isSorted) { textColor = 'text-primary'; bgColor = 'bg-success/30'; }

                  return (
                    <span 
                      key={item.id} 
                      className={`px-1.5 py-0.5 rounded-md transition-all duration-200 ${textColor} ${bgColor} font-bold`}
                    >
                      {item.value}{idx < array.length - 1 ? ',' : ''}
                    </span>
                  );
                })}
                <span className="text-primary/30">]</span>
              </div>
            </div>
          </div>
          
          <div className="mt-10 pt-6 border-t border-accent/30 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-accent/30 rounded-full text-[10px] font-black text-primary uppercase tracking-widest">
                Step {currentStep} <span className="opacity-30">/</span> {steps.length - 1}
              </div>
              <div className="text-[10px] font-black text-primary/40 uppercase tracking-widest">
                {Math.round((currentStep / (steps.length - 1 || 1)) * 100)}% Complete
              </div>
            </div>
            
            <div className="flex gap-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={currentStep === 0 || isSorting}
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                className="p-3 bg-white border-2 border-accent rounded-2xl text-primary hover:border-primary/30 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={currentStep === steps.length - 1 || isSorting}
                onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
                className="p-3 bg-white border-2 border-accent rounded-2xl text-primary hover:border-primary/30 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCode(!showCode)}
                className={`p-3 rounded-2xl transition-all border-2 ${
                  showCode 
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-white border-accent text-primary hover:border-primary/30'
                }`}
              >
                <Code2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Code Implementation Window */}
        <AnimatePresence>
          {showCode && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-ink text-accent rounded-[2rem] p-8 shadow-2xl shadow-ink/20 overflow-hidden border border-white/5"
            >
              <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-success">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-white/40">Implementation</h2>
                </div>
                
                <div className="flex items-center gap-10 mr-auto ml-12">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1.5">Time</span>
                    <span className="text-sm font-black text-success tracking-widest">{currentAlgorithm.timeComplexity}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1.5">Space</span>
                    <span className="text-sm font-black text-success tracking-widest">{currentAlgorithm.spaceComplexity}</span>
                  </div>
                </div>

                <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl">
                  <button 
                    onClick={() => setCodeLanguage('js')}
                    className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all ${
                      codeLanguage === 'js' 
                        ? 'bg-white text-ink shadow-lg' 
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    TypeScript
                  </button>
                  <button 
                    onClick={() => setCodeLanguage('py')}
                    className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all ${
                      codeLanguage === 'py' 
                        ? 'bg-white text-ink shadow-lg' 
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Python
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute top-4 right-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                  {codeLanguage === 'js' ? 'ts' : 'py'}
                </div>
                <pre className="font-mono text-[11px] overflow-x-auto leading-relaxed p-6 bg-black/40 rounded-2xl border border-white/5 scrollbar-thin scrollbar-thumb-white/10">
                  <code className="text-accent/90">{codeLanguage === 'js' ? currentAlgorithm.code : currentAlgorithm.pythonCode}</code>
                </pre>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
