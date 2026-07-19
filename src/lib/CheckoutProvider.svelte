<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { StripeCheckoutElementsSdk, StripeCheckoutElementsSdkOptions } from '@stripe/stripe-js'
	import type { CheckoutContext } from './types.js'
	import { loadStripe } from '@stripe/stripe-js'
	import { onMount, setContext } from 'svelte'
	import { dev, browser } from '$app/env'
	import { CHECKOUT_KEY } from './checkout-context.js'

	interface Props {
		// Custom Checkout (ui_mode: 'elements'). `clientSecret` may be a string or a Promise.
		publicKey: string
		clientSecret: StripeCheckoutElementsSdkOptions['clientSecret']
		elementsOptions?: StripeCheckoutElementsSdkOptions['elementsOptions']
		defaultValues?: StripeCheckoutElementsSdkOptions['defaultValues']
		adaptivePricing?: StripeCheckoutElementsSdkOptions['adaptivePricing']
		checkout?: StripeCheckoutElementsSdk
		children?: Snippet<[{ checkout: StripeCheckoutElementsSdk | undefined }]>
	}

	let {
		publicKey,
		clientSecret,
		elementsOptions = undefined,
		defaultValues = undefined,
		adaptivePricing = undefined,
		checkout = $bindable(),
		children
	}: Props = $props()

	const ctx = $state<CheckoutContext>({ checkout: undefined })
	setContext(CHECKOUT_KEY, ctx)

	let mounted = $state(false)

	onMount(async () => {
		if (!browser) return
		try {
			const stripe = await loadStripe(publicKey)
			if (!stripe) return
			const sdk = stripe.initCheckoutElementsSdk({
				clientSecret,
				elementsOptions,
				defaultValues,
				adaptivePricing
			})
			checkout = sdk
			ctx.checkout = sdk
			mounted = true
		} catch (e) {
			if (dev) console.error(e)
		}
	})
</script>

{#if mounted}
	{@render children?.({ checkout: ctx.checkout })}
{/if}
