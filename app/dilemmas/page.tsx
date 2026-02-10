'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Filter,
  Search,
  ArrowRight,
  Sparkles,
  Scale,
  Brain,
  Tag,
} from 'lucide-react';

type VerdictSnippet = {
  id: string;
  text: string;
};

type PublicDilemma = {
  id: string;
  category: 'appearance' | 'dating' | 'career' | 'writing' | 'decision';
  subcategory?: string;
  question: string;
  context?: string;
  stakes?: string;
  verdictSnippets: VerdictSnippet[];
  verdictSummary: string; // e.g. "2–1 YES"
  verdictType: 'yes' | 'no' | 'split';
  tags: string[];
  createdAt: string;
  displayDate: string; // preformatted, avoids Date locale hydration issues
};

// Temporary mocked data for UX/dev – replace with real API later.
const MOCK_DILEMMAS: PublicDilemma[] = [
  {
    id: '1',
    category: 'career',
    subcategory: 'job-offer',
    question: 'Should I take a 20% pay cut to join a startup?',
    context:
      "I'm mid‑career with a mortgage and two kids. Current job is stable but feels stagnant. The startup has strong traction but higher risk.",
    stakes: 'Leaving a stable job with a family to bet on a risky but exciting startup.',
    verdictSnippets: [
      {
        id: 'v1',
        text: 'Yes — the learning and upside early on are worth more than a short‑term salary dip.',
      },
      {
        id: 'v2',
        text: 'No — your financial stress will sabotage the experience. Negotiate or wait for a better offer.',
      },
      {
        id: 'v3',
        text: 'Yes — if you build a 6‑month runway and agree clear milestones with the founder.',
      },
    ],
    verdictSummary: '2–1 YES',
    verdictType: 'split',
    tags: ['startup', 'job offer', 'risk vs stability'],
    createdAt: '2025-01-05T10:00:00.000Z',
    displayDate: 'Jan 5',
  },
  {
    id: '2',
    category: 'dating',
    subcategory: 'profile',
    question: 'Is this dating profile too try‑hard?',
    context:
      'I rewrote my profile to be funny and self‑aware, but I worry it might come off as insecure or cringe.',
    stakes: 'How you come across to every future match on the app.',
    verdictSnippets: [
      {
        id: 'v1',
        text: "Yes — dial back the self‑deprecation. One joke is charming; five feels like a defence mechanism.",
      },
      {
        id: 'v2',
        text: 'No — the humour works, but you need one clear line about what you actually want.',
      },
      {
        id: 'v3',
        text: 'Yes — cut 30%. Keep the strongest two lines and add one sincere detail about your life.',
      },
    ],
    verdictSummary: '3–0 YES (edit it)',
    verdictType: 'yes',
    tags: ['dating profile', 'tone', 'self‑presentation'],
    createdAt: '2025-01-04T19:30:00.000Z',
    displayDate: 'Jan 4',
  },
  {
    id: '3',
    category: 'appearance',
    subcategory: 'interview-outfit',
    question: 'Is this outfit too casual for a product interview at a startup?',
    context:
      'Black jeans, white sneakers, grey t‑shirt, navy blazer. Interview is with a VP Product at a Series B startup.',
    stakes: 'First in‑person interview in years at a company you really want.',
    verdictSnippets: [
      {
        id: 'v1',
        text: 'No — this is the default uniform for modern tech. You look intentional, not sloppy.',
      },
      {
        id: 'v2',
        text: 'Yes — swap the t‑shirt for an Oxford or knit polo to signal effort.',
      },
      {
        id: 'v3',
        text: 'No — but steam the blazer and tuck in the shirt; details matter in person.',
      },
    ],
    verdictSummary: '2–1 NO (but tidy it)',
    verdictType: 'no',
    tags: ['interview', 'outfit', 'startup'],
    createdAt: '2025-01-03T15:20:00.000Z',
    displayDate: 'Jan 3',
  },
  {
    id: '4',
    category: 'decision',
    subcategory: 'relationship',
    question: 'Should I move back in with my ex while we “figure things out”?',
    context:
      'We broke up 3 months ago but never fully detached. She suggested living together again to see if we can fix it.',
    stakes: 'Risking another painful breakup and financial/ emotional entanglement.',
    verdictSnippets: [
      {
        id: 'v1',
        text: 'No — moving back in raises the stakes before you’ve fixed the foundation.',
      },
      {
        id: 'v2',
        text: "No — do 3 months of therapy and dating intentionally *apart* before sharing a lease again.",
      },
      {
        id: 'v3',
        text: 'No — treat the breakup as real unless both of you commit to concrete changes.',
      },
    ],
    verdictSummary: '3–0 NO',
    verdictType: 'no',
    tags: ['breakup', 'boundaries', 'cohabiting'],
    createdAt: '2025-01-02T09:00:00.000Z',
    displayDate: 'Jan 2',
  },
  {
    id: '5',
    category: 'writing',
    subcategory: 'email',
    question: 'Is this follow‑up email too pushy after a job interview?',
    context:
      'I interviewed 6 days ago and heard nothing. I drafted a short check‑in email but worry it sounds desperate.',
    stakes: 'Whether you stay top‑of‑mind for a role you actually want.',
    verdictSnippets: [
      {
        id: 'v1',
        text: 'No — it’s concise and polite. The real risk is never following up.',
      },
      {
        id: 'v2',
        text: 'Yes — remove the line apologising for “bothering” them. You’re not.',
      },
      {
        id: 'v3',
        text: 'No — send it once, then emotionally move on unless they respond.',
      },
    ],
    verdictSummary: '2–1 NO (send it)',
    verdictType: 'split',
    tags: ['follow‑up', 'email', 'job search'],
    createdAt: '2025-01-01T12:00:00.000Z',
    displayDate: 'Jan 1',
  },
];

const CATEGORY_LABELS: Record<PublicDilemma['category'], string> = {
  appearance: 'Appearance',
  dating: 'Dating',
  career: 'Career',
  writing: 'Writing',
  decision: 'Life Decisions',
};

type SortOption = 'recent' | 'split' | 'unanimous';
type Guess = 'yes' | 'no' | 'depends' | null;

function verdictLabel(verdictType: PublicDilemma['verdictType']) {
  if (verdictType === 'yes') return 'Everyone leaned YES';
  if (verdictType === 'no') return 'Everyone leaned NO';
  return 'Split verdict';
}

function DilemmaCard({ dilemma }: { dilemma: PublicDilemma }) {
  const [guess, setGuess] = useState<Guess>(null);
  const [revealed, setRevealed] = useState(false);

  const handleGuess = (value: Guess) => {
    setGuess(value);
    setRevealed(true);
  };

  const guessedCorrectly =
    revealed &&
    ((guess === 'yes' && dilemma.verdictType === 'yes') ||
      (guess === 'no' && dilemma.verdictType === 'no') ||
      (guess === 'depends' && dilemma.verdictType === 'split'));

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      {/* Meta */}
      <div className="mb-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
        <div className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          <span className="font-medium">
            {CATEGORY_LABELS[dilemma.category]}
          </span>
          {dilemma.subcategory && (
            <span className="text-slate-400">
              · {dilemma.subcategory.replace('-', ' ')}
            </span>
          )}
        </div>
        <span>{dilemma.displayDate}</span>
      </div>

      {/* Question */}
      <div className="mb-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Someone asked:
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900">
          {dilemma.question}
        </p>
        {dilemma.context && (
          <p className="mt-2 line-clamp-3 text-xs text-slate-600">
            <span className="font-medium text-slate-500">Context: </span>
            {dilemma.context}
          </p>
        )}
        {dilemma.stakes && (
          <p className="mt-2 text-[11px] text-amber-700 bg-amber-50/70 border border-amber-100 rounded-md px-2 py-1">
            <span className="font-semibold">Stakes: </span>
            {dilemma.stakes}
          </p>
        )}
      </div>

      {/* Guess row */}
      <div className="mb-3 rounded-lg bg-slate-50/90 p-3">
        <p className="mb-2 text-[11px] font-medium text-slate-700">
          Before you see the verdicts, what would <span className="font-semibold">you</span> say?
        </p>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => handleGuess('yes')}
            className={`rounded-full px-3 py-1 font-medium transition ${
              guess === 'yes'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            I&apos;d say YES
          </button>
          <button
            type="button"
            onClick={() => handleGuess('no')}
            className={`rounded-full px-3 py-1 font-medium transition ${
              guess === 'no'
                ? 'bg-rose-600 text-white'
                : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            I&apos;d say NO
          </button>
          <button
            type="button"
            onClick={() => handleGuess('depends')}
            className={`rounded-full px-3 py-1 font-medium transition ${
              guess === 'depends'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            It depends
          </button>
        </div>
        {!revealed && (
          <p className="mt-2 text-[11px] text-slate-500">
            Tap a choice to reveal what three strangers actually said.
          </p>
        )}
        {revealed && (
          <p
            className={`mt-2 text-[11px] font-medium ${
              guessedCorrectly ? 'text-emerald-700' : 'text-slate-600'
            }`}
          >
            {guessedCorrectly
              ? 'You and the judges were aligned.'
              : 'See how your instinct compares to the judges.'}
          </p>
        )}
      </div>

      {/* Verdict snippets */}
      {revealed && (
        <div className="mb-3 space-y-2 rounded-lg bg-slate-50/80 p-3">
          {dilemma.verdictSnippets.slice(0, 3).map((v, index) => (
            <p key={v.id} className="text-[11px] text-slate-700">
              <span className="font-semibold text-slate-800">
                Judge {index + 1}:{' '}
              </span>
              {v.text}
            </p>
          ))}
        </div>
      )}

      {/* Summary & footer */}
      <div className="mt-auto border-t border-slate-100 pt-3">
        <div className="mb-2 flex items-center justify-between text-[11px]">
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 font-semibold ${
              dilemma.verdictType === 'yes'
                ? 'bg-emerald-50 text-emerald-700'
                : dilemma.verdictType === 'no'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {dilemma.verdictSummary} · {verdictLabel(dilemma.verdictType)}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 opacity-0 transition group-hover:opacity-100">
            What would you say now?
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {dilemma.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
            >
              <Tag className="h-2.5 w-2.5 text-slate-400" />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function DilemmasPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<PublicDilemma['category'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    let list = [...MOCK_DILEMMAS];

    if (selectedCategory !== 'all') {
      list = list.filter((d) => d.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (d) =>
          d.question.toLowerCase().includes(q) ||
          d.context?.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    switch (sortBy) {
      case 'split':
        list.sort((a, b) => {
          const aSplit = a.verdictType === 'split' ? 1 : 0;
          const bSplit = b.verdictType === 'split' ? 1 : 0;
          if (aSplit !== bSplit) return bSplit - aSplit;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        break;
      case 'unanimous':
        list.sort((a, b) => {
          const aUni = a.verdictSummary.startsWith('3–0') ? 1 : 0;
          const bUni = b.verdictSummary.startsWith('3–0') ? 1 : 0;
          if (aUni !== bUni) return bUni - aUni;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        break;
      case 'recent':
      default:
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        );
        break;
    }

    return list;
  }, [selectedCategory, sortBy, searchTerm]);

  const mostContested = useMemo(
    () => filtered.filter((d) => d.verdictType === 'split'),
    [filtered],
  );
  const unanimous = useMemo(
    () => filtered.filter((d) => d.verdictSummary.startsWith('3–0')),
    [filtered],
  );
  const others = useMemo(
    () =>
      filtered.filter(
        (d) =>
          !mostContested.includes(d) && !unanimous.includes(d),
      ),
    [filtered, mostContested, unanimous],
  );

  const featured =
    filtered.find((d) => d.id === '4') || filtered[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero */}
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 mb-3">
              <Sparkles className="mr-1 h-3 w-3" />
              New · Public library of dilemmas
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Real dilemmas. Honest verdicts.
            </h1>
            <p className="max-w-xl text-sm text-slate-600">
              An anonymised library of questions people wrestle with—and the
              verdicts that helped them decide. We publish dilemmas, not people.
            </p>
            <p className="mt-3 max-w-xl text-xs text-slate-600 border-l-2 border-slate-300 pl-3">
              Recent example: someone asked, &quot;Should I move back in with my ex while we
              ‘figure things out’?&quot; Three judges said absolutely not — for three different
              reasons.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link
              href="/submit"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Ask your own question
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Scale className="h-4 w-4" />
              <span>Private by default, public by choice.</span>
            </div>
          </div>
        </header>

        {/* Filters */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              {(['all', 'appearance', 'dating', 'career', 'writing', 'decision'] as const).map(
                (cat) => {
                  const isAll = cat === 'all';
                  const isActive = selectedCategory === cat;
                  const label = isAll
                    ? 'All dilemmas'
                    : CATEGORY_LABELS[cat as PublicDilemma['category']];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(
                          cat === 'all' ? 'all' : (cat as PublicDilemma['category']),
                        )
                      }
                      className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                        isAll && selectedCategory === 'all'
                          ? 'bg-slate-900 text-white'
                          : !isAll && isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                },
              )}
            </div>

            {/* Sort + search */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search dilemmas..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <div className="relative inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700">
                <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent pr-5 text-xs outline-none"
                >
                  <option value="recent">Most recent</option>
                  <option value="split">Most split</option>
                  <option value="unanimous">Most unanimous</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Feed */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
            <Brain className="mx-auto mb-4 h-8 w-8 text-slate-400" />
            <h2 className="mb-2 text-base font-semibold text-slate-900">
              No dilemmas yet.
            </h2>
            <p className="mx-auto mb-6 max-w-md text-sm text-slate-600">
              Once people choose to share their dilemmas, you&apos;ll see anonymous
              questions and verdicts appear here.
            </p>
            <Link
              href="/submit"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Be the first to ask
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <section className="space-y-8">
            {/* Featured */}
            {featured && (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-slate-900">
                  Featured dilemma
                </h2>
                <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                  <DilemmaCard dilemma={featured} />
                  <div className="rounded-2xl border border-slate-200 bg-slate-900 text-slate-50 p-4 text-xs hidden md:flex md:flex-col">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                      Why this is interesting
                    </p>
                    <p className="mb-2">
                      This is a classic head‑vs‑heart dilemma: comfort of the familiar
                      vs risk of repeating the same story. All three judges agreed on
                      &quot;no&quot; — but for different emotional reasons.
                    </p>
                    <p className="mb-2">
                      These are the kinds of questions the library is built for: messy,
                      human, and hard to ask friends about.
                    </p>
                    <p className="mt-auto text-[11px] text-slate-400">
                      You can always keep your own verdicts private — this is here
                      because someone chose to contribute their question to help
                      others.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Most contested */}
            {mostContested.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Most contested right now
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Dilemmas where judges disagreed 2–1.
                  </p>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {mostContested.map((d) => (
                    <DilemmaCard key={d.id} dilemma={d} />
                  ))}
                </div>
              </div>
            )}

            {/* Unanimous */}
            {unanimous.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">
                    When everyone agreed
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Clear 3–0 verdicts — the answer was obvious once strangers saw it.
                  </p>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {unanimous.map((d) => (
                    <DilemmaCard key={d.id} dilemma={d} />
                  ))}
                </div>
              </div>
            )}

            {/* Everything else */}
            {others.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-slate-900">
                  More dilemmas to explore
                </h2>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {others.map((d) => (
                    <DilemmaCard key={d.id} dilemma={d} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* How it works */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white/80 p-5 text-xs text-slate-600">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            How this library works
          </h2>
          <p className="mb-2">
            Verdict is a private decision coach with a public library of
            dilemmas. Users choose which questions graduate into this library,
            and only the dilemma ever does.
          </p>
          <ul className="mb-2 list-disc list-inside space-y-1">
            <li>Verdicts are private by default.</li>
            <li>
              When someone opts in, we share the dilemma and anonymised verdicts
              — never their identity.
            </li>
            <li>
              Public dilemmas are framed as “Someone asked…” so questions stay
              useful without exposing people.
            </li>
          </ul>
          <p>
            Want to keep your verdicts private? That&apos;s always the default,
            and always respected.
          </p>
        </section>
      </div>
    </div>
  );
}


