<script lang="ts">
	import type { StripeEmbeddedCheckout, StripeEmbeddedCheckoutOptions } from '@stripe/stripe-js'
	import { loadStripe } from '@stripe/stripe-js'
	import { onMount, onDestroy } from 'svelte'
	import { dev, browser } from '$app/env'

	interface Props {
		// Stripe-hosted Checkout (ui_mode: 'embedded_page'). Standalone — not inside <Elements>.
		publicKey: string
		clientSecret?: string
		fetchClientSecret?: StripeEmbeddedCheckoutOptions['fetchClientSecret']
		onComplete?: StripeEmbeddedCheckoutOptions['onComplete']
		onShippingDetailsChange?: StripeEmbeddedCheckoutOptions['onShippingDetailsChange']
		onLineItemsChange?: StripeEmbeddedCheckoutOptions['onLineItemsChange']
		onAnalyticsEvent?: StripeEmbeddedCheckoutOptions['onAnalyticsEvent']
		embeddedCheckout?: StripeEmbeddedCheckout
	}

	let {
		publicKey,
		clientSecret,
		fetchClientSecret,
		onComplete,
		onShippingDetailsChange,
		onLineItemsChange,
		onAnalyticsEvent,
		embeddedCheckout = $bindable()
	}: Props = $props()

	let node: HTMLElement
	let destroyed = false

	onMount(async () => {
		if (!browser) return
		try {
			const stripe = await loadStripe(publicKey)
			if (!stripe || destroyed) return
			const instance = await stripe.createEmbeddedCheckoutPage({
				clientSecret,
				fetchClientSecret,
				onComplete,
				onShippingDetailsChange,
				onLineItemsChange,
				onAnalyticsEvent
			})
			if (destroyed) {
				instance.destroy()
				return
			}
			embeddedCheckout = instance
			instance.mount(node)
		} catch (e) {
			if (dev) console.error(e)
		}
	})

	onDestroy(() => {
		destroyed = true
		embeddedCheckout?.destroy()
	})
</script>

<div bind:this={node}></div>
