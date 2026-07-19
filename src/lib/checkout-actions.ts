import type { StripeCheckoutElementsSdk } from '@stripe/stripe-js'

/**
 * Load the checkout actions (`confirm`, `updateEmail`, `applyPromotionCode`, …) from a
 * `<CheckoutProvider>`'s `checkout` SDK. Throws if Stripe returns the error variant.
 * Usage: `const actions = await loadCheckoutActions(checkout); await actions.confirm({ returnUrl })`.
 */
export async function loadCheckoutActions(checkout: StripeCheckoutElementsSdk) {
	const result = await checkout.loadActions()
	if (result.type === 'error') {
		throw new Error(result.error.message)
	}
	return result.actions
}
