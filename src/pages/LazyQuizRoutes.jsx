import React, { Suspense, lazy } from 'react';

const FlagQuiz = lazy(() => import('./quizzes/FlagQuiz'));
const CapitalQuiz = lazy(() => import('./quizzes/CapitalQuiz'));
const LanguageQuiz = lazy(() => import('./quizzes/LanguageQuiz'));
const TimezoneQuiz = lazy(() => import('./quizzes/TimezoneQuiz'));
const PopulationQuiz = lazy(() => import('./quizzes/PopulationQuiz'));
const CurrencyQuiz = lazy(() => import('./quizzes/CurrencyQuiz'));
const IndianStatesQuiz = lazy(() => import('./quizzes/IndianStatesQuiz'));
const WordleQuiz = lazy(() => import('./quizzes/WordleQuiz'));
const AllFlagsQuiz = lazy(() => import('./quizzes/AllFlagsQuiz'));
const ShapeQuiz = lazy(() => import('./quizzes/ShapeQuiz'));
const UsFactsQuiz = lazy(() => import('./quizzes/UsFactsQuiz'));
const UsStateFlagQuiz = lazy(() => import('./quizzes/UsStateFlagQuiz'));
const FactOfTheDay = lazy(() => import('./FactOfTheDay'));

export function LazyQuizRoutes({ route }) {
    switch (route) {
        case 'flags':
            return <Suspense fallback={<div>Loading…</div>}><FlagQuiz /></Suspense>;
        case 'capitals':
            return <Suspense fallback={<div>Loading…</div>}><CapitalQuiz /></Suspense>;
        case 'languages':
            return <Suspense fallback={<div>Loading…</div>}><LanguageQuiz /></Suspense>;
        case 'timezones':
            return <Suspense fallback={<div>Loading…</div>}><TimezoneQuiz /></Suspense>;
        case 'population':
            return <Suspense fallback={<div>Loading…</div>}><PopulationQuiz /></Suspense>;
        case 'currencies':
            return <Suspense fallback={<div>Loading…</div>}><CurrencyQuiz /></Suspense>;
        case 'indian-states':
            return <Suspense fallback={<div>Loading…</div>}><IndianStatesQuiz /></Suspense>;
        case 'wordle':
            return <Suspense fallback={<div>Loading…</div>}><WordleQuiz /></Suspense>;
        case 'all-flags':
            return <Suspense fallback={<div>Loading…</div>}><AllFlagsQuiz /></Suspense>;
        case 'shapes':
            return <Suspense fallback={<div>Loading…</div>}><ShapeQuiz /></Suspense>;
        case 'us-facts':
            return <Suspense fallback={<div>Loading…</div>}><UsFactsQuiz /></Suspense>;
        case 'us-state-flag':
            return <Suspense fallback={<div>Loading…</div>}><UsStateFlagQuiz /></Suspense>;
        case 'fact':
            return <Suspense fallback={<div>Loading…</div>}><FactOfTheDay /></Suspense>;
        default:
            return null;
    }
}