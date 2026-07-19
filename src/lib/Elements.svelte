<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { Stripe, StripeElements, StripeElementsOptions } from '@stripe/stripe-js'
	import type { StripeContext } from './types.js'
	import { loadStripe } from '@stripe/stripe-js'
	import { onMount, setContext } from 'svelte'
	import { dev, browser } from '$app/env'
	import { STRIPE_KEY } from './context.js'

	interface Props {
		publicKey: string
		elementsOptions?: StripeElementsOptions
		stripe?: Stripe | null
		elements?: StripeElements
		children?: Snippet<[{ stripe: Stripe | null; elements: StripeElements | undefined }]>
	}

	let {
		publicKey,
		elementsOptions = undefined,
		stripe = $bindable(),
		elements = $bindable(),
		children
	}: Props = $props()

	// Reactive context shared with descendant Element components (Payment, Address,
	// card fields). A $state object so children stay reactive once Stripe loads async.
	const ctx = $state<StripeContext>({ stripe: null, elements: undefined })
	setContext(STRIPE_KEY, ctx)

	let mounted = $state(false)

	onMount(async () => {
		if (!browser) return
		if (!publicKey) {
			if (dev) console.error('sveltekit-stripe <Elements>: `publicKey` is required.')
			return
		}
		try {
			const instance = await loadStripe(publicKey)
			if (!instance) {
				if (dev) console.error('sveltekit-stripe <Elements>: failed to load Stripe.js (check publicKey).')
				return
			}
			// StripeElementsOptions is a discriminated union (clientSecret | mode); Stripe
			// types `elements()` as two overloads TS can't match to the union, so we widen.
			const elementsInstance = instance.elements(elementsOptions as any)
			stripe = instance
			elements = elementsInstance
			ctx.stripe = instance
			ctx.elements = elementsInstance
			mounted = true
		} catch (e) {
			if (dev) console.error(e)
		}
	})
</script>

{#if mounted}
	{@render children?.({ stripe: ctx.stripe, elements: ctx.elements })}
{/if}
