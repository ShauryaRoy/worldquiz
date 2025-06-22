import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';
import sitemap from 'vite-plugin-sitemap'; // ✅ Added for sitemap
import fs from 'fs';
import viteCompression from 'vite-plugin-compression';
import purgecss from 'vite-plugin-purgecss';
import { visualizer } from 'rollup-plugin-visualizer';

const isDev = process.env.NODE_ENV !== 'production';
let inlineEditPlugin, editModeDevPlugin;

if (isDev) {
	inlineEditPlugin = (await import('./plugins/visual-editor/vite-plugin-react-inline-editor.js')).default;
	editModeDevPlugin = (await import('./plugins/visual-editor/vite-plugin-edit-mode.js')).default;
}

const configHorizonsViteErrorHandler = `
const observer = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		for (const addedNode of mutation.addedNodes) {
			if (
				addedNode.nodeType === Node.ELEMENT_NODE &&
				(
					addedNode.tagName?.toLowerCase() === 'vite-error-overlay' ||
					addedNode.classList?.contains('backdrop')
				)
			) {
				handleViteOverlay(addedNode);
			}
		}
	}
});

observer.observe(document.documentElement, {
	childList: true,
	subtree: true
});

function handleViteOverlay(node) {
	if (!node.shadowRoot) {
		return;
	}

	const backdrop = node.shadowRoot.querySelector('.backdrop');

	if (backdrop) {
		const overlayHtml = backdrop.outerHTML;
		const parser = new DOMParser();
		const doc = parser.parseFromString(overlayHtml, 'text/html');
		const messageBodyElement = doc.querySelector('.message-body');
		const fileElement = doc.querySelector('.file');
		const messageText = messageBodyElement ? messageBodyElement.textContent.trim() : '';
		const fileText = fileElement ? fileElement.textContent.trim() : '';
		const error = messageText + (fileText ? ' File:' + fileText : '');

		window.parent.postMessage({
			type: 'horizons-vite-error',
			error,
		}, '*');
	}
}
`;

const configHorizonsRuntimeErrorHandler = `
window.onerror = (message, source, lineno, colno, errorObj) => {
	const errorDetails = errorObj ? JSON.stringify({
		name: errorObj.name,
		message: errorObj.message,
		stack: errorObj.stack,
		source,
		lineno,
		colno,
	}) : null;

	window.parent.postMessage({
		type: 'horizons-runtime-error',
		message,
		error: errorDetails
	}, '*');
};
`;

const configHorizonsConsoleErrroHandler = `
const originalConsoleError = console.error;
console.error = function(...args) {
	originalConsoleError.apply(console, args);

	let errorString = '';

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg instanceof Error) {
			errorString = arg.stack || \`\${arg.name}: \${arg.message}\`;
			break;
		}
	}

	if (!errorString) {
		errorString = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
	}

	window.parent.postMessage({
		type: 'horizons-console-error',
		error: errorString
	}, '*');
};
`;

const configWindowFetchMonkeyPatch = `
const originalFetch = window.fetch;

window.fetch = function(...args) {
	const url = args[0] instanceof Request ? args[0].url : args[0];

	// Skip WebSocket URLs
	if (url.startsWith('ws:') || url.startsWith('wss:')) {
		return originalFetch.apply(this, args);
	}

	return originalFetch.apply(this, args)
		.then(async response => {
			const contentType = response.headers.get('Content-Type') || '';

			// Exclude HTML document responses
			const isDocumentResponse =
				contentType.includes('text/html') ||
				contentType.includes('application/xhtml+xml');

			if (!response.ok && !isDocumentResponse) {
					const responseClone = response.clone();
					const errorFromRes = await responseClone.text();
					const requestUrl = response.url;
					console.error(\`Fetch error from \${requestUrl}: \${errorFromRes}\`);
			}

			return response;
		})
		.catch(error => {
			if (!url.match(/\.html?$/i)) {
				console.error(error);
			}

			throw error;
		});
};
`;

const addTransformIndexHtml = {
	name: 'add-transform-index-html',
	transformIndexHtml(html) {
		return {
			html,
			tags: [
				{
					tag: 'script',
					attrs: { type: 'module' },
					children: configHorizonsRuntimeErrorHandler,
					injectTo: 'head',
				},
				{
					tag: 'script',
					attrs: { type: 'module' },
					children: configHorizonsViteErrorHandler,
					injectTo: 'head',
				},
				{
					tag: 'script',
					attrs: { type: 'module' },
					children: configHorizonsConsoleErrroHandler,
					injectTo: 'head',
				},
				{
					tag: 'script',
					attrs: { type: 'module' },
					children: configWindowFetchMonkeyPatch,
					injectTo: 'head',
				},
			],
		};
	},
};

console.warn = () => { };

const logger = createLogger()
const loggerError = logger.error

logger.error = (msg, options) => {
	if (options?.error?.toString().includes('CssSyntaxError: [postcss]')) {
		return;
	}

	loggerError(msg, options);
}

// Helper to get quiz routes dynamically
function getQuizRoutes() {
	const quizDir = path.resolve(__dirname, 'src/pages/quizzes');
	if (!fs.existsSync(quizDir)) return [];
	return fs.readdirSync(quizDir)
		.filter(file => file.endsWith('.jsx'))
		.map(file => {
			const name = file.replace(/\.jsx$/, '').toLowerCase();
			// If the file is WordleQuiz.jsx, route should be /quiz/wordle
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

const staticUrls = [
	{ loc: '/' },
	{ loc: '/leaderboard' },
	{ loc: '/quiz-leaderboard' },
	// add other static routes here if needed
];

const quizUrls = getQuizRoutes().map(route => ({ loc: route }));

export default defineConfig({
	customLogger: logger,
	plugins: [
		...(isDev ? [inlineEditPlugin(), editModeDevPlugin()] : []),
		react(),
		addTransformIndexHtml,

		// ✅ Safe sitemap plugin integration
		sitemap({
			hostname: 'https://www.worldquiz.fun',
			urls: [
				...staticUrls,
				...quizUrls
			]
		}),

		// Add Brotli and gzip compression
		viteCompression({ algorithm: 'brotliCompress' }),
		viteCompression({ algorithm: 'gzip' }),

		// PurgeCSS plugin to remove unused CSS
		purgecss({
			content: [
				'./index.html',
				'./src/**/*.{js,jsx,ts,tsx}',
			],
			// Optionally, add safelist or other PurgeCSS options here
		}),

		// Bundle analysis plugin
		visualizer({ open: true, filename: 'bundle-stats.html' }),
	],
	server: {
		cors: true,
		headers: {
			'Cross-Origin-Embedder-Policy': 'credentialless',
		},
		allowedHosts: true,
	},
	resolve: {
		extensions: ['.jsx', '.js', '.tsx', '.ts', '.json',],
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	build: {
		target: 'es2020', // Only target modern browsers
		minify: 'esbuild', // Use esbuild for fast and efficient minification
		cssCodeSplit: true, // Split CSS for faster loading
		rollupOptions: {
			external: [
				'@babel/parser',
				'@babel/traverse',
				'@babel/generator',
				'@babel/types'
			]
		},
		// Optional: further esbuild options for more aggressive minification
		esbuild: {
			minify: true,
			minifyWhitespace: true,
			minifyIdentifiers: true,
			minifySyntax: true
		}
	}
});
