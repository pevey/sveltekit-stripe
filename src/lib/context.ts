import { getContext } from 'svelte'
import type { StripeContext } from './types.js'

/** Unique context key for the Stripe context provided by `<Elements>`. */
export const STRIPE_KEY: symbol = Symbol('sveltekit-stripe')

/**
 * Access the reactive `{ stripe, elements }` context provided by a parent
 * `<Elements>` component. Must be called during the initialization of a descendant
 * of `<Elements>`. Throws if there is no provider above it.
 */
export function getStripeContext(): StripeContext {
	const ctx = getContext<StripeContext | undefined>(STRIPE_KEY)
	if (!ctx) {
		throw new Error(
			'getStripeContext() must be used within an <Elements> component from sveltekit-stripe.'
		)
	}
	return ctx
}
