<script lang="ts">
	import type { StripePaymentElement, StripeCheckoutPaymentElementOptions, StripePaymentElementChangeEvent, StripeError } from '@stripe/stripe-js'
	import type { Attachment } from 'svelte/attachments'
	import { dev } from '$app/env'
	import { getCheckoutContext } from './checkout-context.js'

	interface Props {
		paymentOptions?: StripeCheckoutPaymentElementOptions
		element?: StripePaymentElement
		onChange?: (event: StripePaymentElementChangeEvent) => void
		onReady?: () => void
		onFocus?: () => void
		onBlur?: () => void
		onEscape?: () => void
		onLoadError?: (error: StripeError) => void
	}

	let { paymentOptions, element = $bindable(), onChange, onReady, onFocus, onBlur, onEscape, onLoadError }: Props = $props()

	const ctx = getCheckoutContext()
	let checkout = $derived(ctx.checkout)

	const payment: Attachment<HTMLElement> = (node) => {
		try {
			element = ctx.checkout?.createPaymentElement(paymentOptions)
			element?.mount(node)
			element?.on('change', (e) => onChange?.(e))
			element?.on('ready', () => onReady?.())
			element?.on('focus', () => onFocus?.())
			element?.on('blur', () => onBlur?.())
			element?.on('escape', () => onEscape?.())
			element?.on('loaderror', (e) => onLoadError?.(e.error))
		} catch (e) {
			if (dev) console.error(e)
		}
		return () => {
			if (element) element.destroy()
		}
	}
</script>

{#if checkout}
	<div {@attach payment}></div>
{/if}
