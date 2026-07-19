import { getContext } from 'svelte'
import type { CheckoutContext } from './types.js'

/** Context key for the Checkout SDK provided by `<CheckoutProvider>`. */
export const CHECKOUT_KEY: symbol = Symbol('sveltekit-stripe-checkout')

/**
 * Access the reactive `{ checkout }` context provided by a parent `<CheckoutProvider>`.
 * Must be called during a descendant's initialization. Throws if there is no provider.
 */
export function getCheckoutContext(): CheckoutContext {
	const ctx = getContext<CheckoutContext | undefined>(CHECKOUT_KEY)
	if (!ctx) {
		throw new Error(
			'getCheckoutContext() must be used within a <CheckoutProvider> component from sveltekit-stripe.'
		)
	}
	return ctx
}
