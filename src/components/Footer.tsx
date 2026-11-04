import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Download, ShieldCheck, Lock } from 'lucide-react';
import { ANDROID_PACKAGE_NAME } from '../lib/deepLink';

interface FooterProps {
  onOpenDownloadModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDownloadModal }) => {
  return (
    <footer className="mt-16 sm:mt-20 border-t border-white/80 bg-white/70 backdrop-blur-3xl shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.95)] text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/60">
          {/* Brand info */}
          <div className="space-y-1.5 max-w-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/90 border border-white/90 flex items-center justify-center p-0.5 shadow-2xs overflow-hidden">
                <img src="/logo.png" alt="Anime Trix" className="w-full h-full object-contain rounded-lg" />
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base">
                Anime <span className="text-[#E50914]">Trix</span> Official
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Official catalog preview and smart deep-linking hub for the Anime Trix Android streaming application.
            </p>
            <div className="flex items-center gap-3 pt-1 text-[11px] text-emerald-700 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                256-bit SSL Encrypted
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                Zero User Tracking
              </span>
            </div>
          </div>

          {/* Quick Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenDownloadModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 glass-pill hover:bg-white/90 rounded-full transition-all min-h-[40px] active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Download APK</span>
            </button>
            <button
              onClick={() => {
                window.location.href = `intent://home#Intent;scheme=animetrix;package=${ANDROID_PACKAGE_NAME};end`;
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-[#E50914] hover:brightness-110 rounded-full shadow-[0_4px_16px_rgba(229,9,20,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all min-h-[40px] active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Launch App</span>
            </button>
          </div>
        </div>

        {/* Disclaimer, Legal Links & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
          <p>
            Anime Trix is an Android mobile companion. Video playback is exclusively supported inside the installed Android app.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            <Link to="/privacy" className="hover:text-slate-900 transition-colors font-medium">
              Privacy Policy
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/terms" className="hover:text-slate-900 transition-colors font-medium">
              Terms of Service
            </Link>
            <span aria-hidden="true">·</span>
            <span>All Rights Reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
