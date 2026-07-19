import { describe, it, expect, vi } from 'vitest'
import { createCheckoutSession } from './lib/server/index.js'
import { loadCheckoutActions } from './lib/checkout-actions.js'

describe('createCheckoutSession', () => {
	it('creates a session and returns its client secret', async () => {
		const stripe = {
			checkout: { sessions: { create: vi.fn(async () => ({ id: 'cs_1', client_secret: 'cs_secret' })) } }
		} as any
		const params = { ui_mode: 'embedded_page', return_url: 'https://x/return', mode: 'payment', line_items: [] }
		const result = await createCheckoutSession(stripe, params as any, { idempotencyKey: 'k1' })
		expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(params, { idempotencyKey: 'k1' })
		expect(result.clientSecret).toBe('cs_secret')
		expect(result.session).toEqual({ id: 'cs_1', client_secret: 'cs_secret' })
	})
})

describe('loadCheckoutActions', () => {
	it('returns actions on success', async () => {
		const actions = { confirm: vi.fn(), updateEmail: vi.fn() }
		const checkout = { loadActions: vi.fn(async () => ({ type: 'success', actions })) } as any
		expect(await loadCheckoutActions(checkout)).toBe(actions)
	})

	it('throws on the error variant', async () => {
		const checkout = { loadActions: vi.fn(async () => ({ type: 'error', error: { message: 'nope', code: null } })) } as any
		await expect(loadCheckoutActions(checkout)).rejects.toThrow('nope')
	})
})
