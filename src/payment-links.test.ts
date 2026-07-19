import { describe, it, expect, vi } from 'vitest'
import { createPaymentLink } from './lib/server/index.js'
import { redirectToPaymentLink } from './lib/payment-links.js'

describe('createPaymentLink', () => {
	it('creates a link and returns its url', async () => {
		const stripe = {
			paymentLinks: { create: vi.fn(async () => ({ id: 'plink_1', url: 'https://buy.stripe.com/x' })) }
		} as any
		const params = { line_items: [{ price: 'price_1', quantity: 1 }] }
		const result = await createPaymentLink(stripe, params as any, { idempotencyKey: 'k1' })
		expect(stripe.paymentLinks.create).toHaveBeenCalledWith(params, { idempotencyKey: 'k1' })
		expect(result.url).toBe('https://buy.stripe.com/x')
		expect(result.paymentLink).toEqual({ id: 'plink_1', url: 'https://buy.stripe.com/x' })
	})
})

describe('redirectToPaymentLink', () => {
	it('is a no-op outside the browser (window undefined)', () => {
		expect(() => redirectToPaymentLink('https://buy.stripe.com/x')).not.toThrow()
	})
})
