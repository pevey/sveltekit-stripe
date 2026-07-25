<script lang="ts">
	// OXXO: confirm returns a voucher in the intent's `next_action`; display it. Payment happens offline
	// (the shopper pays at an OXXO store) and a Stripe webhook completes it later — so there is no poll;
	// `status` ends at `voucher_issued` and `oncomplete` fires once the voucher is shown. Name + email
	// are required by Stripe — pass them via props (collect them upstream). Wire like:
	//   <StripeOxxo bind:this={el} {clientSecret} {billingName} {billingEmail} /> <button onclick={() => el.pay()}>
	import { getStripeContext } from './context.js'
	import { confirmOxxoPayment } from './payment-methods.js'
	import type { PaymentIntent, StripeError } from '@stripe/stripe-js'

	type Status = 'idle' | 'confirming' | 'voucher_issued' | 'failed'

	let {
		clientSecret,
		status = $bindable('idle' as Status),
		billingName = '',
		billingEmail = '',
		oncomplete,
		onerror,
		linkLabel = 'View your OXXO voucher',
		class: className = ''
	}: {
		clientSecret: string
		status?: Status
		billingName?: string
		billingEmail?: string
		oncomplete?: (pi?: PaymentIntent) => void
		onerror?: (e: StripeError | Error) => void
		linkLabel?: string
		class?: string
	} = $props()

	const ctx = getStripeContext()
	let voucherUrl = $state<string | null>(null)

	export async function pay() {
		if (!ctx.stripe) return
		status = 'confirming'
		const { error, paymentIntent } = await confirmOxxoPayment(ctx.stripe, clientSecret, {
			billingDetails: { name: billingName, email: billingEmail }
		})
		if (error) {
			status = 'failed'
			onerror?.(error)
			return
		}
		voucherUrl = (paymentIntent as any)?.next_action?.oxxo_display_details?.hosted_voucher_url ?? null
		status = 'voucher_issued'
		oncomplete?.(paymentIntent)
	}
</script>

{#if voucherUrl}
	<a href={voucherUrl} target="_blank" rel="noopener" class={className}>{linkLabel}</a>
{/if}
