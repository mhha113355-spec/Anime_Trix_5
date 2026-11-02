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
    '/AnimeTrix.apk';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden transform transition-all max-h-[90vh] flex flex-col text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with crimson brand splash */}
        <div className="relative bg-gradient-to-r from-red-600 to-[#E50914] text-white p-6 pb-7">
          <button
            onClick={onClose}
            aria-label="Close download modal"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-md border border-white/40 shrink-0">
              <img src="/logo.png" alt="Anime Trix" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-black tracking-tight leading-tight">
                Anime Trix for Android
              </h2>
              <p className="text-xs text-red-100 mt-0.5">
                Official high-speed anime streaming installer
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Key Features Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">Zero Buffering</p>
                <p className="text-[10px] text-slate-500">High-speed CDN</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">Safe & Verified</p>
                <p className="text-[10px] text-slate-500">Official Build</p>
              </div>
            </div>
          </div>

          {/* Desktop QR Scan Section (Package name removed) */}
          <div className="hidden sm:flex items-center gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="w-24 h-24 bg-white p-1 rounded-2xl shadow-xs border border-slate-200 shrink-0 flex items-center justify-center">
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
              download="AnimeTrix.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[50px] px-6 py-3 bg-[#E50914] hover:bg-[#C80811] text-white font-bold text-sm rounded-full shadow-lg shadow-red-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-center"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download Anime Trix APK (9.8 MB)</span>
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
