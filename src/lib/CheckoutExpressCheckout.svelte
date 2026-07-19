<script lang="ts">
	import type { StripeCheckoutExpressCheckoutElement, StripeCheckoutExpressCheckoutElementOptions, StripeExpressCheckoutElementConfirmEvent, StripeError } from '@stripe/stripe-js'
	import type { Attachment } from 'svelte/attachments'
	import { dev } from '$app/env'
	import { getCheckoutContext } from './checkout-context.js'

	interface Props {
		expressCheckoutOptions?: StripeCheckoutExpressCheckoutElementOptions
		element?: StripeCheckoutExpressCheckoutElement
		onReady?: () => void
		onConfirm?: (event: StripeExpressCheckoutElementConfirmEvent) => void
		onCancel?: () => void
		onFocus?: () => void
		onBlur?: () => void
		onEscape?: () => void
		onLoadError?: (error: StripeError) => void
	}

	let { expressCheckoutOptions, element = $bindable(), onReady, onConfirm, onCancel, onFocus, onBlur, onEscape, onLoadError }: Props = $props()

	const ctx = getCheckoutContext()
	let checkout = $derived(ctx.checkout)

	const expressCheckout: Attachment<HTMLElement> = (node) => {
		try {
			element = ctx.checkout?.createExpressCheckoutElement(expressCheckoutOptions)
			element?.mount(node)
			element?.on('ready', () => onReady?.())
			element?.on('confirm', (e) => onConfirm?.(e))
			element?.on('cancel', () => onCancel?.())
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
	<div {@attach expressCheckout}></div>
{/if}
