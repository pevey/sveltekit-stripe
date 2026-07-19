import { describe, it, expect, vi } from 'vitest'
import {
	getCardElement,
	confirmCardPayment,
	confirmCardSetup,
	createCardPaymentMethod
} from './lib/confirm.js'

const CARD = { id: 'card-el' }

function fakeElements(card: unknown = CARD) {
	return { getElement: vi.fn((type: string) => (type === 'cardNumber' ? card : null)) } as any
}

describe('getCardElement', () => {
	it('returns the cardNumber element', () => {
		expect(getCardElement(fakeElements())).toBe(CARD)
	})

	it('throws when no cardNumber element is mounted', () => {
		expect(() => getCardElement(fakeElements(null))).toThrow('no cardNumber element')
	})
})

describe('confirmCardPayment', () => {
	it('injects the card element and merges data + options', async () => {
		const stripe = { confirmCardPayment: vi.fn(async () => ({ paymentIntent: {} })) } as any
		await confirmCardPayment(
			stripe,
			fakeElements(),
			'cs_123',
			{ payment_method: { billing_details: { name: 'Ada' } } },
			{ handleActions: false }
		)
		expect(stripe.confirmCardPayment).toHaveBeenCalledWith(
			'cs_123',
			{ payment_method: { billing_details: { name: 'Ada' }, card: CARD } },
			{ handleActions: false }
		)
	})
})

describe('confirmCardSetup', () => {
	it('injects the card element into a setup confirmation', async () => {
		const stripe = { confirmCardSetup: vi.fn(async () => ({ setupIntent: {} })) } as any
		await confirmCardSetup(stripe, fakeElements(), 'seti_123')
		expect(stripe.confirmCardSetup).toHaveBeenCalledWith(
			'seti_123',
			{ payment_method: { card: CARD } },
			undefined
		)
	})
})

describe('createCardPaymentMethod', () => {
	it('creates a card payment method with the mounted element', async () => {
		const stripe = { createPaymentMethod: vi.fn(async () => ({ paymentMethod: {} })) } as any
		await createCardPaymentMethod(stripe, fakeElements(), { billing_details: { name: 'Ada' } })
		expect(stripe.createPaymentMethod).toHaveBeenCalledWith({
			type: 'card',
			card: CARD,
			billing_details: { name: 'Ada' }
		})
	})
})
