/**
 * Redirect the browser to a Stripe Payment Link URL. Payment Links are external, hosted
 * pages, so this performs a full-page `window.location` navigation — NOT SvelteKit's `goto`,
 * which is for internal routes. No-op outside the browser.
 */
export function redirectToPaymentLink(url: string): void {
	if (typeof window !== 'undefined') {
		window.location.href = url
	}
}
