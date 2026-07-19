<script lang="ts">
	import type { StripeAddressElement, StripeCheckoutAddressElementOptions, StripeAddressElementChangeEvent, StripeError } from '@stripe/stripe-js'
	import type { Attachment } from 'svelte/attachments'
	import { dev } from '$app/env'
	import { getCheckoutContext } from './checkout-context.js'

	interface Props {
		addressOptions?: StripeCheckoutAddressElementOptions
		element?: StripeAddressElement
		onChange?: (event: StripeAddressElementChangeEvent) => void
		onReady?: () => void
		onFocus?: () => void
		onBlur?: () => void
		onEscape?: () => void
		onLoadError?: (error: StripeError) => void
	}

	let { addressOptions, element = $bindable(), onChange, onReady, onFocus, onBlur, onEscape, onLoadError }: Props = $props()

	const ctx = getCheckoutContext()
	let checkout = $derived(ctx.checkout)

	const shippingAddress: Attachment<HTMLElement> = (node) => {
		try {
			element = ctx.checkout?.createShippingAddressElement(addressOptions)
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
	<div {@attach shippingAddress}></div>
{/if}
