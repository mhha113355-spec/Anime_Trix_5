import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Scale, ChevronLeft, ShieldAlert, FileCheck, CheckCircle2 } from 'lucide-react';

export const TermsPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Terms of Service - Anime Trix';
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#E50914] border border-red-200 text-xs font-bold">
          <Scale className="w-4 h-4" />
          <span>Terms of Service & Disclaimer (ব্যবহারের শর্তাবলী)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Anime Trix Terms of Service
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Last Updated: November 2026 · কার্যকর তারিখ: নভেম্বর ২০২৬
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="bg-white rounded-[28px] border border-slate-200 p-6 sm:p-9 shadow-xs space-y-8 text-slate-700 text-sm leading-relaxed">
        {/* Section 1: Acceptance */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#E50914]" />
            <span>১. শর্তাবলীর গ্রহণযোগ্যতা (Acceptance of Terms)</span>
          </h2>
          <p>
            Anime Trix ওয়েবসাইট এবং অ্যাপ্লিকেশন ব্যবহার করার মাধ্যমে আপনি এই ব্যবহারের শর্তাবলী মেনে নিতে সম্মতি প্রকাশ করছেন। যদি আপনি এই শর্তাবলীর কোনো অংশের সাথে একমত না হন, তবে অনুগ্রহ করে ওয়েবসাইট ও অ্যাপ ব্যবহার থেকে বিরত থাকুন।
          </p>
        </section>

        {/* Section 2: Intellectual Property & Disclaimer */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#E50914]" />
            <span>২. মেধাসম্পদ ও কন্টেন্ট ডিসক্লেইমার (Content Disclaimer & DMCA)</span>
          </h2>
          <p>
            Anime Trix একটি মোবাইল কম্প্যানিয়ন এবং ক্যাটালগ হাব হিসেবে কাজ করে। ওয়েবসাইটের প্রদর্শিত সকল অ্যানিমে আর্টওয়ার্ক, পোস্টার, নাম এবং ট্রেডমার্ক তাদের মূল নির্মাতা প্রতিষ্ঠান, স্টুডিও এবং কপিরাইট অধিকারীদের নিজস্ব সম্পত্তি।
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-800">কপিরাইট লঙ্ঘন ও অপসারণ নীতি (Copyright Notice):</p>
            <p>
              আমরা কপিরাইট অধিকারকে শ্রদ্ধা করি। কোনো কপিরাইট স্বত্বাধিকারী যদি বিশ্বাস করেন যে তাদের সামগ্রী এই সাইটে যথাযথ অনুমোদন ছাড়া প্রদর্শিত হচ্ছে, তবে অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন। আমরা দ্রুততম সময়ে (২৪-৪৮ ঘণ্টার মধ্যে) তা যাচাই করে উপযুক্ত পদক্ষেপ গ্রহণ করব।
            </p>
          </div>
        </section>

        {/* Section 3: Safe Usage */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#E50914]" />
            <span>৩. অ্যাপ ব্যবহার ও দায়িত্বের সীমাবদ্ধতা (Limitation of Liability)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            আমরা নিয়মিতভাবে আমাদের অ্যান্ড্রয়েড অ্যাপ্লিকেশনের ভাইরাস ও ম্যালওয়্যার মুক্ত থাকা নিশ্চিত করি। তবে কোনো ব্যবহারকারী যদি আমাদের অফিশিয়াল পোর্টাল ছাড়া অন্য কোনো তৃতীয় পক্ষের ক্ষতিকর উৎস থেকে অ্যাপ ডাউনলোড করে ক্ষতির সম্মুখীন হন, তার জন্য Anime Trix কর্তৃপক্ষ দায়ী থাকবে না।
          </p>
        </section>

        {/* Section 4: Contact */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">৪. কপিরাইট বা আইনি যোগাযোগ</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            যেকোনো আইনি বা কন্টেন্ট সংক্রান্ত অনুসন্ধানের জন্য আমাদের অফিশিয়াল ইমেইলে যোগাযোগ করুন:
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block text-xs font-mono text-slate-800">
            Contact: <a href="mailto:mhha113355@gmail.com" className="text-[#E50914] font-bold underline">mhha113355@gmail.com</a>
          </div>
        </section>
      </div>
    </div>
  );
};
