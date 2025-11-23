import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { Patch } from '../types';

// The schema ensures Gemini returns a valid Patch object structure
const patchSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    modules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ['name', 'type']
      }
    },
    connections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          from: { type: Type.STRING },
          to: { type: Type.STRING },
          note: { type: Type.STRING },
        },
        required: ['from', 'to']
      }
    },
    settings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          module: { type: Type.STRING },
          parameter: { type: Type.STRING },
          value: { type: Type.STRING },
        },
        required: ['module', 'parameter', 'value']
      }
    },
    tips: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ['name', 'modules', 'connections', 'settings', 'tips']
};

export const generateCustomPatch = async (userPrompt: string): Promise<Patch> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set REACT_APP_GEMINI_API_KEY or similar.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a VCV Rack patch recipe based on this request: "${userPrompt}". 
      Keep it compatible with standard VCV Rack Free modules or very popular free plugins (like Mutable Instruments/Audible Instruments).
      Be precise with connection points.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: patchSchema,
        temperature: 0.7, // Creative but structured
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from AI");

    const patchData = JSON.parse(jsonText) as Patch;
    // Ensure ID is unique-ish for the frontend
    patchData.id = `custom_${Date.now()}`;
    
    return patchData;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

/**
 * Generates an audio preview of the patch using TTS to describe/simulate the sound.
 * Note: TTS models speak, they don't natively generate music files, but we can use them 
 * to vocalize or describe the texture vividly.
 */
export const generateAudioPreview = async (patchName: string, description: string): Promise<AudioBuffer> => {
    if (!process.env.API_KEY) {
      throw new Error("API Key required for audio generation");
    }
  
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
    // We ask the model to "perform" the sound description or describe it rhythmically
    const prompt = `
      You are a music synthesizer expert.
      Verbally demonstrate and describe the sound of this VCV Rack patch: "${patchName}".
      Description: "${description}".
      
      First, describe the texture (e.g., "A deep, rumbling sub-bass...").
      Then, try to vocalize the rhythm or timbre briefly (e.g., "Boots-cats-boots-cats" or "Whooooosh...").
      Keep it under 15 seconds. Make it sound enthusiastic and immersive.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
  
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!base64Audio) {
        throw new Error("No audio data returned");
      }
  
      // Browser Audio Decoding
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        audioContext,
        24000,
        1
      );
  
      return audioBuffer;
  
    } catch (error) {
      console.error("Audio Generation Error:", error);
      throw error;
    }
  };
  
  // Helper: Decode Base64 to Uint8Array
  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  
  // Helper: Decode raw PCM/Audio data into AudioBuffer
  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1,
  ): Promise<AudioBuffer> {
      // Create a temporary buffer to decode
      // Since the API returns raw PCM or encoded audio, usually Web Audio API's decodeAudioData 
      // is robust enough if headers are present, but for raw PCM we might need manual handling.
      // However, Gemini TTS output usually works with decodeAudioData if it wraps a standard container 
      // or if we treat it as raw. The specific Gemini TTS examples often suggest standard decoding.
      
      // Attempt standard decoding first (works if API sends WAV/MP3 container)
      try {
          return await ctx.decodeAudioData(data.buffer.slice(0));
      } catch (e) {
         // If raw PCM (fallback):
         const dataInt16 = new Int16Array(data.buffer);
         const frameCount = dataInt16.length;
         const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
         const channelData = buffer.getChannelData(0);
         for (let i = 0; i < frameCount; i++) {
             channelData[i] = dataInt16[i] / 32768.0;
         }
         return buffer;
      }
  }