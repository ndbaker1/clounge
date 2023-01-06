import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

const base = process.env.BASE_HREF ? '/' + process.env.BASE_HREF : '';

export default {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: preprocess(),

	kit: {
		adapter: adapter(),
		paths: {
			base
		}
	}
};
