// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Ripple.js',
			description: 'A standalone, framework-agnostic reactive utility library. One change ripples through all dependents.',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/Adityazzzzz/Ripple-JS' },
				{ icon: 'x.com', label: 'Twitter', href: 'https://twitter.com' },
			],
			logo: {
				light: './src/assets/logo-light.svg',
				dark: './src/assets/logo-dark.svg',
				replacesTitle: false,
			},
			customCss: ['./src/styles/custom.css'],
			editLink: {
				baseUrl: 'https://github.com/Adityazzzzz/Ripple-JS/edit/main/docs/',
			},
			head: [
				{
					tag: 'meta',
					attrs: { property: 'og:image', content: '/og-image.png' },
				},
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
						{ label: 'Thinking in Signals', slug: 'getting-started/thinking-in-signals' },
					],
				},
				{
					label: 'Core Concepts',
					items: [
						{ label: 'Signals', slug: 'core/signals' },
						{ label: 'Computed Values', slug: 'core/computed' },
						{ label: 'Effects', slug: 'core/effects' },
						{ label: 'Batching', slug: 'core/batching' },
						{ label: 'Scopes', slug: 'core/scopes' },
						{ label: 'Untrack', slug: 'core/untrack' },
					],
				},
				{
					label: 'Utilities',
					items: [
						{ label: 'Watch', slug: 'utilities/watch' },
						{ label: 'Derive', slug: 'utilities/derive' },
						{ label: 'Subscribe', slug: 'utilities/subscribe' },
						{ label: 'Previous', slug: 'utilities/previous' },
						{ label: 'Debounced & Throttled', slug: 'utilities/debounced-throttled' },
						{ label: 'Readonly', slug: 'utilities/readonly' },
						{ label: 'Type Guards', slug: 'utilities/type-guards' },
						{ label: 'Memo', slug: 'utilities/memo' },
					],
				},
				{
					label: 'Framework Features',
					items: [
						{ label: 'Store', slug: 'features/store' },
						{ label: 'History (Undo/Redo)', slug: 'features/history' },
						{ label: 'Persisted Signal', slug: 'features/persisted-signal' },
						{ label: 'Resource', slug: 'features/resource' },
						{ label: 'Collections', slug: 'features/collections' },
						{ label: 'Error Boundaries', slug: 'features/error-boundaries' },
						{ label: 'Promise Interop', slug: 'features/promise-interop' },
					],
				},
				{
					label: 'Framework Integration',
					items: [
						{ label: 'React', slug: 'integrations/react' },
						{ label: 'Vue 3', slug: 'integrations/vue' },
						{ label: 'Svelte', slug: 'integrations/svelte' },
						{ label: 'Vanilla JS', slug: 'integrations/vanilla' },
					],
				},
				{
					label: 'API Reference',
					items: [
						{ label: 'Core API', slug: 'api/core' },
						{ label: 'Utilities API', slug: 'api/utilities' },
						{ label: 'Features API', slug: 'api/features' },
						{ label: 'DevTools API', slug: 'api/devtools' },
					],
				},
				{
					label: 'Advanced',
					items: [
						{ label: 'Architecture', slug: 'advanced/architecture' },
						{ label: 'Performance', slug: 'advanced/performance' },
						{ label: 'Bundle Size', slug: 'advanced/bundle-size' },
						{ label: 'Migration Guide', slug: 'advanced/migration' },
					],
				},
			],
		}),
	],
});
