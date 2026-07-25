import type { Stripe, PaymentIntent } from '@stripe/stripe-js'

/**
 * Read a redirect-based payment's result off the return URL. When Stripe sends the shopper back to
 * your `return_url` (iDEAL, Bancontact, giropay, Przelewy24, …) it appends
 * `?payment_intent=…&payment_intent_client_secret=…&redirect_status=…`. This retrieves the
 * PaymentIntent and returns its status. Returns `{ status: 'idle' }` when there is no redirect param
 * (or on the server), so a return page can render neutrally until it has something to report.
 */
export async function getRedirectResult(
	stripe: Stripe | null | undefined
): Promise<{ status: PaymentIntent['status'] | 'idle' | 'unknown'; paymentIntent?: PaymentIntent }> {
	if (typeof window === 'undefined' || !stripe) return { status: 'idle' }
	const clientSecret = new URLSearchParams(window.location.search).get('payment_intent_client_secret')
	if (!clientSecret) return { status: 'idle' }
	const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret)
	return { status: paymentIntent?.status ?? 'unknown', paymentIntent: paymentIntent ?? undefined }
}
