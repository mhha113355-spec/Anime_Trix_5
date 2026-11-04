import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, FileText, ChevronLeft, CheckCircle2 } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Privacy Policy - Anime Trix';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 sm:py-8">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#E50914]" />
          <span>Back to Home / হোম পেজে ফিরুন</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-[28px] border border-slate-200 p-6 sm:p-9 shadow-xs space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Official Privacy & Security Policy (প্রাইভেসি পলিসি)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Anime Trix Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Last Updated: November 2026 · কার্যকর তারিখ: নভেম্বর ২০২৬
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="bg-white rounded-[28px] border border-slate-200 p-6 sm:p-9 shadow-xs space-y-8 text-slate-700 text-sm leading-relaxed">
        {/* Section 1: Introduction */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#E50914]" />
            <span>১. তথ্যের গোপনীয়তা ও নিরাপত্তা নিশ্চিতকরণ (Our Commitment)</span>
          </h2>
          <p>
            Anime Trix (“আমরা”, “আমাদের” বা “অ্যাপ/ওয়েবসাইট”) ব্যবহারকারীদের ব্যক্তিগত তথ্যের সর্বোচ্চ নিরাপত্তা এবং গোপনীয়তা রক্ষায় দৃঢ়ভাবে প্রতিশ্রুতিবদ্ধ। আমাদের ওয়েবসাইট মূলত Anime Trix অ্যান্ড্রয়েড অ্যাপ্লিকেশনের একটি অফিশিয়াল ক্যাটালগ এবং ডাউনলোডার পোর্টাল হিসেবে কাজ করে।
          </p>
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-1.5 text-emerald-900 text-xs sm:text-sm">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              আপনার কোনো ব্যক্তিগত তথ্য এখানে স্টোর বা জমা রাখা হয় না:
            </p>
            <p className="text-emerald-800 text-xs">
              আমাদের ওয়েবসাইটে কোনো গোপন ট্র্যাকার নেই, কোনো ব্যাংক অ্যাকাউন্ট বা পাসওয়ার্ড চাওয়া হয় না এবং কোনো প্রকার স্পাইওয়্যার নেই। সাধারণ ব্যবহারকারী হিসেবে সাইটটি সম্পূর্ণ নিরাপদ এবং ঝুঁকিমুক্ত।
            </p>
          </div>
        </section>

        {/* Section 2: Data Collection */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#E50914]" />
            <span>২. আমরা কী ধরনের তথ্য সংগ্রহ করি (Information We Collect)</span>
          </h2>
          <ul className="space-y-2 list-disc list-inside text-xs sm:text-sm text-slate-600">
            <li>
              <strong className="text-slate-800">অজ্ঞাতনামা টেকনিক্যাল লগ (Anonymous Technical Logs):</strong> ওয়েবসাইট পরিদর্শনের সময় ব্রাউজারের ধরন, ডিভাইসের ধরন (মোবাইল বা পিসি) এবং সাধারণ পেজ ভিউ সংক্রান্ত পরিসংখ্যান যা গুগলের অ্যানালিটিক্স সার্ভারে জমা হয়।
            </li>
            <li>
              <strong className="text-slate-800">আমরা যা সংগ্রহ করি না (We DO NOT collect):</strong> আমরা কোনো ব্যবহারকারীর নাম, ইমেইল, মোবাইল নম্বর, ক্রেডিট/ডেবিট কার্ডের তথ্য বা কোনো ব্যক্তিগত ফাইল সংগ্রহ বা সংরক্ষণ করি না।
            </li>
          </ul>
        </section>

        {/* Section 3: Third-Party & Infrastructure */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#E50914]" />
            <span>৩. ক্লাউড ইনফ্রাস্ট্রাকচার ও সার্ভার নিরাপত্তা (Cloud Infrastructure)</span>
          </h2>
          <p>
            আমাদের ওয়েবসাইটটি বিশ্বের শীর্ষস্থানীয় ক্লাউড প্ল্যাটফর্ম (Google Firebase এবং Render Inc.)-এর ক্লাউড নেটওয়ার্কে পরিচালিত হয়:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="font-bold text-slate-900 text-xs">256-bit SSL Encryption</p>
              <p className="text-[11px] text-slate-500 mt-1">
                ওয়েবসাইটের সকল ডেটা HTTPS প্রোটোকলের মাধ্যমে উচ্চমাত্রার এনক্রিপশনের সাহায্যে স্থানান্তরিত হয়। ফলে মাঝপথে কোনো হ্যাকার ডেটা চুরি করতে পারে না।
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="font-bold text-slate-900 text-xs">Google Firebase Cloud</p>
              <p className="text-[11px] text-slate-500 mt-1">
                অ্যানিমে ক্যাটালগ ও তথ্যগুলো গুগলের ক্লাউড ফায়ারস্টোরে সংরক্ষিত, যা বিশ্বের অন্যতম শক্তিশালী সিকিউরিটি ফায়ারওয়াল দ্বারা সুরক্ষিত।
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Children's Privacy */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#E50914]" />
            <span>৪. শিশুদের গোপনীয়তা (Children's Privacy Protection)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            আমরা জেনেশুনে ১৩ বছরের কম বয়সী শিশুদের কাছ থেকে কোনো ব্যক্তিগত তথ্য সংগ্রহ করি না। আমাদের সাইটের সকল অ্যানিমে তথ্য সাধারণ বিনোদনের উদ্দেশ্যে সাজানো।
          </p>
        </section>

        {/* Section 5: Contact Information */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">৫. যোগাযোগ ও ফিডব্যাক (Contact Information)</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            এই প্রাইভেসি পলিসি বা আমাদের অ্যাপের নিরাপত্তা সম্পর্কিত কোনো প্রশ্ন বা পরামর্শ থাকলে সরাসরি আমাদের অফিসিয়াল যোগাযোগ ঠিকানায় মেইল করতে পারেন:
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block text-xs font-mono text-slate-800">
            Email: <a href="mailto:mhha113355@gmail.com" className="text-[#E50914] font-bold underline">mhha113355@gmail.com</a>
          </div>
        </section>
      </div>
    </div>
  );
};
