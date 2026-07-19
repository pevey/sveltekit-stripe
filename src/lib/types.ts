import type { Stripe, StripeElements, StripeCheckoutElementsSdk } from '@stripe/stripe-js'

/** Reactive object shared by `<Elements>` with its descendant Element components. */
export interface StripeContext {
	stripe: Stripe | null
	elements: StripeElements | undefined
}

/** Reactive object shared by `<CheckoutProvider>` with its checkout-mode elements. */
export interface CheckoutContext {
	checkout: StripeCheckoutElementsSdk | undefined
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
	StripePaymentElementOptions,
	StripeCardNumberElement,
	StripeCardNumberElementOptions,
	StripeCardNumberElementChangeEvent,
	StripeCardExpiryElement,
	StripeCardExpiryElementOptions,
	StripeCardExpiryElementChangeEvent,
	StripeCardCvcElement,
	StripeCardCvcElementOptions,
	StripeCardCvcElementChangeEvent,
	StripeError,
	StripeExpressCheckoutElement,
	StripeExpressCheckoutElementOptions,
	StripeExpressCheckoutElementReadyEvent,
	StripeExpressCheckoutElementConfirmEvent,
	StripeExpressCheckoutElementClickEvent,
	StripeExpressCheckoutElementShippingAddressChangeEvent,
	StripeExpressCheckoutElementShippingRateChangeEvent,
	StripeExpressCheckoutElementAvailablePaymentMethodsChangeEvent,
	StripeContactDetailsElement,
	StripeContactDetailsElementOptions,
	StripeContactDetailsElementChangeEvent,
	StripePaymentMethodMessagingElement,
	StripePaymentMethodMessagingElementOptions,
	StripeCheckoutElementsSdk,
	StripeCheckoutElementsSdkOptions,
	StripeEmbeddedCheckout,
	StripeEmbeddedCheckoutOptions,
	StripeCurrencySelectorElement,
	StripeCheckoutExpressCheckoutElement,
	StripeCheckoutPaymentElementOptions,
	StripeCheckoutAddressElementOptions,
	StripeCheckoutContactDetailsElementOptions,
	StripeCheckoutExpressCheckoutElementOptions,
	StripeCheckoutSession,
	StripeCheckoutConfirmResult
} from '@stripe/stripe-js'
