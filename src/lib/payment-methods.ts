import type {
	Stripe,
	PaymentIntent,
	PaymentIntentResult,
	PaymentMethodCreateParams
} from '@stripe/stripe-js'

// ---------------------------------------------------------------------------
// Poll helper (BLIK / PromptPay — the shopper acts async, so poll to resolution)
// ---------------------------------------------------------------------------

const TERMINAL = new Set<PaymentIntent['status']>([
	'succeeded',
	'canceled',
	'requires_payment_method'
])

export interface PollOptions {
	intervalMs?: number
	timeoutMs?: number
	/** Injectable clock (ms). Defaults to Date.now. */
	now?: () => number
	/** Injectable delay. Defaults to setTimeout. */
	sleep?: (ms: number) => Promise<void>
}

export interface PollResult {
	status: PaymentIntent['status'] | 'unknown'
	paymentIntent?: PaymentIntent
	timedOut?: boolean
}

/** Poll `retrievePaymentIntent` until the intent is terminal or the timeout elapses. */
export async function pollPaymentIntent(
	stripe: Stripe,
	clientSecret: string,
	opts: PollOptions = {}
): Promise<PollResult> {
	const intervalMs = opts.intervalMs ?? 2000
	const timeoutMs = opts.timeoutMs ?? 180000
	const now = opts.now ?? Date.now
	const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
	const start = now()
	for (;;) {
		const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret)
		const status = paymentIntent?.status
		if (status && TERMINAL.has(status)) return { status, paymentIntent }
		if (now() - start >= timeoutMs)
			return { status: status ?? 'unknown', paymentIntent: paymentIntent ?? undefined, timedOut: true }
		await sleep(intervalMs)
	}
}

// ---------------------------------------------------------------------------
// Confirm helpers — ergonomic wrappers over `stripe.confirm<Method>Payment`
// (mirror `confirmCardPayment`; these methods mount no Element, so they just
//  build the `data` object). Medusa-agnostic.
// ---------------------------------------------------------------------------

type Billing = PaymentMethodCreateParams.BillingDetails

export interface RedirectConfirmOptions {
	billingDetails?: Billing
	returnUrl: string
}

// Stripe types the per-method `billing_details` with different REQUIRED fields (giropay→name,
// oxxo→name+email, …). We accept the loose `Billing` for ergonomics and widen the built
// payment_method to `any` locally — same approach as `confirm.ts` — rather than satisfy every member.
function billingPm(billingDetails?: Billing): any {
	return billingDetails ? { billing_details: billingDetails } : {}
}

/** iDEAL — redirects to the shopper's bank. `bank` is optional (collected on the redirect page). */
export function confirmIdealPayment(
	stripe: Stripe,
	clientSecret: string,
	opts: RedirectConfirmOptions & { bank?: string },
	options?: Parameters<Stripe['confirmIdealPayment']>[2]
): Promise<PaymentIntentResult> {
	const payment_method: any = {
		...(opts.bank ? { ideal: { bank: opts.bank } } : {}),
		...billingPm(opts.billingDetails)
	}
	return stripe.confirmIdealPayment(
		clientSecret,
		{ payment_method, return_url: opts.returnUrl },
		options
	)
}

/** Bancontact — redirects to the shopper's bank. */
export function confirmBancontactPayment(
	stripe: Stripe,
	clientSecret: string,
	opts: RedirectConfirmOptions,
	options?: Parameters<Stripe['confirmBancontactPayment']>[2]
): Promise<PaymentIntentResult> {
	return stripe.confirmBancontactPayment(
		clientSecret,
		{ payment_method: billingPm(opts.billingDetails), return_url: opts.returnUrl },
		options
	)
}

/** giropay — redirects to the shopper's bank. */
export function confirmGiropayPayment(
	stripe: Stripe,
	clientSecret: string,
	opts: RedirectConfirmOptions,
	options?: Parameters<Stripe['confirmGiropayPayment']>[2]
): Promise<PaymentIntentResult> {
	return stripe.confirmGiropayPayment(
		clientSecret,
		{ payment_method: billingPm(opts.billingDetails), return_url: opts.returnUrl },
		options
	)
}

/** Przelewy24 — redirects to the shopper's bank. Requires email + ToS acceptance (set for you). */
export function confirmP24Payment(
	stripe: Stripe,
	clientSecret: string,
	opts: RedirectConfirmOptions,
	options?: Parameters<Stripe['confirmP24Payment']>[2]
): Promise<PaymentIntentResult> {
	return stripe.confirmP24Payment(
		clientSecret,
		{
			payment_method: billingPm(opts.billingDetails),
			payment_method_options: { p24: { tos_shown_and_accepted: true } },
			return_url: opts.returnUrl
		} as any,
		options
	)
}

/** BLIK — the shopper enters a 6-digit code, then approves in their banking app (poll to resolve). */
export function confirmBlikPayment(
	stripe: Stripe,
	clientSecret: string,
	opts: { code: string; billingDetails?: Billing },
	options?: Parameters<Stripe['confirmBlikPayment']>[2]
): Promise<PaymentIntentResult> {
	return stripe.confirmBlikPayment(
		clientSecret,
		{
			payment_method: billingPm(opts.billingDetails),
			payment_method_options: { blik: { code: opts.code } }
		} as any,
		options
	)
}

/** PromptPay — returns a QR code in the intent's `next_action` (display it, then poll to resolve). */
export function confirmPromptPayPayment(
	stripe: Stripe,
	clientSecret: string,
	opts: { billingDetails?: Billing } = {},
	options?: Parameters<Stripe['confirmPromptPayPayment']>[2]
): Promise<PaymentIntentResult> {
	return stripe.confirmPromptPayPayment(
		clientSecret,
		{ payment_method: billingPm(opts.billingDetails) },
		options
	)
}

/** OXXO — returns a voucher in the intent's `next_action` (display it; a webhook completes payment). */
export function confirmOxxoPayment(
	stripe: Stripe,
	clientSecret: string,
	opts: { billingDetails?: Billing } = {},
	options?: Parameters<Stripe['confirmOxxoPayment']>[2]
): Promise<PaymentIntentResult> {
	return stripe.confirmOxxoPayment(
		clientSecret,
		{ payment_method: billingPm(opts.billingDetails) },
		options
	)
}
