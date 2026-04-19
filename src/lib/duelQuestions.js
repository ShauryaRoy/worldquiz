import { countries } from '@/data/countries';

// ── Seeded PRNG (Mulberry32) ──────────────────────────────
const mulberry32 = (seed) => {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = (arr, rng = Math.random) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const getDaySeed = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

// ── Quiz types available in duel / daily mode ─────────────
export const DUEL_QUIZ_TYPES = [
  { value: 'capitals',  label: 'Capital Cities', emoji: '🏛️' },
  { value: 'flags',     label: 'Flag Quiz',       emoji: '🚩' },
  { value: 'currencies',label: 'Currencies',      emoji: '💰' },
  { value: 'languages', label: 'Languages',       emoji: '🗣️' },
];

// ── Helpers ───────────────────────────────────────────────
const getField = (country, quizType) => {
  switch (quizType) {
    case 'capitals':  return country.capital;
    case 'flags':     return country.country; // answer = country name
    case 'currencies':return country.currency;
    case 'languages': return country.language;
    default:          return country.capital;
  }
};

const isValid = (country, quizType) => {
  const f = getField(country, quizType);
  return Boolean(f && String(f).trim());
};

// ── Core question generator ────────────────────────────────
export const generateDuelQuestions = (quizType = 'capitals', count = 10, seed = null) => {
  const rng = seed !== null ? mulberry32(seed) : Math.random;
  const pool = countries.filter(c => isValid(c, quizType));
  const selected = shuffle(pool, rng).slice(0, count);

  return selected.map(country => {
    const correct = getField(country, quizType);

    let questionText;
    switch (quizType) {
      case 'capitals':   questionText = `What is the capital of ${country.country}?`;     break;
      case 'flags':      questionText = `Which country does this flag belong to?`;         break;
      case 'currencies': questionText = `What currency does ${country.country} use?`;      break;
      case 'languages':  questionText = `What is the official language of ${country.country}?`; break;
      default:           questionText = `What is the capital of ${country.country}?`;
    }

    const wrongPool = pool.filter(c => getField(c, quizType) !== correct);
    const wrongOptions = shuffle(wrongPool, rng).slice(0, 3).map(c => getField(c, quizType));
    const options = shuffle([correct, ...wrongOptions], rng);

    return {
      questionText,
      correct,
      options,
      quizType,
      flagUrl: quizType === 'flags' ? country.flag : null,
      countryName: country.country,
    };
  });
};

// ── Daily challenge ────────────────────────────────────────
export const getDailyQuizInfo = () => {
  const seed = getDaySeed();
  const rng  = mulberry32(seed);
  const typeIndex = Math.floor(rng() * DUEL_QUIZ_TYPES.length);
  const quizType  = DUEL_QUIZ_TYPES[typeIndex].value;
  const today     = new Date();
  const dateStr   = today.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  return { quizType, dateStr, seed };
};

export const generateDailyQuestions = (count = 10) => {
  const { quizType, seed } = getDailyQuizInfo();
  return { questions: generateDuelQuestions(quizType, count, seed + 1), quizType };
};
