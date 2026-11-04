import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Loader2,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import { auth, verifyPasswordResetCode, confirmPasswordReset } from '../lib/firebase';
import { openResetPasswordInApp, openLoginInApp, isAndroidDevice } from '../lib/deepLink';
import { useToast } from '../components/Toast';

export const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // Extract query parameters per Firebase Auth standard
  const mode = searchParams.get('mode') || 'resetPassword';
  const oobCode = searchParams.get('oobCode') || '';
  const lang = searchParams.get('lang') || 'en';

  const [loadingCode, setLoadingCode] = useState<boolean>(true);
  const [codeValid, setCodeValid] = useState<boolean>(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);
  const [autoRedirectTriggered, setAutoRedirectTriggered] = useState<boolean>(false);

  const { showToast } = useToast();

  useEffect(() => {
    document.title = 'Reset Password - Anime Trix';

    if (!oobCode) {
      setLoadingCode(false);
      setCodeValid(false);
      setErrorMessage('No verification code found in this link. Please request a new password reset link.');
      return;
    }

    let isMounted = true;

    async function verifyCode() {
      try {
        setLoadingCode(true);
        // Step 1: Verify the one-time code and retrieve associated user email
        const email = await verifyPasswordResetCode(auth, oobCode);
        if (isMounted) {
          setVerifiedEmail(email);
          setCodeValid(true);
          setLoadingCode(false);

          // Step 2: Auto Deep-Link Handoff on Android
          if (isAndroidDevice()) {
            setAutoRedirectTriggered(true);
            openResetPasswordInApp({
              oobCode,
              email,
              lang,
              mode,
            });
          }
        }
      } catch (err: any) {
        console.warn('Password reset code verification failed:', err);
        if (isMounted) {
          setCodeValid(false);
          setLoadingCode(false);
          const code = err?.code || '';
          if (code === 'auth/expired-action-code') {
            setErrorMessage('This password reset link has expired. Please request a new link from the Anime Trix app.');
          } else if (code === 'auth/invalid-action-code') {
            setErrorMessage('This password reset link is invalid or has already been used. Please request a new link.');
          } else {
            setErrorMessage('This password reset link has expired or already been used.');
          }
        }
      }
    }

    verifyCode();

    return () => {
      isMounted = false;
    };
  }, [oobCode, lang, mode]);

  const handleManualAppLaunch = () => {
    if (!oobCode) return;
    openResetPasswordInApp({
      oobCode,
      email: verifiedEmail,
      lang,
      mode,
    });
    showToast('Launching Anime Trix App...');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      showToast('Please enter a new password', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSubmitting(false);
      setResetSuccess(true);
      showToast('Password reset successfully!');

      // If Android, offer fast login jump into the app
      if (isAndroidDevice()) {
        setTimeout(() => {
          openLoginInApp(verifiedEmail);
        }, 1500);
      }
    } catch (err: any) {
      setSubmitting(false);
      console.error('Password reset confirmation failed:', err);
      const code = err?.code || '';
      if (code === 'auth/weak-password') {
        showToast('Password is too weak. Please use at least 6 characters.', 'error');
      } else if (code === 'auth/expired-action-code' || code === 'auth/invalid-action-code') {
        setCodeValid(false);
        setErrorMessage('This reset code has expired. Please request a new link from the app.');
        showToast('Link has expired or was already used', 'error');
      } else {
        showToast('Could not reset password. Please try again.', 'error');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto py-4 sm:py-8 space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#E50914]" />
          <span>Back to Anime Trix Home</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="glass-panel rounded-[32px] p-6 sm:p-8 space-y-6 shadow-[0_20px_50px_rgba(15,23,42,0.1),inset_0_1px_2px_rgba(255,255,255,0.95)]">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white p-1.5 shadow-md border border-white/80 flex items-center justify-center">
            <img src="/logo.png" alt="Anime Trix" className="w-full h-full object-contain rounded-xl" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Reset Your Password
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Anime Trix Official Account Security
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loadingCode && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
            <p className="text-xs font-medium text-slate-600">
              Verifying your secure password reset link...
            </p>
          </div>
        )}

        {/* Error / Expired Code State */}
        {!loadingCode && !codeValid && (
          <div className="space-y-5 text-center py-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900">Link Expired or Invalid</h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                {errorMessage ||
                  'This password reset link has expired or already been used. Please open the Anime Trix app and request a new password reset link.'}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => openLoginInApp()}
                className="w-full min-h-[46px] px-5 py-2.5 bg-gradient-to-r from-red-600 to-[#E50914] hover:brightness-110 text-white font-bold text-xs sm:text-sm rounded-full shadow-[0_4px_16px_rgba(229,9,20,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>Open Anime Trix App</span>
              </button>

              <Link
                to="/"
                className="w-full min-h-[42px] px-5 py-2 glass-pill text-slate-700 font-semibold text-xs rounded-full flex items-center justify-center transition-all hover:bg-white/90 active:scale-95"
              >
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        )}

        {/* Success State */}
        {!loadingCode && codeValid && resetSuccess && (
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-slate-900">Password Reset Successful!</h2>
              <p className="text-xs text-slate-600 leading-relaxed font-bengali">
                আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। এখন আপনি নতুন পাসওয়ার্ড দিয়ে লগইন করতে পারেন।
              </p>
              {verifiedEmail && (
                <p className="text-xs font-mono text-slate-500 pt-1">
                  Account: <span className="font-semibold text-slate-800">{verifiedEmail}</span>
                </p>
              )}
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => openLoginInApp(verifiedEmail)}
                className="w-full min-h-[48px] px-6 py-3 bg-gradient-to-r from-red-600 to-[#E50914] hover:brightness-110 text-white font-bold text-xs sm:text-sm rounded-full shadow-[0_6px_20px_rgba(229,9,20,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Smartphone className="w-4 h-4" />
                <span>Login in Anime Trix App / অ্যাপে লগইন করুন</span>
              </button>

              <Link
                to="/"
                className="w-full min-h-[44px] px-5 py-2.5 glass-pill text-slate-700 font-semibold text-xs sm:text-sm rounded-full flex items-center justify-center gap-1.5 transition-all hover:bg-white/90 active:scale-95"
              >
                <span>Browse Anime Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Active Reset Form & Android App Handoff */}
        {!loadingCode && codeValid && !resetSuccess && (
          <div className="space-y-5">
            {/* Prominent Android App Handoff Banner & CTA */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-red-700">
                <Smartphone className="w-4 h-4 text-[#E50914] shrink-0" />
                <span>Anime Trix Android App Installed?</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                You can complete your password reset directly inside the official Android app. Tap the button below to switch:
              </p>
              <button
                type="button"
                onClick={handleManualAppLaunch}
                className="w-full min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-red-600 to-[#E50914] hover:brightness-110 text-white font-bold text-xs sm:text-sm rounded-full shadow-[0_4px_16px_rgba(229,9,20,0.3),inset_0_1px_1px_rgba(255,255,255,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Open in Anime Trix App / অ্যাপে খুলুন</span>
              </button>
            </div>

            {/* Verified Email Indicator Card */}
            {verifiedEmail && (
              <div className="p-3.5 glass-card rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <Mail className="w-4 h-4 text-[#E50914]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Resetting Password For
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate font-mono">
                    {verifiedEmail}
                  </p>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
            )}

            {/* Web Password Reset Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>New Password</span>
                  <span className="text-[10px] text-slate-400 font-normal">Min. 6 characters</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new secure password"
                    minLength={6}
                    required
                    className="w-full h-11 pl-10 pr-10 glass-input rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E50914]/40 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    minLength={6}
                    required
                    className="w-full h-11 pl-10 pr-10 glass-input rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E50914]/40 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Match Helper */}
              {newPassword && confirmPassword && (
                <div className="text-[11px] font-medium flex items-center gap-1.5">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Passwords match
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Passwords do not match
                    </span>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[48px] px-6 py-3 bg-gradient-to-r from-red-600 via-[#E50914] to-red-600 hover:brightness-110 disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-full shadow-[0_8px_24px_rgba(229,9,20,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Reset Password / পাসওয়ার্ড আপডেট করুন</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Security Footer Notice */}
      <div className="text-center space-y-1 text-[11px] text-slate-400">
        <p className="flex items-center justify-center gap-1 font-medium text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Protected with 256-bit SSL & Firebase Authentication</span>
        </p>
        <p>© Anime Trix. All rights reserved.</p>
      </div>
    </div>
  );
};
