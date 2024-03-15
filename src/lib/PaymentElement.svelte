<script lang="ts">
	import type { StripePaymentElement, StripePaymentElementOptions } from '@stripe/stripe-js'
	import { onMount } from 'svelte'
	import { dev } from '$app/environment'
	import { stripeElements } from '$lib/stores'

	export let paymentElementOptions: StripePaymentElementOptions|undefined = undefined
	export let paymentContainer: StripePaymentElement|undefined = undefined

	// see all options available at
	// https://stripe.com/docs/js/elements_object/create_payment_element
	if (!paymentElementOptions) paymentElementOptions = { layout: 'tabs' }

	let mounted = false

	$: elements = $stripeElements

	onMount(() => {		  
		mounted = true
		return () => {
			mounted = false
		}
	})
	
	const paymentElement = (node: any) => {
		try {
			paymentContainer = $stripeElements?.create('payment', paymentElementOptions)
			paymentContainer?.mount(node)
		} catch (e) {
			if (dev) console.error(e)
		}
		return {
			destroy: () => {
				if (paymentContainer) paymentContainer.destroy()
				stripeElements.set(undefined)
			}
		}
	}
</script>

{#if mounted && elements}
	<div use:paymentElement />
{/if}