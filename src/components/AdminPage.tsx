import { useEffect, useState, type FormEvent } from 'react';
import { Lock, LogOut, Plus, Trash2 } from 'lucide-react';
import type { AdminUser, Ayah, Dua, Hadith, Language, Surah } from '../types/islamic';
import { safeReadJson } from '../utils/safeFetch';

interface AdminPageProps {
  lang: Language;
  surahs: Surah[];
  ayahs: Ayah[];
  hadiths: Hadith[];
  duas: Dua[];
  onContentMutated: () => Promise<void>;
}

export function AdminPage({
  lang,
  surahs,
  ayahs,
  hadiths,
  duas,
  onContentMutated,
}: AdminPageProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [email, setEmail] = useState('admin@islamiclife.com');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [tab, setTab] = useState<'dashboard' | 'quran' | 'hadith' | 'dua'>('dashboard');
  const [feedback, setFeedback] = useState('');

  // Quran Ayah form
  const [surahId, setSurahId] = useState<number>(1);
  const [ayahNum, setAyahNum] = useState<string>('1');
  const [ayahArabic, setAyahArabic] = useState('');
  const [ayahBn, setAyahBn] = useState('');
  const [ayahEn, setAyahEn] = useState('');
  const [ayahShortTafsirBn, setAyahShortTafsirBn] = useState('');
  const [ayahTafsirBn, setAyahTafsirBn] = useState('');

  // Hadith form
  const [hadithTitleBn, setHadithTitleBn] = useState('');
  const [hadithTitleEn, setHadithTitleEn] = useState('');
  const [hadithCategory, setHadithCategory] = useState('Character & Ethics');
  const [hadithArabic, setHadithArabic] = useState('');
  const [hadithBn, setHadithBn] = useState('');
  const [hadithEn, setHadithEn] = useState('');
  const [hadithSource, setHadithSource] = useState('Sahih al-Bukhari');
  const [hadithNumber, setHadithNumber] = useState('');

  // Dua form
  const [duaCategory, setDuaCategory] = useState('Daily Routine');
  const [duaTitleBn, setDuaTitleBn] = useState('');
  const [duaTitleEn, setDuaTitleEn] = useState('');
  const [duaArabic, setDuaArabic] = useState('');
  const [duaPronBn, setDuaPronBn] = useState('');
  const [duaPronEn, setDuaPronEn] = useState('');
  const [duaMeaningBn, setDuaMeaningBn] = useState('');
  const [duaMeaningEn, setDuaMeaningEn] = useState('');
  const [duaRef, setDuaRef] = useState('Hisn al-Muslim');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => safeReadJson<{ user?: AdminUser | null; csrfToken?: string | null }>(r))
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setCsrfToken(data.csrfToken || '');
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!email.trim() || !password) {
      setAuthError(lang === 'bn' ? 'ইমেইল এবং পাসওয়ার্ড দিন।' : 'Email and password are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await safeReadJson<{ user: AdminUser; csrfToken: string }>(res, 'Login failed');
      setUser(data.user);
      setCsrfToken(data.csrfToken);
      setPassword('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Network error while signing in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setCsrfToken('');
  };

  const showMsg = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(''), 3000);
  };

  const handleAddAyah = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback('');
    const res = await fetch(`/api/admin/surahs/${surahId}/ayahs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        ayah_number: Number(ayahNum),
        arabic: ayahArabic,
        translation_bn: ayahBn,
        translation_en: ayahEn,
        short_tafsir_bn: ayahShortTafsirBn,
        tafsir_bn: ayahTafsirBn,
      }),
    });
    try {
      await safeReadJson(res, 'Failed to add ayah');
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'Failed to add ayah');
      return;
    }
    setAyahArabic('');
    setAyahBn('');
    setAyahEn('');
    setAyahShortTafsirBn('');
    setAyahTafsirBn('');
    await onContentMutated();
    showMsg(lang === 'bn' ? 'আয়াত সফলভাবে যুক্ত হয়েছে।' : 'Ayah added successfully.');
  };

  const handleDeleteAyah = async (id: number) => {
    const res = await fetch(`/api/admin/ayahs/${id}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken },
    });
    if (res.ok) {
      await onContentMutated();
      showMsg(lang === 'bn' ? 'আয়াত মুছে ফেলা হয়েছে।' : 'Ayah deleted.');
    }
  };

  const handleAddHadith = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/hadiths', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        title_bn: hadithTitleBn,
        title_en: hadithTitleEn,
        category: hadithCategory,
        arabic: hadithArabic,
        translation_bn: hadithBn,
        translation_en: hadithEn,
        source: hadithSource,
        hadith_number: hadithNumber,
      }),
    });
    try {
      await safeReadJson(res, 'Failed to add hadith');
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'Failed to add hadith');
      return;
    }
    setHadithTitleBn('');
    setHadithTitleEn('');
    setHadithArabic('');
    setHadithBn('');
    setHadithEn('');
    setHadithNumber('');
    await onContentMutated();
    showMsg(lang === 'bn' ? 'হাদিস সফলভাবে যুক্ত হয়েছে।' : 'Hadith added successfully.');
  };

  const handleDeleteHadith = async (id: number) => {
    const res = await fetch(`/api/admin/hadiths/${id}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken },
    });
    if (res.ok) {
      await onContentMutated();
      showMsg(lang === 'bn' ? 'হাদিস মুছে ফেলা হয়েছে।' : 'Hadith deleted.');
    }
  };

  const handleAddDua = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/duas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        category: duaCategory,
        title_bn: duaTitleBn,
        title_en: duaTitleEn,
        arabic: duaArabic,
        pronunciation_bn: duaPronBn,
        pronunciation_en: duaPronEn,
        meaning_bn: duaMeaningBn,
        meaning_en: duaMeaningEn,
        reference: duaRef,
      }),
    });
    try {
      await safeReadJson(res, 'Failed to add dua');
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'Failed to add dua');
      return;
    }
    setDuaTitleBn('');
    setDuaTitleEn('');
    setDuaArabic('');
    setDuaPronBn('');
    setDuaPronEn('');
    setDuaMeaningBn('');
    setDuaMeaningEn('');
    await onContentMutated();
    showMsg(lang === 'bn' ? 'দোয়া সফলভাবে যুক্ত হয়েছে।' : 'Dua added successfully.');
  };

  const handleDeleteDua = async (id: number) => {
    const res = await fetch(`/api/admin/duas/${id}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken },
    });
    if (res.ok) {
      await onContentMutated();
      showMsg(lang === 'bn' ? 'দোয়া মুছে ফেলা হয়েছে।' : 'Dua deleted.');
    }
  };

  if (checkingAuth) {
    return (
      <div className="max-w-md mx-auto py-16 text-center text-sm text-[#5a7066]">
        {lang === 'bn' ? 'লোড হচ্ছে...' : 'Checking session...'}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-14">
        <div className="bg-white rounded-2xl border border-[#dce7e0] p-8">
          <div className="w-11 h-11 rounded-xl bg-[#eef5f0] text-[#087653] flex items-center justify-center mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#183027]">
            {lang === 'bn' ? 'অ্যাডমিন লগইন' : 'Admin CMS Sign In'}
          </h1>
          <p className="text-sm text-[#5a7066] mt-1">
            {lang === 'bn'
              ? 'কুরআন, হাদিস ও দোয়া কনটেন্ট পরিচালনা করতে সাইন ইন করুন।'
              : 'Sign in to manage Quran Ayahs, Sahih Hadiths, and Daily Duas.'}
          </p>

          <div className="mt-4 p-3 rounded-xl bg-[#f7faf8] border border-[#dce7e0] text-xs text-[#5a7066]">
            <p className="font-semibold text-[#183027]">
              {lang === 'bn' ? 'ডেমো অ্যাডমিন তথ্য:' : 'Seeded Admin Credentials:'}
            </p>
            <p className="font-mono-tabular mt-0.5">
              admin@islamiclife.com / Admin@123
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-[#183027]">
              <span>{lang === 'bn' ? 'ইমেইল' : 'Email'}</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-[#183027]">
              <span>{lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              />
            </label>

            {authError && (
              <p role="alert" className="text-xs font-medium text-red-700 bg-red-50 p-2.5 rounded-lg">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-[#087653] hover:bg-[#064b37] text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {submitting
                ? lang === 'bn'
                  ? 'যাচাই করা হচ্ছে...'
                  : 'Signing in...'
                : lang === 'bn'
                ? 'লগইন করুন'
                : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#183027]">
            {lang === 'bn' ? 'অ্যাডমিন কনটেন্ট ম্যানেজমেন্ট' : 'Admin Content Management'}
          </h1>
          <p className="text-sm text-[#5a7066] mt-0.5">
            {user.name} · {user.email}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#dce7e0] bg-white hover:border-red-600 text-sm font-medium text-[#183027] cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{lang === 'bn' ? 'লগআউট' : 'Sign Out'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="inline-flex p-1 bg-[#eef5f0] rounded-xl gap-1 flex-wrap">
        {(
          [
            ['dashboard', lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'],
            ['quran', lang === 'bn' ? 'কুরআন ম্যানেজ' : 'Manage Quran'],
            ['hadith', lang === 'bn' ? 'হাদিস ম্যানেজ' : 'Manage Hadith'],
            ['dua', lang === 'bn' ? 'দোয়া ম্যানেজ' : 'Manage Dua'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === id ? 'bg-white text-[#087653] shadow-sm font-semibold' : 'text-[#5a7066]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {feedback && (
        <div role="status" className="p-3 rounded-xl bg-[#eef5f0] border border-[#087653] text-sm font-medium text-[#064b37]">
          {feedback}
        </div>
      )}

      {tab === 'dashboard' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: lang === 'bn' ? 'মোট সূরা' : 'Total Surahs', val: surahs.length },
            { label: lang === 'bn' ? 'সংরক্ষিত আয়াত' : 'Stored Ayahs', val: ayahs.length },
            { label: lang === 'bn' ? 'সহিহ হাদিস' : 'Published Hadiths', val: hadiths.length },
            { label: lang === 'bn' ? 'দৈনন্দিন দোয়া' : 'Daily Duas', val: duas.length },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-[#dce7e0] p-6">
              <p className="text-sm text-[#5a7066]">{stat.label}</p>
              <p className="font-mono-tabular text-3xl font-bold text-[#087653] mt-2">
                {stat.val}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'quran' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddAyah}
            className="lg:col-span-5 bg-white rounded-2xl border border-[#dce7e0] p-6 space-y-4"
          >
            <h2 className="text-lg font-bold text-[#183027]">
              {lang === 'bn' ? 'নতুন আয়াত যুক্ত করুন' : 'Add Quran Ayah'}
            </h2>
            <label className="block text-sm font-medium">
              <span>{lang === 'bn' ? 'সূরা নির্বাচন' : 'Surah'}</span>
              <select
                value={surahId}
                onChange={(e) => setSurahId(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              >
                {surahs.map((s) => (
                  <option key={s.surah_number} value={s.surah_number}>
                    {s.surah_number}. {lang === 'bn' ? s.name_bn : s.name_en}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              <span>{lang === 'bn' ? 'আয়াত নম্বর' : 'Ayah Number'}</span>
              <input
                type="number"
                min={1}
                required
                value={ayahNum}
                onChange={(e) => setAyahNum(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              />
            </label>
            <label className="block text-sm font-medium">
              <span>{lang === 'bn' ? 'আরবি আয়াত' : 'Arabic Text'}</span>
              <textarea
                required
                rows={2}
                value={ayahArabic}
                onChange={(e) => setAyahArabic(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm font-arabic"
              />
            </label>
            <label className="block text-sm font-medium">
              <span>{lang === 'bn' ? 'বাংলা অনুবাদ' : 'Bengali Translation'}</span>
              <textarea
                rows={2}
                value={ayahBn}
                onChange={(e) => setAyahBn(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              />
            </label>
            <label className="block text-sm font-medium">
              <span>{lang === 'bn' ? 'ইংরেজি অনুবাদ' : 'English Translation'}</span>
              <textarea
                rows={2}
                value={ayahEn}
                onChange={(e) => setAyahEn(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              />
            </label>
            <label className="block text-sm font-medium">
              <span>{lang === 'bn' ? 'সংক্ষিপ্ত তাফসির (ঐচ্ছিক)' : 'Short Tafsir (Optional)'}</span>
              <textarea
                rows={2}
                value={ayahShortTafsirBn}
                onChange={(e) => setAyahShortTafsirBn(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              />
            </label>
            <label className="block text-sm font-medium">
              <span>{lang === 'bn' ? 'বিস্তারিত তাফসির (ঐচ্ছিক)' : 'Detailed Tafsir (Optional)'}</span>
              <textarea
                rows={2}
                value={ayahTafsirBn}
                onChange={(e) => setAyahTafsirBn(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              />
            </label>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#087653] text-white text-sm font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? 'আয়াত সংরক্ষণ করুন' : 'Save Ayah'}</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#dce7e0] p-6 max-h-[540px] overflow-y-auto divide-y divide-[#eef5f0]">
            {ayahs.map((a) => (
              <div key={a.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-mono-tabular font-semibold text-[#087653]">
                    Surah {a.surah_id} : Ayah {a.ayah_number}
                  </p>
                  <p className="font-arabic text-lg text-[#183027] mt-1">{a.arabic}</p>
                  <p className="text-xs text-[#5a7066] mt-1">
                    {lang === 'bn' ? a.translation_bn : a.translation_en}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteAyah(a.id)}
                  aria-label={`Delete Ayah ${a.surah_id}:${a.ayah_number}`}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'hadith' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddHadith}
            className="lg:col-span-5 bg-white rounded-2xl border border-[#dce7e0] p-6 space-y-3"
          >
            <h2 className="text-lg font-bold text-[#183027]">
              {lang === 'bn' ? 'নতুন হাদিস যুক্ত করুন' : 'Add Sahih Hadith'}
            </h2>
            <label className="block text-xs font-medium">
              <span>{lang === 'bn' ? 'শিরোনাম (বাংলা)' : 'Title (Bengali)'}</span>
              <input
                type="text"
                value={hadithTitleBn}
                onChange={(e) => setHadithTitleBn(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              />
            </label>
            <label className="block text-xs font-medium">
              <span>{lang === 'bn' ? 'শিরোনাম (ইংরেজি)' : 'Title (English)'}</span>
              <input
                type="text"
                required
                value={hadithTitleEn}
                onChange={(e) => setHadithTitleEn(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium">
                <span>{lang === 'bn' ? 'সূত্র (গ্রন্থ)' : 'Source'}</span>
                <input
                  type="text"
                  required
                  value={hadithSource}
                  onChange={(e) => setHadithSource(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
                />
              </label>
              <label className="block text-xs font-medium">
                <span>{lang === 'bn' ? 'হাদিস নম্বর' : 'Hadith #'}</span>
                <input
                  type="text"
                  value={hadithNumber}
                  onChange={(e) => setHadithNumber(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
                />
              </label>
            </div>
            <label className="block text-xs font-medium">
              <span>{lang === 'bn' ? 'বিষয় / ক্যাটাগরি' : 'Category'}</span>
              <input
                type="text"
                value={hadithCategory}
                onChange={(e) => setHadithCategory(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              />
            </label>
            <label className="block text-xs font-medium">
              <span>{lang === 'bn' ? 'আরবি মতন' : 'Arabic Text'}</span>
              <textarea
                rows={2}
                value={hadithArabic}
                onChange={(e) => setHadithArabic(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm font-arabic"
              />
            </label>
            <label className="block text-xs font-medium">
              <span>{lang === 'bn' ? 'বাংলা অনুবাদ' : 'Bengali Translation'}</span>
              <textarea
                rows={2}
                value={hadithBn}
                onChange={(e) => setHadithBn(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              />
            </label>
            <label className="block text-xs font-medium">
              <span>{lang === 'bn' ? 'ইংরেজি অনুবাদ' : 'English Translation'}</span>
              <textarea
                required
                rows={2}
                value={hadithEn}
                onChange={(e) => setHadithEn(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              />
            </label>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#087653] text-white text-sm font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? 'হাদিস সংরক্ষণ করুন' : 'Save Hadith'}</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#dce7e0] p-6 max-h-[560px] overflow-y-auto divide-y divide-[#eef5f0]">
            {hadiths.map((h) => (
              <div key={h.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-[#5a7066]">
                    {h.source} #{h.hadith_number} · {h.category}
                  </p>
                  <p className="font-semibold text-[#183027]">
                    {lang === 'bn' ? h.title_bn : h.title_en}
                  </p>
                  <p className="text-xs text-[#5a7066] mt-1">
                    {lang === 'bn' ? h.translation_bn : h.translation_en}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteHadith(h.id)}
                  aria-label={`Delete Hadith '${h.title_en}'`}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'dua' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddDua}
            className="lg:col-span-5 bg-white rounded-2xl border border-[#dce7e0] p-6 space-y-3"
          >
            <h2 className="text-lg font-bold text-[#183027]">
              {lang === 'bn' ? 'নতুন দোয়া যুক্ত করুন' : 'Add Daily Dua'}
            </h2>
            <label className="block text-xs font-medium">
              <span>{lang === 'bn' ? 'শিরোনাম (বাংলা)' : 'Title (Bengali)'}</span>
              <input
                type="text"
                value={duaTitleBn}
                onChange={(e) => setDuaTitleBn(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              />
            </label>
            <label className="block text-xs font-medium">
              <span>{lang === 'bn' ? 'শিরোনাম (ইংরেজি)' : 'Title (English)'}</span>
              <input
                type="text"
                required
                value={duaTitleEn}
                onChange={(e) => setDuaTitleEn(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium">
                <span>{lang === 'bn' ? 'বিভাগ' : 'Category'}</span>
                <input
                  type="text"
                  value={duaCategory}
                  onChange={(e) => setDuaCategory(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
                />
              </label>
              <label className="block text-xs font-medium">
                <span>{lang === 'bn' ? 'রেফারেন্স' : 'Reference'}</span>
                <input
                  type="text"
                  value={duaRef}
                  onChange={(e) => setDuaRef(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
                />
              </label>
            </div>
            <label className="block text-xs font-medium">
              <span>{lang === 'bn' ? 'আরবি দোয়া' : 'Arabic Text'}</span>
              <textarea
                required
                rows={2}
                value={duaArabic}
                onChange={(e) => setDuaArabic(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm font-arabic"
              />
            </label>
            <label className="block text-xs font-medium">
              <span>{lang === 'bn' ? 'বাংলা অর্থ' : 'Bengali Meaning'}</span>
              <textarea
                rows={2}
                value={duaMeaningBn}
                onChange={(e) => setDuaMeaningBn(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              />
            </label>
            <label className="block text-xs font-medium">
              <span>{lang === 'bn' ? 'ইংরেজি অর্থ' : 'English Meaning'}</span>
              <textarea
                required
                rows={2}
                value={duaMeaningEn}
                onChange={(e) => setDuaMeaningEn(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm"
              />
            </label>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#087653] text-white text-sm font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? 'দোয়া সংরক্ষণ করুন' : 'Save Dua'}</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#dce7e0] p-6 max-h-[560px] overflow-y-auto divide-y divide-[#eef5f0]">
            {duas.map((d) => (
              <div key={d.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-[#5a7066]">
                    {d.category} · {d.reference}
                  </p>
                  <p className="font-semibold text-[#183027]">
                    {lang === 'bn' ? d.title_bn : d.title_en}
                  </p>
                  <p className="font-arabic text-base text-[#087653] mt-1">{d.arabic}</p>
                  <p className="text-xs text-[#5a7066] mt-1">
                    {lang === 'bn' ? d.meaning_bn : d.meaning_en}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteDua(d.id)}
                  aria-label={`Delete Dua '${d.title_en}'`}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
