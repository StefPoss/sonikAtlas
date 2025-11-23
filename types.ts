export interface ModuleItem {
  name: string;
  type: string; // e.g., "Oscillator", "Filter", "Sequencer"
  description?: string;
}

export interface Connection {
  from: string; // e.g., "VCO-1 [Sine]"
  to: string;   // e.g., "VCF [Input]"
  note?: string; // Optional context
}

export interface Setting {
  module: string;
  parameter: string;
  value: string;
  description?: string;
}

export interface Patch {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  modules: ModuleItem[];
  connections: Connection[];
  settings: Setting[];
  tips: string[];
}

export interface Style {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name representation
  patchId: string;
  gradient: string;
}