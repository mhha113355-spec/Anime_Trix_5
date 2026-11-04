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
  Send,
  RefreshCw,
} from 'lucide-react';
import { auth, verifyPasswordResetCode, confirmPasswordReset } from '../lib/firebase';
import { openResetPasswordInApp, openLoginInApp, isAndroidDevice, APP_SCHEME } from '../lib/deepLink';
import { useToast } from '../components/Toast';

export const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // Extract query parameters per Firebase Auth standard & custom bridge
  const mode = searchParams.get('mode') || 'resetPassword';
  const oobCode = searchParams.get('oobCode') || '';
  const lang = searchParams.get('lang') || 'bn';
  const emailParam = searchParams.get('email') || '';

  const [loadingCode, setLoadingCode] = useState<boolean>(Boolean(oobCode));
  const [codeValid, setCodeValid] = useState<boolean>(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string>(emailParam);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  // For requesting a new reset link via POST /api/auth/forgot-password
  const [requestEmail, setRequestEmail] = useState<string>(emailParam);
  const [sendingRequest, setSendingRequest] = useState<boolean>(false);
  const [requestSent, setRequestSent] = useState<boolean>(false);

  const { showToast } = useToast();

  const isBengali = lang === 'bn' || lang.startsWith('bn');

  // Exact custom scheme URL per requirement:
  // animetrix://reset-password?mode=resetPassword&oobCode=${oobCode}&email=${email}&lang=${lang}
  const currentEmail = verifiedEmail || emailParam;
  const animetrixAppDeepLink = `${APP_SCHEME}://reset-password?mode=${encodeURIComponent(
    mode
  )}&oobCode=${encodeURIComponent(oobCode)}&email=${encodeURIComponent(
    currentEmail
  )}&lang=${encodeURIComponent(lang)}`;

  useEffect(() => {
    document.title = isBengali
      ? 'পাসওয়ার্ড রিসেট - Anime Trix'
      : 'Reset Password - Anime Trix';

    if (!oobCode) {
      setLoadingCode(false);
      setCodeValid(false);
      setErrorMessage(
        isBengali
          ? 'কোনো ভেরিফিকেশন কোড পাওয়া যায়নি। নিচে আপনার ইমেইল দিয়ে নতুন রিসেট লিংক পেতে পারেন।'
          : 'No verification code found in this link. You can request a new reset link below.'
      );
      return;
    }

    let isMounted = true;

    // Requirement 3: Attempt instant redirect/open to animetrix:// on Android
    if (isAndroidDevice() && oobCode) {
      try {
        window.location.href = animetrixAppDeepLink;
      } catch (err) {
        console.warn('Instant android deep-link trigger error:', err);
      }
    }

    async function verifyCode() {
      try {
        setLoadingCode(true);
        // Verify one-time code and retrieve associated user email
        const email = await verifyPasswordResetCode(auth, oobCode);
        if (isMounted) {
          setVerifiedEmail(email);
          setCodeValid(true);
          setLoadingCode(false);

          // Second handoff attempt once verified email is populated
          if (isAndroidDevice()) {
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
            setErrorMessage(
              isBengali
                ? 'এই পাসওয়ার্ড রিসেট লিংকটির মেয়াদ শেষ হয়ে গেছে। নিচে আপনার ইমেইল দিয়ে নতুন লিংক সংগ্রহ করুন।'
                : 'This password reset link has expired. Please request a new link below.'
            );
          } else if (code === 'auth/invalid-action-code') {
            setErrorMessage(
              isBengali
                ? 'এই লিংকটি ইতোমধ্যে ব্যবহার করা হয়েছে অথবা সঠিক নয়। নিচে নতুন লিংক তৈরি করতে পারেন।'
                : 'This password reset link is invalid or has already been used.'
            );
          } else {
            setErrorMessage(
              isBengali
                ? 'এই পাসওয়ার্ড রিসেট লিংকটি আর সক্রিয় নয়।'
                : 'This password reset link is no longer valid.'
            );
          }
        }
      }
    }

    verifyCode();

    return () => {
      isMounted = false;
    };
  }, [oobCode, lang, mode, animetrixAppDeepLink, isBengali]);

  const handleManualAppLaunch = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!oobCode) return;

    // Direct scheme attempt
    window.location.href = animetrixAppDeepLink;

    // Fallback via helper
    setTimeout(() => {
      openResetPasswordInApp({
        oobCode,
        email: currentEmail,
        lang,
        mode,
      });
    }, 300);

    showToast(isBengali ? 'Anime Trix অ্যাপ ওপেন হচ্ছে...' : 'Launching Anime Trix App...');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      showToast(isBengali ? 'দয়া করে নতুন পাসওয়ার্ড লিখুন' : 'Please enter a new password', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast(
        isBengali
          ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'
          : 'Password must be at least 6 characters long',
        'error'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(isBengali ? 'উভয় পাসওয়ার্ড মিলছে না' : 'Passwords do not match', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSubmitting(false);
      setResetSuccess(true);
      showToast(
        isBengali
          ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!'
          : 'Password reset successfully!'
      );

      // If Android, offer fast login jump into the app
      if (isAndroidDevice()) {
        setTimeout(() => {
          openLoginInApp(currentEmail);
        }, 1500);
      }
    } catch (err: any) {
      setSubmitting(false);
      console.error('Password reset confirmation failed:', err);
      const code = err?.code || '';
      if (code === 'auth/weak-password') {
        showToast(
          isBengali
            ? 'পাসওয়ার্ডটি দুর্বল। কমপক্ষে ৬ অক্ষরের স্ট্রং পাসওয়ার্ড দিন।'
            : 'Password is too weak. Please use at least 6 characters.',
          'error'
        );
      } else if (code === 'auth/expired-action-code' || code === 'auth/invalid-action-code') {
        setCodeValid(false);
        setErrorMessage(
          isBengali
            ? 'এই রিসেট লিংকটির মেয়াদ শেষ হয়ে গেছে। নিচে থেকে নতুন লিংক নিন।'
            : 'This reset code has expired. Please request a new link below.'
        );
        showToast(
          isBengali ? 'লিংকটির মেয়াদ শেষ হয়ে গেছে' : 'Link has expired or was already used',
          'error'
        );
      } else {
        showToast(
          isBengali
            ? 'পাসওয়ার্ড পরিবর্তন সম্ভব হয়নি। আবার চেষ্টা করুন।'
            : 'Could not reset password. Please try again.',
          'error'
        );
      }
    }
  };

  // Handler to request a fresh password reset email via POST /api/auth/forgot-password
  const handleRequestNewLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmail || !requestEmail.includes('@')) {
      showToast(isBengali ? 'সঠিক ইমেইল ঠিকানা দিন' : 'Please enter a valid email', 'error');
      return;
    }

    try {
      setSendingRequest(true);
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: requestEmail.trim(),
          lang: isBengali ? 'bn' : 'en',
        }),
      });

      const data = await res.json().catch(() => ({}));
      setSendingRequest(false);

      if (res.ok && data.ok) {
        setRequestSent(true);
        showToast(
          isBengali
            ? 'পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে!'
            : 'Password reset link sent to your email!'
        );
      } else {
        const msg = data.error || (isBengali ? 'ইমেইল পাঠানো ব্যর্থ হয়েছে' : 'Failed to send email');
        showToast(msg, 'error');
      }
    } catch (err: any) {
      setSendingRequest(false);
      console.error('Forgot password request error:', err);
      showToast(
        isBengali
          ? 'সার্ভারে সংযোগ করা সম্ভব হয়নি। আবার চেষ্টা করুন।'
          : 'Could not reach server. Please try again.',
        'error'
      );
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
          <span>{isBengali ? 'হোম পেজে ফিরে যান' : 'Back to Anime Trix Home'}</span>
        </Link>
      </div>

      {/* Main Glass/White Card */}
      <div className="glass-panel bg-white/95 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 space-y-6 shadow-[0_20px_50px_rgba(15,23,42,0.1),inset_0_1px_2px_rgba(255,255,255,0.95)] border border-slate-200/80">
        {/* Brand Header with Red Accent */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white p-1.5 shadow-md border border-slate-200/80 flex items-center justify-center">
            <img src="/logo.png" alt="Anime Trix" className="w-full h-full object-contain rounded-xl" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isBengali ? 'অ্যাকাউন্ট পাসওয়ার্ড রিসেট' : 'Reset Your Password'}
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5 uppercase tracking-wider">
              Anime Trix Official Account Security
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loadingCode && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
            <p className="text-xs font-medium text-slate-600">
              {isBengali
                ? 'পাসওয়ার্ড রিসেট ভেরিফিকেশন কোড যাচাই করা হচ্ছে...'
                : 'Verifying your secure password reset link...'}
            </p>
          </div>
        )}

        {/* Error / Expired Code State with Request New Link Form */}
        {!loadingCode && !codeValid && (
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900">
                {isBengali ? 'লিংকটি সক্রিয় নয় বা মেয়াদ শেষ' : 'Link Expired or Invalid'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                {errorMessage}
              </p>
            </div>

            {/* Request New Reset Link Form */}
            <div className="pt-2 text-left">
              {requestSent ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-emerald-900">
                    {isBengali
                      ? 'নতুন রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে!'
                      : 'New reset link sent to your email!'}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    {isBengali
                      ? 'অনুগ্রহ করে আপনার ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।'
                      : 'Please check your email inbox or spam folder.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setRequestSent(false)}
                    className="text-[11px] text-[#E50914] font-bold underline pt-1 block mx-auto"
                  >
                    {isBengali ? 'আরেকটি ইমেইল পাঠান' : 'Send another email'}
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleRequestNewLink}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Mail className="w-4 h-4 text-[#E50914]" />
                    <span>{isBengali ? 'নতুন রিসেট লিংক চান?' : 'Need a new reset link?'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isBengali
                      ? 'আপনার Anime Trix অ্যাকাউন্টের ইমেইল লিখুন, আমরা সাথে সাথে একটি নতুন লিংক পাঠাবো:'
                      : 'Enter your account email to receive a fresh password reset link:'}
                  </p>
                  <input
                    type="email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E50914]"
                  />
                  <button
                    type="submit"
                    disabled={sendingRequest}
                    className="w-full min-h-[42px] px-4 py-2 bg-gradient-to-r from-red-600 to-[#E50914] hover:brightness-110 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    {sendingRequest ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isBengali ? 'পাঠানো হচ্ছে...' : 'Sending...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{isBengali ? 'রিসেট লিংক পাঠান' : 'Send Reset Link'}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Quick Navigation Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => openLoginInApp()}
                className="w-full min-h-[46px] px-5 py-2.5 bg-gradient-to-r from-red-600 to-[#E50914] hover:brightness-110 text-white font-bold text-xs sm:text-sm rounded-full shadow-[0_4px_16px_rgba(229,9,20,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>{isBengali ? 'Anime Trix অ্যাপে লগইন করুন' : 'Open Anime Trix App'}</span>
              </button>

              <Link
                to="/"
                className="w-full min-h-[42px] px-5 py-2 glass-pill text-slate-700 font-semibold text-xs rounded-full flex items-center justify-center transition-all hover:bg-white/90 active:scale-95 border border-slate-200"
              >
                <span>{isBengali ? 'হোম পেজে যান' : 'Return to Home'}</span>
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
              <h2 className="text-lg font-black text-slate-900">
                {isBengali ? 'পাসওয়ার্ড সফলভাবে আপডেট হয়েছে!' : 'Password Reset Successful!'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-bengali">
                {isBengali
                  ? 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। এখন আপনি নতুন পাসওয়ার্ড দিয়ে লগইন করতে পারেন।'
                  : 'Your account password has been updated successfully. You can now login with your new password.'}
              </p>
              {currentEmail && (
                <p className="text-xs font-mono text-slate-500 pt-1">
                  Account: <span className="font-semibold text-slate-800">{currentEmail}</span>
                </p>
              )}
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => openLoginInApp(currentEmail)}
                className="w-full min-h-[48px] px-6 py-3 bg-gradient-to-r from-red-600 to-[#E50914] hover:brightness-110 text-white font-bold text-xs sm:text-sm rounded-full shadow-[0_6px_20px_rgba(229,9,20,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>
                  {isBengali ? 'Anime Trix অ্যাপে লগইন করুন' : 'Login in Anime Trix App'}
                </span>
              </button>

              <Link
                to="/"
                className="w-full min-h-[44px] px-5 py-2.5 glass-pill text-slate-700 font-semibold text-xs sm:text-sm rounded-full flex items-center justify-center gap-1.5 transition-all hover:bg-white/90 active:scale-95 border border-slate-200"
              >
                <span>{isBengali ? 'অ্যানিমে ক্যাটালগ দেখুন' : 'Browse Anime Catalog'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Active Reset Form & Android App Handoff */}
        {!loadingCode && codeValid && !resetSuccess && (
          <div className="space-y-6">
            {/* ========================================================= */}
            {/* REQUIREMENT 3: Prominent red "Open in Anime Trix App" CTA */}
            {/* ========================================================= */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-red-600/10 via-red-500/5 to-transparent border border-red-200/90 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-red-700">
                <Smartphone className="w-4 h-4 text-[#E50914] shrink-0" />
                <span>
                  {isBengali
                    ? 'Anime Trix Android App ইনস্টল করা আছে?'
                    : 'Anime Trix Android App Installed?'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {isBengali
                  ? 'নিচের বাটনে ট্যাপ করলেই সরাসরি অফিশিয়াল Anime Trix অ্যান্ড্রয়েড অ্যাপে পাসওয়ার্ড রিসেট স্ক্রিন চালু হবে:'
                  : 'Tap below to complete your password reset directly inside the official Android app:'}
              </p>
              
              {/* Prominent Red Button with exact animetrix:// deep link */}
              <a
                href={animetrixAppDeepLink}
                onClick={handleManualAppLaunch}
                className="w-full min-h-[48px] px-5 py-3 bg-gradient-to-r from-red-600 via-[#E50914] to-red-600 hover:brightness-110 text-white font-black text-xs sm:text-sm rounded-full shadow-[0_8px_24px_rgba(229,9,20,0.38),inset_0_1px_1.5px_rgba(255,255,255,0.45)] active:scale-95 transition-all flex items-center justify-center gap-2 text-center cursor-pointer"
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>
                  {isBengali
                    ? 'Open in Anime Trix App / অ্যাপে খুলুন'
                    : 'Open in Anime Trix App'}
                </span>
              </a>
            </div>

            {/* Verified Email Indicator Card */}
            {currentEmail && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-slate-600 shrink-0">
                  <Mail className="w-4 h-4 text-[#E50914]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {isBengali ? 'অ্যাকাউন্ট ইমেইল' : 'Resetting Password For'}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate font-mono">
                    {currentEmail}
                  </p>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
            )}

            {/* ========================================================= */}
            {/* REQUIREMENT 3: Clean matching white/red web fallback form */}
            {/* ========================================================= */}
            <div className="pt-2 border-t border-slate-200/90 space-y-4">
              <div className="text-center">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isBengali
                    ? 'অথবা ব্রাউজারে পাসওয়ার্ড রিসেট করুন (Web Fallback)'
                    : 'Or Reset Password in Browser (Web Fallback)'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{isBengali ? 'নতুন পাসওয়ার্ড' : 'New Password'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {isBengali ? 'কমপক্ষে ৬ অক্ষর' : 'Min. 6 characters'}
                    </span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={
                        isBengali ? 'নতুন পাসওয়ার্ড লিখুন' : 'Enter new secure password'
                      }
                      minLength={6}
                      required
                      className="w-full h-11 pl-10 pr-10 bg-slate-50/80 border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E50914]/40 font-medium"
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
                  <label className="text-xs font-bold text-slate-700">
                    {isBengali ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={
                        isBengali ? 'পুনরায় একই পাসওয়ার্ড লিখুন' : 'Re-enter new password'
                      }
                      minLength={6}
                      required
                      className="w-full h-11 pl-10 pr-10 bg-slate-50/80 border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E50914]/40 font-medium"
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
                      <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isBengali ? 'পাসওয়ার্ড মিলেছে' : 'Passwords match'}
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {isBengali ? 'উভয় পাসওয়ার্ড মিলছে না' : 'Passwords do not match'}
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
                      <span>{isBengali ? 'পাসওয়ার্ড আপডেট হচ্ছে...' : 'Resetting Password...'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        {isBengali
                          ? 'Reset Password / পাসওয়ার্ড আপডেট করুন'
                          : 'Confirm Password Reset'}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
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
