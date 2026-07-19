import { describe, it, expect, vi } from 'vitest'
import {
	createStripeServer,
	createPaymentIntent,
	createSetupIntent,
	constructWebhookEvent
} from './lib/server/index.js'

function fakeStripe() {
	return {
		paymentIntents: { create: vi.fn(async () => ({ id: 'pi_1', client_secret: 'pi_secret' })) },
		setupIntents: { create: vi.fn(async () => ({ id: 'seti_1', client_secret: 'seti_secret' })) },
		webhooks: { constructEvent: vi.fn(() => ({ id: 'evt_1', type: 'payment_intent.succeeded' })) }
	} as any
}

describe('createPaymentIntent', () => {
	it('forwards params/options and returns the client secret', async () => {
		const stripe = fakeStripe()
		const params = { amount: 1099, currency: 'usd' }
		const result = await createPaymentIntent(stripe, params as any, { idempotencyKey: 'k1' })
		expect(stripe.paymentIntents.create).toHaveBeenCalledWith(params, { idempotencyKey: 'k1' })
		expect(result.clientSecret).toBe('pi_secret')
		expect(result.paymentIntent).toEqual({ id: 'pi_1', client_secret: 'pi_secret' })
	})
})

describe('createSetupIntent', () => {
	it('defaults params to {} and returns the client secret', async () => {
		const stripe = fakeStripe()
		const result = await createSetupIntent(stripe)
		expect(stripe.setupIntents.create).toHaveBeenCalledWith({}, undefined)
		expect(result.clientSecret).toBe('seti_secret')
	})
})

describe('constructWebhookEvent', () => {
	it('forwards payload/signature/secret and returns the event', () => {
		const stripe = fakeStripe()
		const event = constructWebhookEvent(stripe, 'raw-body', 'sig', 'whsec_x')
		expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith('raw-body', 'sig', 'whsec_x')
		expect(event).toEqual({ id: 'evt_1', type: 'payment_intent.succeeded' })
	})
})

describe('createStripeServer', () => {
	it('returns a configured Stripe client (no network at construction)', () => {
		const stripe = createStripeServer('sk_test_x')
		expect(stripe.paymentIntents).toBeDefined()
		expect(stripe.webhooks).toBeDefined()
	})
})
