import { describe, it, expect, vi } from 'vitest'
import { canMakePayment } from './lib/payment-request.js'

const OPTS = { country: 'US', currency: 'usd', total: { label: 'Total', amount: 1999 } } as any

describe('canMakePayment', () => {
	it('creates a paymentRequest with the options and returns its availability', async () => {
		const pr = { canMakePayment: vi.fn(async () => ({ applePay: true, googlePay: false })) }
		const stripe = { paymentRequest: vi.fn(() => pr) } as any
		const res = await canMakePayment(stripe, OPTS)
		expect(stripe.paymentRequest).toHaveBeenCalledWith(OPTS)
		expect(res).toEqual({ applePay: true, googlePay: false })
	})

	it('returns null when no wallet is available', async () => {
		const stripe = { paymentRequest: vi.fn(() => ({ canMakePayment: vi.fn(async () => null) })) } as any
		expect(await canMakePayment(stripe, OPTS)).toBeNull()
	})
})
