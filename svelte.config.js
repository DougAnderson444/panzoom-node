// import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-static';

import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),

	kit: {
		adapter: adapter({
			pages: 'docs',
			assets: 'docs'
		}),
		prerender: {
			default: true
		},
		paths: {
			// change below to your repo name
			base: process.env.NODE_ENV === 'production' ? '/svelte-connectables' : ''
		},
		vite: () => ({
			build: {
				rollupOptions: {
					plugins: [],
					output: {
						minifyInternalExports: false,
						compact: false
					}
				},
				minify: false,
				sourcemap: true,
				optimization: {
					minimize: false
				}
			},
			optimization: {
				minimize: false
			}
		})
	}
};

export default config;
