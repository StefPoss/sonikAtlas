import React, { useState, useEffect } from 'react';
import { Patch } from '../types';
import { ArrowLeft, Copy, Check, Cable, Settings, Lightbulb, Box, Play, Square, Volume2, Eye, Info, VolumeX } from 'lucide-react';
import { previewPatchSound, isAudioPlaying } from '../services/audioEngine';
import RackVisualizer from './RackVisualizer';

interface PatchViewProps {
  patch: Patch;
  onBack: () => void;
}

const PatchView: React.FC<PatchViewProps> = ({ patch, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // Sync state if audio stops automatically
    const interval = setInterval(() => {
        setPlaying(isAudioPlaying());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    const text = `PATCH: ${patch.name}\n---\n${patch.description}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleAudio = () => {
     const state = previewPatchSound(patch.id);
     setPlaying(state);
  };

  return (
    <div className="animate-fade-in pb-20 font-sans">
      {/* Navbar */}
      <div className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-md border-b border-white/5 py-4 -mx-4 px-4 md:-mx-8 md:px-8 mb-8 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="group flex items-center text-stone-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full text-sm font-medium border border-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            BACK
          </button>
          
          <div className="flex gap-2">
            <button
                onClick={toggleAudio}
                className={`flex items-center justify-center px-6 py-2 rounded-full text-sm font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] border ${
                    playing 
                    ? 'bg-neon-pink/10 border-neon-pink text-neon-pink animate-pulse' 
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-600'
                }`}
            >
                {playing ? <Volume2 className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                {playing ? "STOP PREVIEW" : "LISTEN"}
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center justify-center px-5 py-2 bg-gradient-to-r from-neon-amber to-orange-600 hover:brightness-110 text-black rounded-full transition-all active:scale-95 text-sm font-bold"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "COPIED" : "COPY RECIPE"}
            </button>
          </div>
      </div>

      {/* Header */}
      <div className="flex flex-col items-start gap-4 mb-10 border-l-4 border-neon-blue pl-6">
        <div className="flex flex-wrap gap-2 mb-1">
           <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest uppercase border ${
              patch.difficulty === 'Beginner' ? 'border-neon-green/30 text-neon-green bg-neon-green/5' :
              patch.difficulty === 'Intermediate' ? 'border-neon-amber/30 text-neon-amber bg-neon-amber/5' :
              'border-neon-pink/30 text-neon-pink bg-neon-pink/5'
            }`}>
              {patch.difficulty}
            </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 leading-none tracking-tighter uppercase font-mono">
          {patch.name}
        </h1>
        <p className="text-xl text-stone-400 max-w-3xl leading-relaxed font-light font-sans">{patch.description}</p>
      </div>

      {/* Visualizer */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-white/80 text-sm font-mono tracking-widest uppercase">
            <Eye className="w-4 h-4 mr-2 text-neon-blue" />
            System Visualization
          </div>
        </div>
        <div className="p-1 bg-stone-800 rounded-sm shadow-2xl ring-1 ring-white/10">
            <div className="rounded-sm overflow-hidden bg-black">
                <RackVisualizer patch={patch} />
            </div>
        </div>
      </section>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Modules & Settings */}
        <div className="lg:col-span-5 space-y-8">
          <section className="bg-bg-panel border border-white/5 p-6 shadow-lg crt relative overflow-hidden">
            <div className="flex items-center mb-6 text-stone-200 border-b border-white/5 pb-2">
              <Box className="w-5 h-5 mr-3 text-neon-blue" />
              <h2 className="text-lg font-bold font-mono uppercase tracking-widest">Modules</h2>
            </div>
            <div className="space-y-2 font-mono text-sm">
              {patch.modules.map((mod, idx) => (
                <div key={idx} className="flex items-center justify-between bg-black/40 p-3 border-l-2 border-stone-700 hover:border-neon-blue transition-colors">
                  <span className="font-bold text-stone-300">{mod.name}</span>
                  <span className="text-[10px] text-stone-500 uppercase">{mod.type}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-bg-panel border border-white/5 p-6 shadow-lg">
            <div className="flex items-center mb-6 text-stone-200 border-b border-white/5 pb-2">
              <Settings className="w-5 h-5 mr-3 text-neon-amber" />
              <h2 className="text-lg font-bold font-mono uppercase tracking-widest">Parameters</h2>
            </div>
            <div className="space-y-0 divider-y divide-white/5">
              {patch.settings.map((set, idx) => (
                <div key={idx} className="flex justify-between items-center py-3 border-b border-white/5 font-mono text-xs">
                  <div className="text-stone-400">
                    <span className="text-neon-blue/80">{set.module}</span>
                    <span className="mx-1 text-stone-600">::</span>
                    {set.parameter}
                  </div>
                  <div className="text-neon-amber font-bold bg-neon-amber/10 px-2 py-0.5 rounded">
                    {set.value}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Connections & Tips */}
        <div className="lg:col-span-7 space-y-8">
          <section className="bg-[#111] border border-stone-800 p-6 shadow-lg relative">
            <div className="absolute top-0 right-0 p-2 opacity-20"><Cable size={100} /></div>
            <div className="flex items-center mb-6 text-stone-200 border-b border-white/5 pb-2 relative z-10">
              <Cable className="w-5 h-5 mr-3 text-neon-pink" />
              <h2 className="text-lg font-bold font-mono uppercase tracking-widest">Patching Map</h2>
            </div>

            <div className="space-y-3 relative z-10 font-mono text-xs">
              {patch.connections.map((conn, idx) => (
                <div key={idx} className="group flex items-center justify-between bg-stone-900/50 p-3 border border-white/5 hover:border-neon-pink/50 transition-colors">
                   <div className="flex items-center text-stone-300">
                      <span className="w-2 h-2 rounded-full bg-stone-600 mr-3 group-hover:bg-neon-pink transition-colors"></span>
                      {conn.from}
                   </div>
                   <div className="text-stone-600 px-2">➜</div>
                   <div className="text-neon-pink font-bold">{conn.to}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gradient-to-br from-stone-900 to-black p-6 border border-neon-green/20 shadow-[0_0_20px_rgba(10,255,0,0.05)]">
            <div className="flex items-center mb-4 text-neon-green">
              <Lightbulb className="w-5 h-5 mr-3" />
              <h2 className="text-lg font-bold font-mono uppercase tracking-widest">Pro Tips</h2>
            </div>
            <div className="grid gap-3">
              {patch.tips.map((tip, idx) => (
                <div key={idx} className="flex gap-3 text-sm text-stone-400 font-sans leading-relaxed border-l-2 border-neon-green/30 pl-3">
                   <span className="text-neon-green/50 font-mono">0{idx + 1}</span>
                   {tip}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PatchView;