import type { Stripe, StripeElements } from '@stripe/stripe-js'

/** Reactive object shared by `<Elements>` with its descendant Element components. */
export interface StripeContext {
	stripe: Stripe | null
	elements: StripeElements | undefined
}

export type {
	Address,
	Appearance,
	Stripe,
	StripeElement,
	StripeElements,
	StripeElementsOptions,
	StripeAddressElement,
	StripeAddressElementOptions,
	StripePaymentElement,
	StripePaymentElementOptions
} from '@stripe/stripe-js'
