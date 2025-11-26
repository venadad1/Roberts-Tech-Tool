import React, { useState, useCallback } from 'react';
import { Character, AspectRatioOption, GenerationSettings, PromptItem, GeneratedImage } from './types';
import { CharacterSlot } from './components/CharacterSlot';
import { Button } from './components/Button';
import { ResultCard } from './components/ResultCard';
import { generateImageFromPrompt } from './services/geminiService';

// Initial State Helpers
const createInitialCharacters = (): Character[] => Array.from({ length: 4 }).map((_, i) => ({
  id: `char-${i + 1}`,
  name: `Character ${i + 1}`,
  imageData: null,
  mimeType: 'image/png',
  isSelected: false,
}));

const getFormattedDate = () => {
  const date = new Date();
  const day = date.toLocaleString('en-GB', { day: '2-digit' });
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  return `${day}${month}${year}`; // 10Nov2025
};

const App: React.FC = () => {
  // State
  const [characters, setCharacters] = useState<Character[]>(createInitialCharacters());
  const [settings, setSettings] = useState<GenerationSettings>({ aspectRatio: AspectRatioOption.Ratio_16_9 });
  const [prompts, setPrompts] = useState<PromptItem[]>([{ id: 'p-1', text: '' }]);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);

  // Handlers - Characters
  const updateCharacter = (id: string, updates: Partial<Character>) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  // Handlers - Prompts
  const addPrompt = () => {
    if (prompts.length < 10) {
      setPrompts(prev => [...prev, { id: `p-${Date.now()}`, text: '' }]);
    }
  };

  const removePrompt = (id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
  };

  const updatePrompt = (id: string, text: string) => {
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, text } : p));
  };

  // Handlers - Generation
  const handleGenerateAll = async () => {
    const validPrompts = prompts.filter(p => p.text.trim() !== '');
    if (validPrompts.length === 0) {
      alert("Please enter at least one prompt.");
      return;
    }

    // Check for API Key availability (handled internally by service but good to check UI state if needed)
    if (!process.env.API_KEY) {
        alert("API Key is missing. Please ensure the environment variable is set.");
        return;
    }

    setIsGenerating(true);
    const dateStr = getFormattedDate();
    
    // Prepare placeholders
    const newResults: GeneratedImage[] = validPrompts.map((p, index) => {
      const seq = String(index + 1).padStart(3, '0');
      return {
        id: `${p.id}-${Date.now()}`,
        promptText: p.text,
        imageUrl: '',
        fileName: `${seq}_${dateStr}.png`,
        status: 'loading'
      };
    });

    setResults(newResults);

    // Process Sequentially (or Parallel with limit, sticking to Parallel for speed with small batch)
    // Note: Gemini has rate limits. Parallel might hit 429s. 
    // Let's do a Promise.all for simplicity, but handling individual errors.
    
    const updatedResults = [...newResults];

    await Promise.all(validPrompts.map(async (promptItem, index) => {
      try {
        const base64Image = await generateImageFromPrompt(promptItem.text, characters, settings);
        updatedResults[index] = {
          ...updatedResults[index],
          imageUrl: base64Image,
          status: 'success'
        };
      } catch (err) {
        console.error(err);
        updatedResults[index] = {
          ...updatedResults[index],
          status: 'error',
          error: 'Failed to generate'
        };
      }
      // Force update to show progress
      setResults([...updatedResults]);
    }));

    setIsGenerating(false);
  };

  const handleRegenerateSingle = async (imageId: string) => {
    if (!process.env.API_KEY) {
        alert("API Key is missing.");
        return;
    }

    const itemIndex = results.findIndex(r => r.id === imageId);
    if (itemIndex === -1) return;
    const item = results[itemIndex];

    // Set individual status to loading
    setResults(prev => {
        const next = [...prev];
        next[itemIndex] = { ...next[itemIndex], status: 'loading', error: undefined };
        return next;
    });

    try {
        // Use current global characters and settings state, so user can tweak settings before regenerating one
        const base64Image = await generateImageFromPrompt(item.promptText, characters, settings);
        setResults(prev => {
            const next = [...prev];
            next[itemIndex] = { 
                ...next[itemIndex], 
                imageUrl: base64Image, 
                status: 'success' 
            };
            return next;
        });
    } catch (err) {
        console.error("Regeneration failed:", err);
        setResults(prev => {
            const next = [...prev];
            next[itemIndex] = { 
                ...next[itemIndex], 
                status: 'error', 
                error: 'Failed to regenerate' 
            };
            return next;
        });
    }
  };

  const downloadAll = () => {
    const successImages = results.filter(r => r.status === 'success');
    successImages.forEach((img, index) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = img.imageUrl;
        a.download = img.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, index * 300); // Stagger downloads
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-full max-h-screen bg-brand-dark text-white font-sans">
      {/* --- LEFT COLUMN: CONTROL PANEL --- */}
      <aside className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 bg-brand-panel border-r border-gray-800 overflow-y-auto z-10 flex flex-col">
        <div className="p-6 space-y-8 pb-24">
            
          {/* Header */}
          <div className="border-b border-gray-700 pb-4">
            <h1 className="text-2xl font-bold text-white">Srdjan's Multiple Character Tool</h1>
            <p className="text-gray-400 text-xs mt-1">Consistent Character Story Creator</p>
          </div>

          {/* 1. Character References */}
          <section>
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center">
              1. Reference Characters
              <span className="ml-2 text-[10px] bg-gray-700 px-1.5 rounded text-gray-300">Upload & Check to use</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {characters.map(char => (
                <CharacterSlot key={char.id} character={char} onUpdate={updateCharacter} />
              ))}
            </div>
          </section>

          {/* 2. Aspect Ratio */}
          <section>
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">2. Aspect Ratio</h2>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(AspectRatioOption).filter(o => o !== AspectRatioOption.Custom).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setSettings(s => ({ ...s, aspectRatio: ratio }))}
                  className={`px-3 py-2 text-sm rounded border ${settings.aspectRatio === ratio ? 'bg-brand-red border-brand-red text-white' : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-400'}`}
                >
                  {ratio}
                </button>
              ))}
              <button
                  onClick={() => setSettings(s => ({ ...s, aspectRatio: AspectRatioOption.Custom }))}
                   className={`px-3 py-2 text-sm rounded border ${settings.aspectRatio === AspectRatioOption.Custom ? 'bg-brand-red border-brand-red text-white' : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-400'}`}
              >
                Custom
              </button>
            </div>
            {settings.aspectRatio === AspectRatioOption.Custom && (
              <input
                type="text"
                placeholder="e.g., 21:9 or 1920x1080"
                value={settings.customAspectRatio || ''}
                onChange={(e) => setSettings(s => ({ ...s, customAspectRatio: e.target.value }))}
                className="mt-2 w-full bg-brand-surface border border-gray-600 rounded p-2 text-sm focus:border-brand-red focus:outline-none"
              />
            )}
          </section>

          {/* 3. Prompt List */}
          <section>
            <div className="flex justify-between items-end mb-3">
              <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">3. Story Prompts</h2>
              <span className="text-xs text-gray-500">{prompts.length} / 10</span>
            </div>
            <div className="space-y-3">
              {prompts.map((prompt, idx) => (
                <div key={prompt.id} className="relative">
                  <span className="absolute left-3 top-2 text-xs text-gray-500 font-mono">#{idx + 1}</span>
                  <textarea
                    value={prompt.text}
                    onChange={(e) => updatePrompt(prompt.id, e.target.value)}
                    className="w-full bg-brand-surface border border-gray-600 rounded p-2 pl-8 text-sm focus:border-brand-red focus:outline-none resize-y min-h-[60px]"
                    placeholder={`Describe scene ${idx + 1}...`}
                  />
                  {prompts.length > 1 && (
                    <button 
                      onClick={() => removePrompt(prompt.id)}
                      className="absolute right-2 top-2 text-gray-500 hover:text-red-500"
                      title="Remove prompt"
                    >
                       &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
            {prompts.length < 10 && (
              <button 
                onClick={addPrompt} 
                className="mt-3 w-full py-2 border border-dashed border-gray-600 text-gray-400 text-sm rounded hover:bg-gray-800 hover:text-gray-200 transition-colors"
              >
                + Add Scene Prompt
              </button>
            )}
          </section>

        </div>

        {/* 4. Sticky Action Footer */}
        <div className="sticky bottom-0 bg-brand-panel p-6 border-t border-gray-700 shadow-2xl">
            <Button 
              variant="primary" 
              className="w-full h-12 text-lg font-bold shadow-red-900/20 shadow-lg" 
              onClick={handleGenerateAll}
              isLoading={isGenerating}
            >
              GENERATE ALL IMAGES
            </Button>
        </div>
      </aside>

      {/* --- RIGHT COLUMN: RESULTS DISPLAY --- */}
      <main className="flex-grow bg-brand-dark overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header / Toolbar */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Generated Storyboard</h2>
              <p className="text-gray-400 text-sm mt-1">
                {results.length > 0 
                  ? `${results.filter(r => r.status === 'success').length} completed` 
                  : 'Ready to generate'}
              </p>
            </div>
            {results.some(r => r.status === 'success') && (
              <Button variant="secondary" onClick={downloadAll}>
                Download All Batch
              </Button>
            )}
          </div>

          {/* Empty State */}
          {results.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed border-gray-800 rounded-xl text-gray-600">
              <svg className="w-16 h-16 mb-4 opacity-20" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <p>Config your story on the left and hit Generate</p>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {results.map((img) => (
              <ResultCard 
                key={img.id} 
                image={img} 
                onPreview={setPreviewImage} 
                onRegenerate={handleRegenerateSingle}
              />
            ))}
          </div>

        </div>
      </main>

      {/* Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-5xl max-h-[90vh] w-full flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center text-white mb-2 px-1">
               <h3 className="font-mono text-sm">{previewImage.fileName}</h3>
               <button onClick={() => setPreviewImage(null)} className="text-white hover:text-red-500 text-2xl">&times;</button>
             </div>
             <div className="bg-brand-dark rounded-lg overflow-hidden shadow-2xl flex items-center justify-center">
                {previewImage.status === 'success' ? (
                  <img src={previewImage.imageUrl} className="max-w-full max-h-[80vh] object-contain" alt="Preview" />
                ) : (
                  <div className="p-10 text-white">Image not available</div>
                )}
             </div>
             <div className="mt-4 bg-brand-panel p-4 rounded border border-gray-700 text-gray-300 text-sm">
               <p className="font-bold text-gray-500 mb-1 uppercase text-xs">Prompt</p>
               {previewImage.promptText}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;