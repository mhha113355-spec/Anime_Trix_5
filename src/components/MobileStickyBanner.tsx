import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface MobileStickyBannerProps {
  onOpenDownloadModal: () => void;
  animeId?: string;
  episodeId?: string;
  dub?: string;
}

export const MobileStickyBanner: React.FC<MobileStickyBannerProps> = ({
  onOpenDownloadModal,
}) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('animetrix_banner_dismissed') === '1') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem('animetrix_banner_dismissed', '1');
  };

  if (dismissed) return null;

  return (
    <aside
      aria-label="Mobile download banner"
      className="md:hidden fixed bottom-3 left-3 right-3 z-40 max-w-md mx-auto"
    >
      {/* Clean White UI Floating Download Bar for v18 */}
      <div className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-full bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_12px_36px_rgba(15,23,42,0.15)] animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden p-0.5 shadow-2xs">
            <img src="/logo.png" alt="Anime Trix" className="w-full h-full object-contain rounded-full" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">Anime Trix App (v18)</p>
            <p className="text-[10px] text-slate-500 truncate">Free Download Update</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href="/AnimeTrix (18).apk"
            download="AnimeTrix (18).apk"
            onClick={(e) => {
              if (!/Android/i.test(navigator.userAgent)) {
                e.preventDefault();
                onOpenDownloadModal();
              }
            }}
            className="px-3.5 py-1.5 bg-[#E50914] hover:bg-[#C80811] text-white text-[11px] font-bold rounded-full shadow-[0_2px_12px_rgba(229,9,20,0.35)] active:scale-95 transition-all whitespace-nowrap min-h-[34px] flex items-center gap-1.5 cursor-pointer text-center"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Update APK</span>
          </a>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss download banner"
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 transition-colors active:scale-90"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
