import type { Stripe, PaymentRequestOptions, CanMakePaymentResult } from '@stripe/stripe-js'

/**
 * Probe wallet availability (Apple Pay / Google Pay / Link) WITHOUT rendering anything, via the
 * PaymentRequest API's `canMakePayment`. Use it to decide whether to show a wallet button (e.g. the
 * `<ExpressCheckout>` element) before offering other payment methods — or to gate a wallet button on a
 * product card. Returns `null` when no wallet is available (e.g. desktop without a configured wallet).
 *
 * `options.total` is required by Stripe — pass the real cart total, or a small placeholder for a pure
 * availability probe (`canMakePayment` charges nothing). NOTE: the ExpressCheckout Element is Stripe's
 * recommended way to RENDER the button; the legacy PaymentRequestButton element is deprecated. This
 * helper is only the availability check, which remains fully supported.
 */
export async function canMakePayment(stripe: Stripe, options: PaymentRequestOptions): Promise<CanMakePaymentResult | null> {
	return stripe.paymentRequest(options).canMakePayment()
}
