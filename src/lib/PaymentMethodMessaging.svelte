<script lang="ts">
	import type {
		StripePaymentMethodMessagingElement,
		StripePaymentMethodMessagingElementOptions
	} from '@stripe/stripe-js'
	import type { Attachment } from 'svelte/attachments'
	import { dev } from '$app/env'
	import { getStripeContext } from './context.js'

	interface Props {
		// BNPL / "pay over time" promotional messaging. `options` is REQUIRED by Stripe
		// (needs amount/currency/countryCode/paymentMethodTypes).
		// https://stripe.com/docs/payments/payment-method-messaging
		paymentMethodMessagingOptions: StripePaymentMethodMessagingElementOptions
		element?: StripePaymentMethodMessagingElement
		onReady?: () => void
	}

	let {
		paymentMethodMessagingOptions,
		element = $bindable(),
		onReady
	}: Props = $props()

	const ctx = getStripeContext()
	let elements = $derived(ctx.elements)

	const paymentMethodMessaging: Attachment<HTMLElement> = (node) => {
		let el: typeof element = undefined
		try {
			el = ctx.elements?.create('paymentMethodMessaging', paymentMethodMessagingOptions)
			element = el
			el?.mount(node)
			el?.on('ready', () => onReady?.())
		} catch (e) {
			if (dev) console.error(e)
		}
		return () => el?.destroy()
	}
</script>

{#if elements}
	<div {@attach paymentMethodMessaging}></div>
{/if}
