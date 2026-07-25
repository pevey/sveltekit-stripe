<script lang="ts">
	import type { StripeCurrencySelectorElement, StripeError } from '@stripe/stripe-js'
	import type { Attachment } from 'svelte/attachments'
	import { dev } from '$app/env'
	import { getCheckoutContext } from './checkout-context.js'

	interface Props {
		// createCurrencySelectorElement() takes no options.
		element?: StripeCurrencySelectorElement
		onReady?: () => void
		onFocus?: () => void
		onBlur?: () => void
		onEscape?: () => void
		onLoadError?: (error: StripeError) => void
	}

	let { element = $bindable(), onReady, onFocus, onBlur, onEscape, onLoadError }: Props = $props()

	const ctx = getCheckoutContext()
	let checkout = $derived(ctx.checkout)

	const currencySelector: Attachment<HTMLElement> = (node) => {
		let el: typeof element = undefined
		try {
			el = ctx.checkout?.createCurrencySelectorElement()
			element = el
			el?.mount(node)
			el?.on('ready', () => onReady?.())
			el?.on('focus', () => onFocus?.())
			el?.on('blur', () => onBlur?.())
			el?.on('escape', () => onEscape?.())
			el?.on('loaderror', (e) => onLoadError?.(e.error))
		} catch (e) {
			if (dev) console.error(e)
		}
		return () => el?.destroy()
	}
</script>

{#if checkout}
	<div {@attach currencySelector}></div>
{/if}
