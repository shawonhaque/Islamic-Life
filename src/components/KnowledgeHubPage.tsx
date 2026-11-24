import { useMemo, useState } from 'react';
import {
  Atom,
  BookOpen,
  ChevronDown,
  Heart,
  History,
  Landmark,
  Play,
  Scale,
  Search,
  Sparkles,
  Sunrise,
  X,
} from 'lucide-react';
import {
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_INTRO_BN,
  KNOWLEDGE_INTRO_EN,
  LECTURE_VIDEOS,
} from '../data/islamicKnowledge';
import type { Language } from '../types/islamic';

interface KnowledgeHubPageProps {
  lang: Language;
}

const CATEGORY_ICONS: Record<string, typeof Heart> = {
  aqeedah: Heart,
  ibadah: Landmark,
  sources: BookOpen,
  history: History,
  muamalat: Scale,
  akhlaq: Sparkles,
  dua: Sunrise,
  science: Atom,
};

export function KnowledgeHubPage({ lang }: KnowledgeHubPageProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openArticle, setOpenArticle] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [view, setView] = useState<'articles' | 'videos'>('articles');

  const term = query.trim().toLowerCase();

  const categories = useMemo(() => {
    const scoped =
      activeCategory === 'all'
        ? KNOWLEDGE_CATEGORIES
        : KNOWLEDGE_CATEGORIES.filter((c) => c.id === activeCategory);

    if (!term) return scoped;

    return scoped
      .map((cat) => ({
        ...cat,
        articles: cat.articles.filter((a) =>
          [a.title_bn, a.title_en, a.content_bn, a.content_en, a.reference, ...a.tags]
            .join(' ')
            .toLowerCase()
            .includes(term)
        ),
      }))
      .filter((cat) => cat.articles.length > 0);
  }, [activeCategory, term]);

  const videos = useMemo(() => {
    if (!term) return LECTURE_VIDEOS;
    return LECTURE_VIDEOS.filter((v) =>
      [v.title_bn, v.speaker_bn, v.topic_bn].join(' ').toLowerCase().includes(term)
    );
  }, [term]);

  const totalArticles = KNOWLEDGE_CATEGORIES.reduce((n, c) => n + c.articles.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-7">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#183027]">
          {lang === 'bn' ? 'ইসলামিক জ্ঞানকোষ' : 'Islamic Knowledge'}
        </h1>
        <p className="text-[#5a7066] mt-1.5 max-w-3xl leading-relaxed">
          {lang === 'bn' ? KNOWLEDGE_INTRO_BN : KNOWLEDGE_INTRO_EN}
        </p>
        <p className="text-xs text-[#9c7524] mt-2">
          {lang === 'bn'
            ? `${KNOWLEDGE_CATEGORIES.length}টি বিভাগ · ${totalArticles}টি নিবন্ধ · ${LECTURE_VIDEOS.length}টি ভিডিও লেকচার`
            : `${KNOWLEDGE_CATEGORIES.length} categories · ${totalArticles} articles · ${LECTURE_VIDEOS.length} video lectures`}
        </p>
      </header>

      {/* Articles / lectures switch. The lecture grid used to sit below 32
          articles, three screens down, so it looked missing. */}
      <div
        role="tablist"
        className="mb-5 inline-flex gap-1 p-1 rounded-xl bg-[#eef5f0] border border-[#dce7e0]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === 'articles'}
          data-testid="knowledge-tab-articles"
          onClick={() => setView('articles')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            view === 'articles'
              ? 'bg-white text-[#087653] shadow-sm'
              : 'text-[#5a7066] hover:text-[#183027]'
          }`}
        >
          {lang === 'bn' ? `নিবন্ধ (${totalArticles})` : `Articles (${totalArticles})`}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'videos'}
          data-testid="knowledge-tab-videos"
          onClick={() => setView('videos')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            view === 'videos'
              ? 'bg-white text-[#087653] shadow-sm'
              : 'text-[#5a7066] hover:text-[#183027]'
          }`}
        >
          {lang === 'bn'
            ? `অডিও ও ভিডিও লেকচার (${LECTURE_VIDEOS.length})`
            : `Audio & Video Lectures (${LECTURE_VIDEOS.length})`}
        </button>
      </div>

      {/* Search + category filter */}
      <div className="bg-white rounded-2xl border border-[#dce7e0] p-4 sm:p-5 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#5a7066] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            data-testid="knowledge-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'নিবন্ধ, বিষয় বা ভিডিও খুঁজুন (যেমন: তাওহীদ, হজ, সীরাত)'
                : 'Search articles, topics or videos (e.g. tawhid, hajj, seerah)'
            }
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#dce7e0] bg-[#f7faf8] text-sm text-[#183027] placeholder:text-[#8a9a91] focus:outline-none focus:ring-2 focus:ring-[#087653]/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={lang === 'bn' ? 'সার্চ মুছুন' : 'Clear search'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#5a7066] hover:bg-[#eef5f0] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className={`flex flex-wrap gap-1.5 ${view === 'videos' ? 'hidden' : ''}`}>
          <button
            type="button"
            data-testid="knowledge-cat-all"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-[#087653] text-white'
                : 'bg-[#f0f4f1] text-[#5a7066] hover:text-[#183027]'
            }`}
          >
            {lang === 'bn' ? 'সব বিভাগ' : 'All categories'}
          </button>
          {KNOWLEDGE_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] ?? BookOpen;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                data-testid={`knowledge-cat-${cat.id}`}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#087653] text-white'
                    : 'bg-[#f0f4f1] text-[#5a7066] hover:text-[#183027]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {lang === 'bn' ? cat.title_bn.replace(/^\d+\.\s*/, '') : cat.title_en.replace(/^\d+\.\s*/, '')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Articles */}
      {view === 'articles' && (
      <div className="mt-6 space-y-6">
        {categories.length === 0 && (
          <p className="text-sm text-[#5a7066] bg-white border border-[#dce7e0] rounded-2xl p-6 text-center">
            {lang === 'bn' ? 'কোনো নিবন্ধ পাওয়া যায়নি।' : 'No articles matched your search.'}
          </p>
        )}

        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] ?? BookOpen;
          return (
            <section
              key={cat.id}
              data-testid={`knowledge-section-${cat.id}`}
              className="bg-white rounded-2xl border border-[#dce7e0] p-5 sm:p-6"
            >
              <div className="flex items-start gap-3 pb-4 border-b border-[#eef5f0]">
                <div className="w-10 h-10 rounded-xl bg-[#eef5f0] text-[#087653] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[#183027]">
                    {lang === 'bn' ? cat.title_bn : cat.title_en}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5a7066] mt-0.5">
                    {lang === 'bn' ? cat.summary_bn : cat.summary_en}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                {cat.articles.map((article) => {
                  const expanded = openArticle === article.id;
                  return (
                    <article
                      key={article.id}
                      className="rounded-xl border border-[#ebe6da] bg-[#faf7f0] overflow-hidden"
                    >
                      <button
                        type="button"
                        data-testid={`knowledge-article-${article.id}`}
                        onClick={() => setOpenArticle(expanded ? null : article.id)}
                        aria-expanded={expanded}
                        className="w-full flex items-start justify-between gap-3 p-4 text-left cursor-pointer hover:bg-[#f6f1e6] transition-colors"
                      >
                        <h3 className="text-sm font-bold text-[#183027] leading-snug">
                          {lang === 'bn' ? article.title_bn : article.title_en}
                        </h3>
                        <ChevronDown
                          className={`w-4 h-4 text-[#8f6319] shrink-0 mt-0.5 transition-transform ${
                            expanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {expanded && (
                        <div className="px-4 pb-4 space-y-3">
                          <p className="text-sm text-[#3c4a43] leading-relaxed whitespace-pre-line">
                            {lang === 'bn' ? article.content_bn : article.content_en}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {article.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-md bg-[#eef5f0] text-[10px] font-semibold text-[#087653]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] text-[#8f6319] border-t border-[#ebe6da] pt-2">
                            {lang === 'bn' ? 'রেফারেন্স: ' : 'Reference: '}
                            {article.reference}
                          </p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      )}

      {/* Video lectures */}
      {view === 'videos' && (
      <section
        data-testid="knowledge-videos"
        className="mt-6 bg-white rounded-2xl border border-[#dce7e0] p-5 sm:p-6"
      >
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#eef5f0]">
          <Play className="w-5 h-5 text-[#087653]" />
          <div>
            <h2 className="text-lg font-bold text-[#183027]">
              {lang === 'bn' ? 'অডিও ও ভিডিও লেকচার' : 'Audio & Video Lectures'}
            </h2>
            <p className="text-xs sm:text-sm text-[#5a7066]">
              {lang === 'bn'
                ? 'বিশুদ্ধ বাংলা ইসলামিক লেকচার — সাইট ছাড়াই এখানেই দেখুন।'
                : 'Authentic Bengali Islamic lectures, playable without leaving the site.'}
            </p>
          </div>
        </div>

        {videos.length === 0 ? (
          <p className="text-sm text-[#5a7066] py-6 text-center">
            {lang === 'bn' ? 'কোনো ভিডিও পাওয়া যায়নি।' : 'No videos matched your search.'}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                data-testid={`knowledge-video-${video.id}`}
                className="rounded-xl border border-[#ebe6da] bg-[#faf7f0] overflow-hidden"
              >
                <div className="relative aspect-video bg-[#0f3d2e]">
                  {playingVideo === video.id ? (
                    <iframe
                      title={video.title_bn}
                      src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPlayingVideo(video.id)}
                      aria-label={`${lang === 'bn' ? 'চালান' : 'Play'}: ${video.title_bn}`}
                      className="group w-full h-full flex items-center justify-center cursor-pointer"
                    >
                      <img
                        src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <span className="relative w-12 h-12 rounded-full bg-white/92 text-[#087653] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <Play className="w-5 h-5 ml-0.5" />
                      </span>
                    </button>
                  )}
                </div>
                <div className="p-3.5 space-y-1">
                  <h3 className="text-sm font-bold text-[#183027] leading-snug">
                    {video.title_bn}
                  </h3>
                  <p className="text-xs text-[#5a7066]">{video.speaker_bn}</p>
                  <span className="inline-block px-2 py-0.5 rounded-md bg-[#eef5f0] text-[10px] font-semibold text-[#087653]">
                    {video.topic_bn}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      )}
    </div>
  );
}
