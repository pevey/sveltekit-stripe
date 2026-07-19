import type {
	Stripe,
	StripeElements,
	StripeCardNumberElement,
	CreatePaymentMethodCardData
} from '@stripe/stripe-js'

type ConfirmPaymentArg = NonNullable<Parameters<Stripe['confirmCardPayment']>[1]>
type ConfirmSetupArg = NonNullable<Parameters<Stripe['confirmCardSetup']>[1]>

// The consumer supplies everything EXCEPT `card` in payment_method — the helper injects it.
type CardPaymentData = Omit<ConfirmPaymentArg, 'payment_method'> & {
	payment_method?: Omit<Extract<ConfirmPaymentArg['payment_method'], object>, 'card'>
}
type CardSetupData = Omit<ConfirmSetupArg, 'payment_method'> & {
	payment_method?: Omit<Extract<ConfirmSetupArg['payment_method'], object>, 'card'>
}

/**
 * Get the mounted `cardNumber` element from an Elements group. Stripe auto-links the
 * sibling `cardExpiry`/`cardCvc` created from the same group, so only this element is
 * needed to confirm. Throws a clear error if no `<CardNumber>` has been rendered.
 */
export function getCardElement(elements: StripeElements): StripeCardNumberElement {
	const card = elements.getElement('cardNumber')
	if (!card) {
		throw new Error(
			'sveltekit-stripe: no cardNumber element found — render <CardNumber> inside <Elements> before confirming.'
		)
	}
	return card
}

/**
 * Confirm a card PaymentIntent using the mounted card fields. `data`/`options` are passed
 * through to `stripe.confirmCardPayment`; the `card` element is injected for you.
 */
export function confirmCardPayment(
	stripe: Stripe,
	elements: StripeElements,
	clientSecret: string,
	data?: CardPaymentData,
	options?: Parameters<Stripe['confirmCardPayment']>[2]
) {
	const card = getCardElement(elements)
	const pm = data?.payment_method
	// Stripe's `payment_method` is a broad union across payment method types; we inject the
	// card element for the card flow, so widen locally rather than satisfy every member.
	const payment_method: any = { ...(pm && typeof pm === 'object' ? pm : {}), card }
	return stripe.confirmCardPayment(clientSecret, { ...data, payment_method }, options)
}

/**
 * Confirm a card SetupIntent (save a card) using the mounted card fields.
 */
export function confirmCardSetup(
	stripe: Stripe,
	elements: StripeElements,
	clientSecret: string,
	data?: CardSetupData,
	options?: Parameters<Stripe['confirmCardSetup']>[2]
) {
	const card = getCardElement(elements)
	const pm = data?.payment_method
	const payment_method: any = { ...(pm && typeof pm === 'object' ? pm : {}), card }
	return stripe.confirmCardSetup(clientSecret, { ...data, payment_method }, options)
}

/**
 * Create a card PaymentMethod from the mounted card fields (e.g. to confirm server-side).
 * `data` carries `billing_details`, `metadata`, etc. — the `type`/`card` are injected.
 */
export function createCardPaymentMethod(
	stripe: Stripe,
	elements: StripeElements,
	data?: Omit<CreatePaymentMethodCardData, 'type' | 'card'>
) {
	const card = getCardElement(elements)
	return stripe.createPaymentMethod({ type: 'card', card, ...data })
}
