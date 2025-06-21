const fs = require('fs');
const path = require('path');

const baseUrl = 'https://www.worldquiz.fun';

function getQuizRoutes() {
    const quizDir = path.resolve(__dirname, '../src/pages/quizzes');
    if (!fs.existsSync(quizDir)) return [];
    return fs.readdirSync(quizDir)
        .filter(file => file.endsWith('.jsx'))
        .map(file => {
            const name = file.replace(/\.jsx$/, '').toLowerCase();
            if (name === 'wordlequiz') return '/quiz/wordle';
            if (name === 'allflagsquiz') return '/quiz/all-flags';
            if (name === 'capitalquiz') return '/quiz/capitals';
            if (name === 'currencyquiz') return '/quiz/currencies';
            if (name === 'emojiquiz') return '/quiz/emoji';
            if (name === 'flagquiz') return '/quiz/flags';
            if (name === 'indianstatesquiz') return '/quiz/indian-states';
            if (name === 'languagequiz') return '/quiz/languages';
            if (name === 'populationquiz') return '/quiz/population';
            if (name === 'shapequiz') return '/quiz/shapes';
            if (name === 'timezonequiz') return '/quiz/timezones';
            if (name === 'usfactsquiz') return '/quiz/fact';
            if (name === 'usstateflagquiz') return '/quiz/us-state-flag';
            return `/quiz/${name}`;
        });
}

const staticRoutes = [
    '/',
    '/leaderboard',
    '/quiz-leaderboard'
];

const allRoutes = [...staticRoutes, ...getQuizRoutes()];

const urls = allRoutes.map(route => `\n  <url>\n    <loc>${baseUrl}${route}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${route === '/' ? '1.0' : '0.7'}</priority>\n  </url>`).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

fs.writeFileSync(path.resolve(__dirname, '../dist/sitemap.xml'), sitemap);
console.log('Sitemap generated with routes:', allRoutes);
