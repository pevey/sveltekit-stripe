<script lang="ts">
	// BLIK: the shopper enters a 6-digit code, then approves in their banking app — so this component
	// owns the flow (confirm → poll). Render inside <Elements>. Wire it up:
	//   <StripeBlik bind:this={el} {clientSecret} oncomplete={…} />  <button onclick={() => el.pay()}>
	import { getStripeContext } from './context.js'
	import { confirmBlikPayment, pollPaymentIntent } from './payment-methods.js'
	import type { PaymentIntent, StripeError } from '@stripe/stripe-js'

	type Status = 'idle' | 'confirming' | 'polling' | 'succeeded' | 'failed'

	let {
		clientSecret,
		code = $bindable(''),
		showFields = true,
		status = $bindable('idle' as Status),
		billingName = '',
		oncomplete,
		onerror,
		class: className = ''
	}: {
		clientSecret: string
		code?: string
		showFields?: boolean
		status?: Status
		billingName?: string
		oncomplete?: (pi?: PaymentIntent) => void
		onerror?: (e: StripeError | Error) => void
		class?: string
	} = $props()

	const ctx = getStripeContext()

	export async function pay() {
		if (!ctx.stripe) return
		status = 'confirming'
		const { error } = await confirmBlikPayment(ctx.stripe, clientSecret, {
			code,
			billingDetails: billingName ? { name: billingName } : undefined
		})
		if (error) {
			status = 'failed'
			onerror?.(error)
			return
		}
		status = 'polling'
		const res = await pollPaymentIntent(ctx.stripe, clientSecret)
		if (res.status === 'succeeded') {
			status = 'succeeded'
			oncomplete?.(res.paymentIntent)
		} else {
			status = 'failed'
			onerror?.(new Error(`BLIK payment ${res.status}`))
		}
	}
</script>

{#if showFields}
	<label class="block text-sm {className}">
		<span class="mb-1 block">BLIK code</span>
		<input inputmode="numeric" maxlength="6" bind:value={code} placeholder="123456" />
	</label>
{/if}
