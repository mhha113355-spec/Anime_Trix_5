import React, { useEffect } from 'react';
import { X, Download, Smartphone, QrCode, ShieldCheck, Zap, Globe, Sparkles, Check } from 'lucide-react';
import { AppSettings } from '../types';
import { ANDROID_PACKAGE_NAME } from '../lib/deepLink';

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

  // Priority: 1. Firestore appConfig/settings.apkDownloadUrl, 2. Direct hosted /AnimeTrix.apk
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
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with crimson brand splash */}
        <div className="relative bg-gradient-to-r from-red-600 to-[#E50914] text-white p-6 pb-7">
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center shrink-0 p-1.5 overflow-hidden">
              <img src="/logo.png" alt="Anime Trix" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-bold tracking-tight">
                Get Anime Trix for Android
              </h2>
              <p className="text-red-100 text-xs font-medium mt-0.5">
                অফিসিয়াল অ্যানিমে স্ট্রিমিং অ্যাপ • 100% Free
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Key app features */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5">
              <div className="p-1.5 bg-red-100 text-[#E50914] rounded-lg shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">1080p Ultra HD</p>
                <p className="text-[11px] text-slate-500">Zero buffering streaming</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5">
              <div className="p-1.5 bg-red-100 text-[#E50914] rounded-lg shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">Bangla & Hindi Dub</p>
                <p className="text-[11px] text-slate-500">Multilingual audio support</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5">
              <div className="p-1.5 bg-red-100 text-[#E50914] rounded-lg shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">1-Tap Deep Link</p>
                <p className="text-[11px] text-slate-500">Direct open from links</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5">
              <div className="p-1.5 bg-red-100 text-[#E50914] rounded-lg shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">Secure & Clean</p>
                <p className="text-[11px] text-slate-500">Verified official build</p>
              </div>
            </div>
          </div>

          {/* Desktop QR Scan Section */}
          <div className="hidden sm:flex items-center gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="w-24 h-24 bg-white p-1 rounded-xl shadow-xs border border-slate-200 shrink-0 flex items-center justify-center">
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
              <p className="text-[11px] text-slate-400 font-mono">{ANDROID_PACKAGE_NAME}</p>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="space-y-2.5">
            <a
              href={downloadUrl}
              download="AnimeTrix.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[50px] px-6 py-3 bg-[#E50914] hover:bg-[#C80811] text-white font-semibold text-sm rounded-xl shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-center"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download Anime Trix APK (Android)</span>
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
