import Stripe from 'stripe'

/**
 * Create a configured server-side Stripe client. Pass your secret key (e.g. from
 * `$env/dynamic/private`) and hold the returned client as a singleton in `$lib/server`.
 * Sets `appInfo` for Stripe integration tracking; your `config` overrides any defaults.
 */
export function createStripeServer(secretKey: string, config?: Stripe.StripeConfig): Stripe {
	return new Stripe(secretKey, {
		appInfo: { name: 'sveltekit-stripe', url: 'https://github.com/pevey/sveltekit-stripe' },
		...config
	})
}

/**
 * Create a PaymentIntent and return it with its `client_secret` (the value you send the
 * client for confirmation).
 */
export async function createPaymentIntent(
	stripe: Stripe,
	params: Stripe.PaymentIntentCreateParams,
	options?: Stripe.RequestOptions
): Promise<{ paymentIntent: Stripe.Response<Stripe.PaymentIntent>; clientSecret: string | null }> {
	const paymentIntent = await stripe.paymentIntents.create(params, options)
	return { paymentIntent, clientSecret: paymentIntent.client_secret }
}

/**
 * Create a SetupIntent (to save a card for later) and return it with its `client_secret`.
 */
export async function createSetupIntent(
	stripe: Stripe,
	params: Stripe.SetupIntentCreateParams = {},
	options?: Stripe.RequestOptions
): Promise<{ setupIntent: Stripe.Response<Stripe.SetupIntent>; clientSecret: string | null }> {
	const setupIntent = await stripe.setupIntents.create(params, options)
	return { setupIntent, clientSecret: setupIntent.client_secret }
}

/**
 * Verify and parse a Stripe webhook. Pass the raw request body (`await request.text()`),
 * the `stripe-signature` header, and your endpoint's signing secret (`whsec_...`). Throws
 * `Stripe.errors.StripeSignatureVerificationError` when verification fails.
 */
export function constructWebhookEvent(
	stripe: Stripe,
	payload: string | Buffer,
	signature: string | Buffer | Array<string>,
	secret: string
): Stripe.Event {
	return stripe.webhooks.constructEvent(payload, signature, secret)
}

/**
 * Create a Checkout Session and return it with its `client_secret`. Set
 * `params.ui_mode` to `'embedded_page'` (Embedded Checkout) or `'elements'` (Custom
 * Checkout), and include a `return_url` (required for those ui modes).
 */
export async function createCheckoutSession(
	stripe: Stripe,
	params: Stripe.Checkout.SessionCreateParams,
	options?: Stripe.RequestOptions
): Promise<{ session: Stripe.Response<Stripe.Checkout.Session>; clientSecret: string | null }> {
	const session = await stripe.checkout.sessions.create(params, options)
	return { session, clientSecret: session.client_secret }
}

/**
 * Create a Payment Link (a reusable, Stripe-hosted checkout URL) and return it with its
 * `url`. Send the customer to `url` on the client.
 */
export async function createPaymentLink(
	stripe: Stripe,
	params: Stripe.PaymentLinkCreateParams,
	options?: Stripe.RequestOptions
): Promise<{ paymentLink: Stripe.Response<Stripe.PaymentLink>; url: string }> {
	const paymentLink = await stripe.paymentLinks.create(params, options)
	return { paymentLink, url: paymentLink.url }
}
