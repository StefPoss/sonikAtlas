import React, { useState } from 'react';
import { Cloud, Zap, Sparkles, Plus, Loader2, Music, Terminal, Ghost, Cpu, Coffee, Activity, Hammer, Wand2 } from 'lucide-react';
import { STYLES, PATCHES } from './data';
import { Patch } from './types';
import PatchView from './components/PatchView';
import { generateCustomPatch } from './services/geminiService';

const App = () => {
  const [selectedPatchId, setSelectedPatchId] = useState<string | null>(null);
  const [customPatch, setCustomPatch] = useState<Patch | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPatch = selectedPatchId 
    ? (PATCHES[selectedPatchId] || (customPatch?.id === selectedPatchId ? customPatch : null)) 
    : null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    if (!process.env.API_KEY) {
      setError("API Key Required.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const newPatch = await generateCustomPatch(prompt);
      setCustomPatch(newPatch);
      setSelectedPatchId(newPatch.id);
      setShowPromptInput(false);
      setPrompt('');
    } catch (err) {
      setError("AI Generation Failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderIcon = (iconName: string) => {
    const className = "w-8 h-8 mb-4";
    switch (iconName) {
      case 'Cloud': return <Cloud className={`${className} text-cyan-400`} />;
      case 'Zap': return <Zap className={`${className} text-purple-400`} />;
      case 'Sparkles': return <Sparkles className={`${className} text-emerald-400`} />;
      case 'Ghost': return <Ghost className={`${className} text-stone-400`} />;
      case 'Cpu': return <Cpu className={`${className} text-blue-500`} />;
      case 'Coffee': return <Coffee className={`${className} text-amber-600`} />;
      case 'Activity': return <Activity className={`${className} text-fuchsia-500`} />;
      case 'Hammer': return <Hammer className={`${className} text-red-500`} />;
      default: return <Music className={`${className} text-stone-400`} />;
    }
  };

  return (
    <div className="min-h-screen text-stone-200 font-sans selection:bg-neon-blue selection:text-black">
      
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-black/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setSelectedPatchId(null)}
          >
            <div className="w-8 h-8 bg-neon-blue rounded-sm shadow-[0_0_10px_rgba(0,240,255,0.5)] flex items-center justify-center">
              <Terminal className="text-black w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white font-mono">SONIK_ATLAS <span className="text-neon-blue animate-pulse">_</span></span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {currentPatch ? (
          <PatchView 
            patch={currentPatch} 
            onBack={() => setSelectedPatchId(null)} 
          />
        ) : (
          <div className="animate-fade-in flex flex-col items-center">
            
            {/* Hero */}
            <div className="text-center mb-16 max-w-4xl pt-10">
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-6 uppercase font-mono leading-none">
                Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-pink">Sounds</span><br/>
                Not Headaches
              </h1>
              <p className="text-xl text-stone-500 max-w-xl mx-auto font-mono">
                Instant procedural recipes for VCV Rack. No noise, just signal.
              </p>
            </div>

            {/* AI Input */}
            <div className="w-full max-w-2xl mb-20 relative">
                 <div className="absolute inset-0 bg-neon-blue/20 blur-3xl opacity-20"></div>
                 <div className="relative bg-stone-900/80 border border-white/10 rounded-lg overflow-hidden backdrop-blur-sm">
                    {!showPromptInput ? (
                        <button 
                            onClick={() => setShowPromptInput(true)}
                            className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <Wand2 className="w-6 h-6 text-neon-pink" />
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white font-mono uppercase">AI Protocol</h3>
                                    <p className="text-sm text-stone-500">Generate custom patch from text input.</p>
                                </div>
                            </div>
                            <Plus className="w-5 h-5 text-stone-500 group-hover:text-neon-pink transition-colors" />
                        </button>
                    ) : (
                        <div className="p-6">
                            <form onSubmit={handleGenerate} className="flex gap-2">
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe sound texture..."
                                    className="flex-1 bg-black border border-stone-700 rounded px-4 py-3 text-white font-mono text-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
                                    autoFocus
                                />
                                <button 
                                    type="submit"
                                    disabled={isGenerating}
                                    className="bg-neon-blue hover:bg-cyan-400 text-black font-bold px-6 py-2 rounded text-sm transition-colors uppercase disabled:opacity-50"
                                >
                                    {isGenerating ? <Loader2 className="animate-spin" /> : 'RUN'}
                                </button>
                            </form>
                            <button onClick={() => setShowPromptInput(false)} className="text-xs text-stone-600 mt-2 hover:text-white">CANCEL</button>
                             {error && <div className="text-red-500 text-xs mt-2 font-mono">{error}</div>}
                        </div>
                    )}
                 </div>
            </div>

            {/* Grid */}
            <div className="w-full">
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-px bg-stone-800 flex-1"></div>
                    <span className="text-xs font-mono text-stone-600 uppercase tracking-[0.2em]">Select Frequency</span>
                    <div className="h-px bg-stone-800 flex-1"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {STYLES.map((style) => (
                    <button
                    key={style.id}
                    onClick={() => setSelectedPatchId(style.patchId)}
                    className="group bg-[#111] hover:bg-stone-900 border border-white/5 hover:border-neon-blue/50 p-6 text-left transition-all duration-300 relative overflow-hidden"
                    >
                        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${style.gradient} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                        <div className="relative z-10">
                            {renderIcon(style.icon)}
                            <h3 className="text-lg font-bold text-white mb-2 font-mono uppercase tracking-wider">{style.name}</h3>
                            <p className="text-stone-500 text-xs leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">{style.description}</p>
                        </div>
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-mono text-neon-blue">LOAD_PATCH &gt;&gt;</span>
                        </div>
                    </button>
                ))}
                </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;