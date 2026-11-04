import React, { useEffect } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  X,
  QrCode,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AppSettings } from '../types';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  appSettings: AppSettings;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({
  isOpen,
  onClose,
  appSettings,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const downloadUrl =
    appSettings.apkDownloadUrl ||
    '/AnimeTrix (10).apk';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    typeof window !== 'undefined' && downloadUrl.startsWith('/')
      ? `${window.location.origin}${downloadUrl}`
      : downloadUrl
  )}&color=0f172a&bgcolor=ffffff`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg glass-panel rounded-[32px] sm:rounded-[36px] shadow-[0_24px_70px_rgba(15,23,42,0.25),inset_0_1px_2px_rgba(255,255,255,1)] border border-white/95 overflow-hidden transform transition-all max-h-[90vh] flex flex-col text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with crimson brand splash & glass sheen */}
        <div className="relative bg-gradient-to-r from-red-600/95 via-[#E50914]/95 to-red-600/95 backdrop-blur-2xl text-white p-6 pb-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
          <button
            onClick={onClose}
            aria-label="Close download modal"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition-colors active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/95 p-1 shadow-md border border-white/90 shrink-0">
              <img src="/logo.png" alt="Anime Trix" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-black tracking-tight leading-tight">
                Anime Trix for Android
              </h2>
              <p className="text-xs text-red-100 mt-0.5">
                Official high-speed anime streaming installer (14.8 MB)
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Key Features Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2.5 p-3 glass-card rounded-2xl">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">Zero Buffering</p>
                <p className="text-[10px] text-slate-500">High-speed CDN</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 glass-card rounded-2xl">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">Safe & Verified</p>
                <p className="text-[10px] text-slate-500">Official Build</p>
              </div>
            </div>
          </div>

          {/* Desktop QR Scan Section */}
          <div className="hidden sm:flex items-center gap-4 p-4 glass-card rounded-2xl">
            <div className="w-24 h-24 bg-white/90 p-1 rounded-2xl shadow-xs border border-white shrink-0 flex items-center justify-center">
              <img
                src={qrCodeUrl}
                alt="Scan to download Anime Trix APK"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-left space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <QrCode className="w-4 h-4 text-[#E50914]" />
                <span>Scan with your Android phone</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Point your phone camera to download the APK installer directly onto your device.
              </p>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="space-y-2.5">
            <a
              href={downloadUrl}
              download="AnimeTrix (10).apk"
              className="w-full min-h-[50px] px-6 py-3 bg-gradient-to-r from-red-600 via-[#E50914] to-red-600 hover:brightness-110 text-white font-bold text-sm rounded-full shadow-[0_8px_24px_rgba(229,9,20,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-center"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download AnimeTrix (10).apk (14.8 MB)</span>
            </a>
            <p className="text-center text-[11px] text-slate-500">
              Direct APK installer • Saves directly to phone Downloads
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
