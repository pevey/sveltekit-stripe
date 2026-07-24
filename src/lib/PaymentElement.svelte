<script lang="ts">
	import type { StripePaymentElement, StripePaymentElementOptions } from '@stripe/stripe-js'
	import type { Attachment } from 'svelte/attachments'
	import { dev } from '$app/env'
	import { getStripeContext } from './context.js'

	interface Props {
		// see all options at https://stripe.com/docs/js/elements_object/create_payment_element
		paymentElementOptions?: StripePaymentElementOptions
		paymentContainer?: StripePaymentElement
	}

	let {
		paymentElementOptions = { layout: 'tabs' },
		paymentContainer = $bindable()
	}: Props = $props()

	const ctx = getStripeContext()
	let elements = $derived(ctx.elements)

	const paymentElement: Attachment<HTMLElement> = (node) => {
		// Local for mount/teardown; reading back the `$bindable` we write here would loop the effect
		// (`effect_update_depth_exceeded`).
		let el: StripePaymentElement | undefined
		try {
			el = ctx.elements?.create('payment', paymentElementOptions)
			paymentContainer = el
			el?.mount(node)
		} catch (e) {
			if (dev) console.error(e)
		}
		return () => {
			el?.destroy()
		}
	}
</script>

{#if elements}
	<div {@attach paymentElement}></div>
{/if}
