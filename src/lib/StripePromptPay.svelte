<script lang="ts">
	// PromptPay: confirm returns a QR code in the intent's `next_action`; display it and poll to
	// resolution. Component owns the flow. Render inside <Elements>; wire like:
	//   <StripePromptPay bind:this={el} {clientSecret} oncomplete={…} />  <button onclick={() => el.pay()}>
	import { getStripeContext } from './context.js'
	import { confirmPromptPayPayment, pollPaymentIntent } from './payment-methods.js'
	import type { PaymentIntent, StripeError } from '@stripe/stripe-js'

	type Status = 'idle' | 'confirming' | 'display' | 'polling' | 'succeeded' | 'failed'

	let {
		clientSecret,
		status = $bindable('idle' as Status),
		billingName = '',
		oncomplete,
		onerror,
		alt = 'PromptPay QR code',
		class: className = ''
	}: {
		clientSecret: string
		status?: Status
		billingName?: string
		oncomplete?: (pi?: PaymentIntent) => void
		onerror?: (e: StripeError | Error) => void
		alt?: string
		class?: string
	} = $props()

	const ctx = getStripeContext()
	let qr = $state<string | null>(null)

	export async function pay() {
		if (!ctx.stripe) return
		status = 'confirming'
		const { error, paymentIntent } = await confirmPromptPayPayment(ctx.stripe, clientSecret, {
			billingDetails: billingName ? { name: billingName } : undefined
		})
		if (error) {
			status = 'failed'
			onerror?.(error)
			return
		}
		qr = (paymentIntent as any)?.next_action?.promptpay_display_qr_code?.image_url_png ?? null
		status = 'display'
		const res = await pollPaymentIntent(ctx.stripe, clientSecret)
		if (res.status === 'succeeded') {
			status = 'succeeded'
			oncomplete?.(res.paymentIntent)
		} else {
			status = 'failed'
			onerror?.(new Error(`PromptPay ${res.status}`))
		}
	}
</script>

{#if qr}
	<img src={qr} {alt} class={className} />
{/if}
