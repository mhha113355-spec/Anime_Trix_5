import React from 'react';
import { Smartphone, Download, ShieldCheck, Heart } from 'lucide-react';
import { ANDROID_PACKAGE_NAME } from '../lib/deepLink';

interface FooterProps {
  onOpenDownloadModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDownloadModal }) => {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
          {/* Brand info */}
          <div className="space-y-1.5 max-w-md">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#E50914] text-white flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 fill-current">
                  <path d="M10 8l14 8-14 8V8z" />
                </svg>
              </div>
              <span className="font-bold text-slate-900 tracking-tight">Anime Trix Official</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Official catalog preview and smart deep-linking hub for the Anime Trix Android streaming application.
            </p>
            <p className="text-[11px] font-mono text-slate-400">
              Package: {ANDROID_PACKAGE_NAME}
            </p>
          </div>

          {/* Quick Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenDownloadModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors min-h-[40px]"
            >
              <Download className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Download APK</span>
            </button>
            <button
              onClick={() => {
                window.location.href = `intent://home#Intent;scheme=animetrix;package=${ANDROID_PACKAGE_NAME};end`;
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#E50914] hover:bg-[#C80811] rounded-xl shadow-xs transition-colors min-h-[40px]"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Launch App</span>
            </button>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
          <p>
            Anime Trix is an Android mobile companion. Video playback is exclusively supported inside the installed Android app.
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Official Web Portal</span>
            <span aria-hidden="true">·</span>
            <span>All Rights Reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
