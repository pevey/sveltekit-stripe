import { describe, it, expect, vi } from 'vitest'
import {
	pollPaymentIntent,
	confirmIdealPayment,
	confirmBancontactPayment,
	confirmGiropayPayment,
	confirmP24Payment,
	confirmBlikPayment,
	confirmPromptPayPayment,
	confirmOxxoPayment
} from './lib/payment-methods.js'

const noSleep = () => Promise.resolve()

describe('pollPaymentIntent', () => {
	it('resolves once the intent reaches a terminal status', async () => {
		const statuses = ['requires_action', 'processing', 'succeeded']
		const stripe = {
			retrievePaymentIntent: vi.fn(async () => ({ paymentIntent: { status: statuses.shift() } }))
		} as any
		const res = await pollPaymentIntent(stripe, 'cs_1', { sleep: noSleep })
		expect(res.status).toBe('succeeded')
		expect(stripe.retrievePaymentIntent).toHaveBeenCalledTimes(3)
	})

	it('stops on a terminal failure status', async () => {
		const stripe = {
			retrievePaymentIntent: vi.fn(async () => ({ paymentIntent: { status: 'requires_payment_method' } }))
		} as any
		const res = await pollPaymentIntent(stripe, 'cs_1', { sleep: noSleep })
		expect(res.status).toBe('requires_payment_method')
		expect(stripe.retrievePaymentIntent).toHaveBeenCalledTimes(1)
	})

	it('times out and reports timedOut', async () => {
		let t = 0
		const stripe = {
			retrievePaymentIntent: vi.fn(async () => ({ paymentIntent: { status: 'processing' } }))
		} as any
		const res = await pollPaymentIntent(stripe, 'cs_1', {
			sleep: noSleep,
			now: () => (t += 1000),
			timeoutMs: 2500
		})
		expect(res.timedOut).toBe(true)
		expect(res.status).toBe('processing')
	})
})

describe('redirect confirm helpers', () => {
	it('iDEAL builds billing_details + return_url (bank omitted → collected on redirect)', async () => {
		const stripe = { confirmIdealPayment: vi.fn(async () => ({ paymentIntent: {} })) } as any
		await confirmIdealPayment(stripe, 'cs_1', {
			billingDetails: { name: 'Ada' },
			returnUrl: 'https://x/return'
		})
		expect(stripe.confirmIdealPayment).toHaveBeenCalledWith(
			'cs_1',
			{ payment_method: { billing_details: { name: 'Ada' } }, return_url: 'https://x/return' },
			undefined
		)
	})

	it('iDEAL includes ideal.bank when provided', async () => {
		const stripe = { confirmIdealPayment: vi.fn(async () => ({ paymentIntent: {} })) } as any
		await confirmIdealPayment(stripe, 'cs_1', {
			billingDetails: { name: 'Ada' },
			returnUrl: 'https://x/return',
			bank: 'abn_amro'
		})
		expect(stripe.confirmIdealPayment).toHaveBeenCalledWith(
			'cs_1',
			{
				payment_method: { ideal: { bank: 'abn_amro' }, billing_details: { name: 'Ada' } },
				return_url: 'https://x/return'
			},
			undefined
		)
	})

	it('P24 sets tos_shown_and_accepted', async () => {
		const stripe = { confirmP24Payment: vi.fn(async () => ({ paymentIntent: {} })) } as any
		await confirmP24Payment(stripe, 'cs_1', {
			billingDetails: { email: 'a@b.co' },
			returnUrl: 'https://x/return'
		})
		expect(stripe.confirmP24Payment).toHaveBeenCalledWith(
			'cs_1',
			{
				payment_method: { billing_details: { email: 'a@b.co' } },
				payment_method_options: { p24: { tos_shown_and_accepted: true } },
				return_url: 'https://x/return'
			},
			undefined
		)
	})

	it('Bancontact + giropay build billing_details + return_url', async () => {
		const stripe = {
			confirmBancontactPayment: vi.fn(async () => ({})),
			confirmGiropayPayment: vi.fn(async () => ({}))
		} as any
		await confirmBancontactPayment(stripe, 'cs_1', {
			billingDetails: { name: 'Ada' },
			returnUrl: 'https://x/return'
		})
		await confirmGiropayPayment(stripe, 'cs_1', {
			billingDetails: { name: 'Ada' },
			returnUrl: 'https://x/return'
		})
		expect(stripe.confirmBancontactPayment).toHaveBeenCalledWith(
			'cs_1',
			{ payment_method: { billing_details: { name: 'Ada' } }, return_url: 'https://x/return' },
			undefined
		)
		expect(stripe.confirmGiropayPayment).toHaveBeenCalledWith(
			'cs_1',
			{ payment_method: { billing_details: { name: 'Ada' } }, return_url: 'https://x/return' },
			undefined
		)
	})
})

describe('display/poll confirm helpers', () => {
	it('BLIK puts the code in payment_method_options.blik.code', async () => {
		const stripe = { confirmBlikPayment: vi.fn(async () => ({ paymentIntent: {} })) } as any
		await confirmBlikPayment(stripe, 'cs_1', { code: '123456', billingDetails: { name: 'Ada' } })
		expect(stripe.confirmBlikPayment).toHaveBeenCalledWith(
			'cs_1',
			{
				payment_method: { billing_details: { name: 'Ada' } },
				payment_method_options: { blik: { code: '123456' } }
			},
			undefined
		)
	})

	it('PromptPay + OXXO build billing_details only', async () => {
		const stripe = {
			confirmPromptPayPayment: vi.fn(async () => ({})),
			confirmOxxoPayment: vi.fn(async () => ({}))
		} as any
		await confirmPromptPayPayment(stripe, 'cs_1', { billingDetails: { name: 'Ada' } })
		await confirmOxxoPayment(stripe, 'cs_1', { billingDetails: { name: 'Ada', email: 'a@b.co' } })
		expect(stripe.confirmPromptPayPayment).toHaveBeenCalledWith(
			'cs_1',
			{ payment_method: { billing_details: { name: 'Ada' } } },
			undefined
		)
		expect(stripe.confirmOxxoPayment).toHaveBeenCalledWith(
			'cs_1',
			{ payment_method: { billing_details: { name: 'Ada', email: 'a@b.co' } } },
			undefined
		)
	})
})
