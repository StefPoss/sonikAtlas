import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Patch, ModuleItem } from '../types';

interface RackVisualizerProps {
  patch: Patch;
}

// --- Visual Types ---
interface VisualPort {
  id: string; 
  label: string; 
  type: 'in' | 'out';
}

interface VisualKnob {
  label: string;
  value: string;
}

type ModuleTheme = 'fundamental' | 'audible' | 'befaco' | 'dark' | 'gold' | 'noise';

interface VisualModule {
  id: string;
  def: ModuleItem;
  width: number;
  inputs: VisualPort[];
  outputs: VisualPort[];
  knobs: VisualKnob[];
  theme: ModuleTheme;
}

// --- Module Templates (The "Library") ---
const MODULE_TEMPLATES: Record<string, Partial<VisualModule>> = {
  // --- Fundamental ---
  'vco': {
    width: 135,
    theme: 'fundamental',
    knobs: [{label: 'FREQ', value: '50%'}, {label: 'FINE', value: '50%'}, {label: 'PW', value: '50%'}, {label: 'FM', value: '0%'}],
    inputs: [{id: 'fm', label: 'FM', type: 'in'}, {id: 'sync', label: 'SYNC', type: 'in'}, {id: 'pw', label: 'PW', type: 'in'}, {id: 'voct', label: 'V/OCT', type: 'in'}],
    outputs: [{id: 'sin', label: 'SIN', type: 'out'}, {id: 'tri', label: 'TRI', type: 'out'}, {id: 'saw', label: 'SAW', type: 'out'}, {id: 'sqr', label: 'SQR', type: 'out'}]
  },
  'vcf': {
    width: 105,
    theme: 'fundamental',
    knobs: [{label: 'FREQ', value: '50%'}, {label: 'RES', value: '0%'}, {label: 'DRIVE', value: '0%'}, {label: 'FM', value: '0%'}],
    inputs: [{id: 'in', label: 'IN', type: 'in'}, {id: 'fm', label: 'FM', type: 'in'}, {id: 'res', label: 'RES', type: 'in'}, {id: 'voct', label: 'V/OCT', type: 'in'}],
    outputs: [{id: 'lpf', label: 'LPF', type: 'out'}, {id: 'hpf', label: 'HPF', type: 'out'}]
  },
  'vca': {
    width: 75,
    theme: 'fundamental',
    knobs: [{label: 'LEVEL', value: '50%'}, {label: 'CV', value: '50%'}],
    inputs: [{id: 'in', label: 'IN', type: 'in'}, {id: 'cv', label: 'CV', type: 'in'}],
    outputs: [{id: 'out', label: 'OUT', type: 'out'}]
  },
  'lfo': {
    width: 90,
    theme: 'fundamental',
    knobs: [{label: 'FREQ', value: '50%'}, {label: 'FM', value: '0%'}, {label: 'OFFSET', value: '0%'}],
    inputs: [{id: 'fm', label: 'FM', type: 'in'}, {id: 'reset', label: 'RST', type: 'in'}],
    outputs: [{id: 'sin', label: 'SIN', type: 'out'}, {id: 'saw', label: 'SAW', type: 'out'}, {id: 'sqr', label: 'SQR', type: 'out'}, {id: 'tri', label: 'TRI', type: 'out'}]
  },
  'mixer': {
    width: 150,
    theme: 'fundamental',
    knobs: [{label: 'CH1', value: '50%'}, {label: 'CH2', value: '50%'}, {label: 'CH3', value: '50%'}, {label: 'CH4', value: '50%'}],
    inputs: [{id: 'in1', label: 'IN1', type: 'in'}, {id: 'in2', label: 'IN2', type: 'in'}, {id: 'in3', label: 'IN3', type: 'in'}, {id: 'in4', label: 'IN4', type: 'in'}],
    outputs: [{id: 'mix', label: 'MIX', type: 'out'}, {id: 'aux', label: 'AUX', type: 'out'}]
  },
  'audio output': {
    width: 90,
    theme: 'fundamental',
    knobs: [{label: 'LEVEL', value: '75%'}],
    inputs: [{id: 'l', label: 'L', type: 'in'}, {id: 'r', label: 'R', type: 'in'}],
    outputs: []
  },
  
  // --- Audible (Mutable) ---
  'macro oscillator 2': { 
    width: 180,
    theme: 'audible',
    knobs: [{label: 'FREQ', value: '50%'}, {label: 'HARMO', value: '50%'}, {label: 'TIMBRE', value: '50%'}, {label: 'MORPH', value: '50%'}, {label: 'LPG', value: '50%'}],
    inputs: [{id: 'model', label: 'Model', type: 'in'}, {id: 'voct', label: 'V/Oct', type: 'in'}, {id: 'trig', label: 'Trig', type: 'in'}, {id: 'level', label: 'Level', type: 'in'}, {id: 'harmo', label: 'Harmo', type: 'in'}, {id: 'timbre', label: 'Timbre', type: 'in'}, {id: 'morph', label: 'Morph', type: 'in'}],
    outputs: [{id: 'out', label: 'Out', type: 'out'}, {id: 'aux', label: 'Aux', type: 'out'}]
  },
  'resonator': { 
    width: 210,
    theme: 'audible',
    knobs: [{label: 'FREQ', value: '50%'}, {label: 'STRUCT', value: '25%'}, {label: 'BRIGHT', value: '75%'}, {label: 'DAMP', value: '50%'}, {label: 'POS', value: '25%'}],
    inputs: [{id: 'strum', label: 'Strum', type: 'in'}, {id: 'voct', label: 'V/Oct', type: 'in'}, {id: 'struct', label: 'Struct', type: 'in'}, {id: 'bright', label: 'Bright', type: 'in'}, {id: 'damp', label: 'Damp', type: 'in'}, {id: 'in', label: 'In', type: 'in'}],
    outputs: [{id: 'odd', label: 'Odd', type: 'out'}, {id: 'even', label: 'Even', type: 'out'}]
  },
  'random sampler': { 
    width: 270,
    theme: 'audible',
    knobs: [{label: 'DEJA', value: '50%'}, {label: 'RATE', value: '50%'}, {label: 'BIAS', value: '50%'}, {label: 'SPREAD', value: '50%'}, {label: 'JITTER', value: '20%'}],
    inputs: [{id: 'clock', label: 'Clock', type: 'in'}, {id: 't_bias', label: 'T_Bias', type: 'in'}, {id: 'x_spread', label: 'X_Spr', type: 'in'}],
    outputs: [{id: 't1', label: 't1', type: 'out'}, {id: 't2', label: 't2', type: 'out'}, {id: 't3', label: 't3', type: 'out'}, {id: 'x1', label: 'X1', type: 'out'}, {id: 'x2', label: 'X2', type: 'out'}, {id: 'x3', label: 'X3', type: 'out'}, {id: 'y', label: 'Y', type: 'out'}]
  },
  
  // --- Dark/Tech ---
  'sequencer': {
    width: 240,
    theme: 'dark',
    knobs: [{label: 'CLOCK', value: '50%'}, {label: 'STEPS', value: '16'}, {label: 'GATE', value: '50%'}],
    inputs: [{id: 'clock', label: 'CLK', type: 'in'}, {id: 'reset', label: 'RST', type: 'in'}],
    outputs: [{id: 'cv', label: 'CV', type: 'out'}, {id: 'gate', label: 'GATE', type: 'out'}]
  },
  'clock': {
    width: 90,
    theme: 'dark',
    knobs: [{label: 'BPM', value: '120'}, {label: 'PW', value: '50%'}],
    inputs: [{id: 'run', label: 'RUN', type: 'in'}],
    outputs: [{id: 'out', label: 'CLK', type: 'out'}, {id: 'reset', label: 'RST', type: 'out'}]
  },
  'reverb': {
    width: 150,
    theme: 'gold', 
    knobs: [{label: 'SIZE', value: '50%'}, {label: 'DECAY', value: '50%'}, {label: 'DIFF', value: '50%'}, {label: 'DRY/WET', value: '50%'}],
    inputs: [{id: 'in_l', label: 'IN L', type: 'in'}, {id: 'in_r', label: 'IN R', type: 'in'}, {id: 'decay', label: 'DECAY', type: 'in'}],
    outputs: [{id: 'out_l', label: 'OUT L', type: 'out'}, {id: 'out_r', label: 'OUT R', type: 'out'}]
  },
  'delay': {
    width: 120,
    theme: 'gold',
    knobs: [{label: 'TIME', value: '50%'}, {label: 'FDBK', value: '50%'}, {label: 'COLOR', value: '50%'}, {label: 'MIX', value: '50%'}],
    inputs: [{id: 'in', label: 'IN', type: 'in'}, {id: 'time', label: 'TIME', type: 'in'}, {id: 'fdbk', label: 'FDBK', type: 'in'}],
    outputs: [{id: 'out', label: 'OUT', type: 'out'}]
  },
  'noise': {
    width: 75,
    theme: 'noise',
    knobs: [],
    inputs: [],
    outputs: [{id: 'white', label: 'WHT', type: 'out'}, {id: 'pink', label: 'PNK', type: 'out'}, {id: 'red', label: 'RED', type: 'out'}]
  },
  's&h': {
      width: 75,
      theme: 'fundamental',
      knobs: [],
      inputs: [{id: 'in', label: 'IN', type: 'in'}, {id: 'trig', label: 'TRIG', type: 'in'}],
      outputs: [{id: 'out', label: 'OUT', type: 'out'}]
  },
  'attenuverter': {
      width: 75,
      theme: 'fundamental',
      knobs: [{label: 'GAIN', value: '0%'}],
      inputs: [{id: 'in', label: 'IN', type: 'in'}],
      outputs: [{id: 'out', label: 'OUT', type: 'out'}]
  },
  'kick': {
      width: 90,
      theme: 'befaco',
      knobs: [{label: 'TUNE', value: '50%'}, {label: 'DECAY', value: '50%'}, {label: 'CLICK', value: '50%'}],
      inputs: [{id: 'trig', label: 'TRIG', type: 'in'}, {id: 'voct', label: 'V/OCT', type: 'in'}],
      outputs: [{id: 'out', label: 'OUT', type: 'out'}]
  }
};

const THEMES = {
  fundamental: {
    bg: 'bg-stone-300 border-l border-white/50 border-r border-stone-400',
    text: 'text-stone-800 font-sans tracking-tight',
    knob: 'black',
    screw: 'silver',
    jack: 'silver',
  },
  audible: {
    bg: 'bg-[#e0dbc9] border-l border-[#f0ede0] border-r border-[#c0bba9]',
    text: 'text-[#6d7a78] font-serif italic',
    knob: 'roggan',
    screw: 'gold',
    jack: 'gold',
  },
  dark: {
    bg: 'bg-zinc-900 border-l border-zinc-700 border-r border-black',
    text: 'text-zinc-300 font-mono text-[9px]',
    knob: 'silver',
    screw: 'black',
    jack: 'silver',
  },
  befaco: {
    bg: 'bg-[#a31621] border-l border-[#d62828] border-r border-[#6a040f]',
    text: 'text-white font-sans font-bold',
    knob: 'black',
    screw: 'black',
    jack: 'black',
  },
  gold: {
    bg: 'bg-stone-900 border-l border-amber-900 border-r border-black',
    text: 'text-amber-500 font-mono',
    knob: 'gold',
    screw: 'gold',
    jack: 'gold',
  },
  noise: {
      bg: 'bg-neutral-400',
      text: 'text-black font-bold',
      knob: 'black',
      screw: 'silver',
      jack: 'black',
  }
};

const CABLE_COLORS = ['#ff2a6d', '#05d9e8', '#d1f7ff', '#7700a6', '#005678'];

// --- Subcomponents ---

const Screw = ({ color }: { color: string }) => {
    const fill = color === 'gold' ? 'url(#grad-gold)' : (color === 'black' ? '#111' : 'url(#grad-silver)');
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" className="opacity-90 drop-shadow-sm">
            <circle cx="7" cy="7" r="6" fill={fill} stroke="rgba(0,0,0,0.5)" strokeWidth="0.5" />
            <path d="M7 2 L7 12 M2 7 L12 7" stroke={color === 'black' ? '#333' : '#666'} strokeWidth="1.5" transform="rotate(45 7 7)" />
        </svg>
    );
}

const Port = ({ label, color, id, setRef }: any) => {
    const isGold = color === 'gold';
    const isBlack = color === 'black';
    const ringColor = isGold ? '#b45309' : (isBlack ? '#404040' : '#a8a29e');
    const hexFill = isGold ? 'url(#grad-gold)' : (isBlack ? '#171717' : 'url(#grad-silver)');
    
    return (
        <div className="flex flex-col items-center group z-10">
            <div className="relative w-10 h-10 flex items-center justify-center">
                {/* Hex Nut */}
                <svg width="32" height="32" viewBox="0 0 32 32" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md">
                    <path d="M16 2 L28 9 V23 L16 30 L4 23 V9 Z" fill={hexFill} stroke="rgba(0,0,0,0.3)" strokeWidth="1"/>
                </svg>
                {/* Jack Hole */}
                <div 
                    ref={setRef}
                    className="w-3.5 h-3.5 bg-[#050505] rounded-full z-10 shadow-[inset_0_2px_4px_rgba(0,0,0,1)] border border-white/5"
                ></div>
            </div>
            {label && (
                <span className="text-[8px] uppercase font-bold tracking-tight opacity-90 -mt-1 px-1 bg-black/20 rounded blur-[0.3px] group-hover:blur-0 transition-all">
                    {label}
                </span>
            )}
        </div>
    );
};

const Knob = ({ type, value, label }: any) => {
    // Generate deterministic rotation
    let percent = 0.5;
    if (value.includes('%')) percent = parseInt(value) / 100;
    else if (value.toLowerCase().includes('low')) percent = 0.2;
    else if (value.toLowerCase().includes('high')) percent = 0.8;
    else {
        const sum = value.split('').reduce((a:any,b:any) => a + b.charCodeAt(0), 0);
        percent = (sum % 100) / 100;
    }
    const rot = (percent * 270) - 135; 

    const isRoggan = type === 'roggan'; // Mutable style
    const isGold = type === 'gold';
    
    return (
        <div className="flex flex-col items-center mb-2">
            <div className={`relative ${isRoggan ? 'w-10 h-10' : 'w-11 h-11'} rounded-full transition-transform duration-700 ease-out drop-shadow-xl`} style={{ transform: `rotate(${rot}deg)` }}>
                {isRoggan ? (
                     // Roggan / Mutable Knob
                    <div className="w-full h-full rounded-full bg-stone-200 border-b-4 border-stone-400 shadow-inner">
                         <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-4 bg-teal-800 rounded-full opacity-90"></div>
                    </div>
                ) : isGold ? (
                    // Gold / Valley Knob
                    <div className="w-full h-full rounded-full bg-[url(#grad-gold)] bg-amber-500 border border-amber-700 shadow-[inset_0_2px_5px_rgba(255,255,255,0.4)]">
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-4 bg-black/80 rounded-full"></div>
                    </div>
                ) : (
                    // Standard / Fundamental / Black
                    <div className={`w-full h-full rounded-full ${type === 'black' ? 'bg-[#222]' : 'bg-[#ddd]'} border border-black/20 shadow-[0_4px_6px_rgba(0,0,0,0.4),inset_0_2px_3px_rgba(255,255,255,0.1)]`}>
                        <div className={`absolute top-1 left-1/2 -translate-x-1/2 w-1 h-4 ${type === 'black' ? 'bg-white' : 'bg-black'} rounded-sm`}></div>
                        {/* Knurls */}
                        <div className="absolute inset-0 border-2 border-dashed border-black/10 rounded-full opacity-50"></div>
                    </div>
                )}
            </div>
            <span className="text-[9px] font-mono mt-1 opacity-80 max-w-[46px] truncate text-center leading-none">{label}</span>
        </div>
    );
};

const RackVisualizer: React.FC<RackVisualizerProps> = ({ patch }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [modules, setModules] = useState<VisualModule[]>([]);
  const [cables, setCables] = useState<{ path: string; color: string }[]>([]);
  const portRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const newModules: VisualModule[] = patch.modules.map((modItem) => {
      const key = Object.keys(MODULE_TEMPLATES).find(k => 
        modItem.name.toLowerCase().includes(k) || modItem.type.toLowerCase().includes(k)
      );
      const t = key ? MODULE_TEMPLATES[key] : null;

      let inputs = t?.inputs ? [...t.inputs] : [];
      let outputs = t?.outputs ? [...t.outputs] : [];
      let knobs = t?.knobs ? [...t.knobs] : [];
      
      const themeName = t?.theme || (modItem.name.includes('Kick') ? 'befaco' : 'fundamental');
      const width = t?.width || 120;

      // Fallback inference
      if (!t) {
          patch.connections.forEach(c => {
              if (c.from.includes(modItem.name)) {
                   const l = c.from.split('[')[1]?.replace(']', '') || 'OUT';
                   if (!outputs.find(p => p.label === l)) outputs.push({id: l.toLowerCase(), label: l, type:'out'});
              }
              if (c.to.includes(modItem.name)) {
                   const l = c.to.split('[')[1]?.replace(']', '') || 'IN';
                   if (!inputs.find(p => p.label === l)) inputs.push({id: l.toLowerCase(), label: l, type:'in'});
              }
          });
      }

      // Map values
      patch.settings.forEach(s => {
          if (s.module === modItem.name) {
             const k = knobs.find(k => s.parameter.toUpperCase().includes(k.label) || k.label.includes(s.parameter.toUpperCase()));
             if (k) k.value = s.value;
          }
      });

      return {
          id: modItem.name,
          def: modItem,
          width,
          inputs: inputs.map(p => ({...p, id: `${modItem.name}-${p.id}`.replace(/\s/g,'')})),
          outputs: outputs.map(p => ({...p, id: `${modItem.name}-${p.id}`.replace(/\s/g,'')})),
          knobs,
          theme: themeName as ModuleTheme
      };
    });
    setModules(newModules);
  }, [patch]);

  useLayoutEffect(() => {
    const calc = () => {
        if (!containerRef.current) return;
        const rootRect = containerRef.current.getBoundingClientRect();
        const paths: any[] = [];

        patch.connections.forEach((conn, i) => {
            const mFrom = modules.find(m => conn.from.includes(m.id));
            const mTo = modules.find(m => conn.to.includes(m.id));
            if (!mFrom || !mTo) return;

            // Simple fuzzy finder
            const findP = (mod:VisualModule, ps:VisualPort[], str:string) => {
                const target = str.split('[')[1]?.replace(']', '').toLowerCase() || '';
                return ps.find(p => p.label.toLowerCase().includes(target)) || ps[0];
            };

            const pOut = findP(mFrom, mFrom.outputs, conn.from);
            const pIn = findP(mTo, mTo.inputs, conn.to);

            if (pOut && pIn) {
                const el1 = portRefs.current[pOut.id];
                const el2 = portRefs.current[pIn.id];
                if (el1 && el2) {
                    const r1 = el1.getBoundingClientRect();
                    const r2 = el2.getBoundingClientRect();
                    const x1 = r1.left + r1.width/2 - rootRect.left + containerRef.current!.scrollLeft;
                    const y1 = r1.top + r1.height/2 - rootRect.top;
                    const x2 = r2.left + r2.width/2 - rootRect.left + containerRef.current!.scrollLeft;
                    const y2 = r2.top + r2.height/2 - rootRect.top;

                    // Slack calculation
                    const dist = Math.hypot(x2-x1, y2-y1);
                    const sag = Math.min(200, dist * 0.6);
                    const path = `M ${x1} ${y1} C ${x1} ${y1 + sag}, ${x2} ${y2 + sag}, ${x2} ${y2}`;
                    paths.push({ path, color: CABLE_COLORS[i % CABLE_COLORS.length] });
                }
            }
        });
        setCables(paths);
    };
    // Double pass for layout stability
    setTimeout(calc, 50);
    setTimeout(calc, 500);
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [modules, patch]);

  return (
    <div className="relative bg-[#050505] border-y-8 border-[#1a1a1a] shadow-2xl rounded-sm overflow-hidden select-none">
       {/* Global Gradients */}
       <svg width="0" height="0">
          <defs>
             <linearGradient id="grad-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e0e0e0" />
                <stop offset="50%" stopColor="#909090" />
                <stop offset="100%" stopColor="#505050" />
             </linearGradient>
             <linearGradient id="grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="50%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
             </linearGradient>
          </defs>
       </svg>

       {/* Rails */}
       <div className="absolute top-0 w-full h-2.5 bg-[#262626] border-b border-black z-20 shadow-md"></div>
       <div className="absolute bottom-0 w-full h-2.5 bg-[#262626] border-t border-black z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.5)]"></div>

       <div ref={containerRef} className="flex overflow-x-auto py-6 px-4 min-h-[420px] bg-[#0a0a0a] relative scrollbar-hide">
            {/* Cable Layer */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 overflow-visible filter drop-shadow-md">
                {cables.map((c, i) => (
                    <g key={i}>
                        <path d={c.path} stroke={c.color} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.9" />
                        <path d={c.path} stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" transform="translate(-1,-1)" />
                    </g>
                ))}
            </svg>

            {modules.map(mod => {
                const t = THEMES[mod.theme];
                return (
                    <div key={mod.id} style={{width: mod.width}} className={`flex-shrink-0 mx-[1px] h-[380px] flex flex-col relative ${t.bg} ${t.text} shadow-xl`}>
                        {/* Screws */}
                        <div className="absolute top-1 left-2"><Screw color={t.screw} /></div>
                        <div className="absolute top-1 right-2"><Screw color={t.screw} /></div>
                        <div className="absolute bottom-1 left-2"><Screw color={t.screw} /></div>
                        <div className="absolute bottom-1 right-2"><Screw color={t.screw} /></div>
                        
                        {/* Panel Name */}
                        <div className="mt-6 mb-4 text-center px-1">
                            <h3 className="uppercase text-[10px] leading-3 opacity-90">{mod.def.name.split('(')[0]}</h3>
                        </div>

                        {/* Knobs */}
                        <div className="flex-1 grid grid-cols-2 gap-2 content-start px-2 justify-items-center">
                            {mod.knobs.map((k,i) => <Knob key={i} label={k.label} value={k.value} type={t.knob} />)}
                        </div>

                        {/* Ports */}
                        <div className="mt-auto pt-2 pb-4 px-1 bg-black/5">
                            <div className="flex flex-wrap justify-center gap-2 mb-2">
                                {mod.inputs.map(p => <Port key={p.id} label={p.label} id={p.id} setRef={(el:any) => portRefs.current[p.id] = el} color={t.jack} />)}
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 border-t border-black/10 pt-2">
                                {mod.outputs.map(p => <Port key={p.id} label={p.label} id={p.id} setRef={(el:any) => portRefs.current[p.id] = el} color={t.jack} />)}
                            </div>
                        </div>
                    </div>
                );
            })}
       </div>
    </div>
  );
};

export default RackVisualizer;