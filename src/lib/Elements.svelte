<script lang="ts">
	import type { Appearance, Stripe, StripeElementsOptions } from '@stripe/stripe-js'
	import { loadStripe } from '@stripe/stripe-js'
	import { onMount } from 'svelte'
	import { dev, browser } from '$app/environment'
	import { stripeClient, stripeElements } from '$lib/stores'

	export let publicKey: string
	export let elementsOptions: StripeElementsOptions|undefined = undefined

	let mounted = false

	// @ts-ignore
	onMount(async () => {		
		if (!publicKey) return false
	
		if (browser) {
			if (!$stripeClient) {
				try {
					const client: Stripe|null = await loadStripe(publicKey)
					// @ts-ignore
					let elements = client?.elements(elementsOptions)
					stripeClient.set(client)
					stripeElements.set(elements)
				} catch (e) {
					if (dev) console.error(e)
				}
			}
		}
		
		mounted = true
		return () => {
			mounted = false
		}
	})
</script>

{#if mounted}
	<slot elements={$stripeElements} stripe={$stripeClient} />
{/if}