import React from 'react';
import { GeneratedImage } from '../types';
import { Button } from './Button';

interface ResultCardProps {
  image: GeneratedImage;
  onPreview: (image: GeneratedImage) => void;
  onRegenerate: (id: string) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ image, onPreview, onRegenerate }) => {
  const handleDownload = () => {
    if (!image.imageUrl) return;
    const a = document.createElement('a');
    a.href = image.imageUrl;
    a.download = image.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-brand-surface rounded-lg overflow-hidden border border-gray-700 shadow-lg flex flex-col">
      <div className="relative aspect-video bg-black group">
        {image.status === 'loading' ? (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : image.status === 'error' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-4 text-center text-sm gap-2">
             <span>Error Generating Image</span>
             <button 
               onClick={() => onRegenerate(image.id)}
               className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded border border-gray-600 flex items-center gap-1 transition-colors"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
               Retry
             </button>
          </div>
        ) : (
          <>
            <img 
              src={image.imageUrl} 
              alt={image.promptText} 
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => onPreview(image)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button variant="secondary" onClick={() => onPreview(image)} className="text-xs scale-90 mr-2">View</Button>
                <Button variant="primary" onClick={handleDownload} className="text-xs scale-90">Save</Button>
            </div>
          </>
        )}
      </div>
      <div className="p-3 flex flex-col flex-grow justify-between bg-brand-panel">
        <p className="text-xs text-gray-400 line-clamp-2 mb-2" title={image.promptText}>
          {image.promptText}
        </p>
        <div className="flex justify-between items-center mt-auto">
            <span className="text-[10px] text-gray-500 font-mono truncate max-w-[120px]" title={image.fileName}>{image.fileName}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onRegenerate(image.id)} 
                disabled={image.status === 'loading'}
                className="text-gray-500 hover:text-brand-red transition-colors p-1" 
                title="Regenerate this image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              {image.status === 'success' && (
                <button onClick={handleDownload} className="text-gray-500 hover:text-white transition-colors p-1" title="Download">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};