import React, { useRef } from 'react';
import { Character } from '../types';
import { Button } from './Button';

interface CharacterSlotProps {
  character: Character;
  onUpdate: (id: string, updates: Partial<Character>) => void;
}

export const CharacterSlot: React.FC<CharacterSlotProps> = ({ character, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Strip prefix for storage if needed, but here we keep it for preview easily and strip in service
        const rawBase64 = base64String.split(',')[1];
        onUpdate(character.id, { 
          imageData: rawBase64, 
          mimeType: file.type,
          isSelected: true 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSelection = () => {
    if (character.imageData) {
      onUpdate(character.id, { isSelected: !character.isSelected });
    }
  };

  return (
    <div className={`p-3 rounded-lg border border-gray-700 bg-brand-surface flex flex-col gap-2 ${character.isSelected ? 'ring-1 ring-brand-red' : ''}`}>
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={character.name}
          onChange={(e) => onUpdate(character.id, { name: e.target.value })}
          className="bg-transparent border-b border-gray-600 text-sm font-semibold text-white focus:border-brand-red focus:outline-none w-24"
          placeholder="Name..."
        />
        <input 
          type="checkbox" 
          checked={character.isSelected}
          onChange={toggleSelection}
          disabled={!character.imageData}
          className="w-4 h-4 accent-brand-red rounded cursor-pointer disabled:opacity-30"
        />
      </div>

      <div className="relative aspect-square bg-brand-dark rounded-md overflow-hidden border border-dashed border-gray-600 flex items-center justify-center group">
        {character.imageData ? (
          <img 
            src={`data:${character.mimeType};base64,${character.imageData}`} 
            alt={character.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-500 text-xs text-center px-1">No Ref</span>
        )}
        
        <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="text-xs bg-white text-black px-2 py-1 rounded hover:bg-gray-200"
           >
             {character.imageData ? 'Replace' : 'Upload'}
           </button>
           {character.imageData && (
             <button 
               onClick={() => onUpdate(character.id, { imageData: null, isSelected: false })}
               className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
             >
               Clear
             </button>
           )}
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};
