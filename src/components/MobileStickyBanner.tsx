import React, { useState, useEffect } from 'react';
import { Smartphone, X } from 'lucide-react';
import { openInAnimeTrixApp } from '../lib/deepLink';

interface MobileStickyBannerProps {
  onOpenDownloadModal: () => void;
  animeId?: string;
  episodeId?: string;
  dub?: string;
}

export const MobileStickyBanner: React.FC<MobileStickyBannerProps> = ({
  onOpenDownloadModal,
  animeId,
  episodeId,
  dub,
}) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check session storage
    if (sessionStorage.getItem('animetrix_banner_dismissed') === '1') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('animetrix_banner_dismissed', '1');
  };

  const handleOpen = () => {
    openInAnimeTrixApp({
      animeId,
      episodeId,
      dub,
      onNonAndroid: () => {
        onOpenDownloadModal();
      },
    });
  };

  if (dismissed) return null;

  return (
    <aside
      aria-label="Mobile app banner"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 shadow-lg shadow-black/5"
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-2.5 h-11">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs overflow-hidden p-0.5">
            <img src="/logo.png" alt="Anime Trix" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">Anime Trix Android App</p>
            <p className="text-[10px] text-slate-500 truncate">Watch in 1080p HD with Dub</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleOpen}
            className="px-3 py-1.5 bg-[#E50914] hover:bg-[#C80811] text-white text-[11px] font-bold rounded-lg shadow-xs active:scale-95 transition-all whitespace-nowrap min-h-[36px] flex items-center gap-1"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Open App</span>
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss app banner"
            className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
