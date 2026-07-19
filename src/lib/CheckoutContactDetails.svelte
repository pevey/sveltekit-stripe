<script lang="ts">
	import type { StripeContactDetailsElement, StripeCheckoutContactDetailsElementOptions, StripeContactDetailsElementChangeEvent, StripeError } from '@stripe/stripe-js'
	import type { Attachment } from 'svelte/attachments'
	import { dev } from '$app/env'
	import { getCheckoutContext } from './checkout-context.js'

	interface Props {
		contactDetailsOptions?: StripeCheckoutContactDetailsElementOptions
		element?: StripeContactDetailsElement
		onChange?: (event: StripeContactDetailsElementChangeEvent) => void
		onComplete?: (value: { email: string }) => void
		onReady?: () => void
		onFocus?: () => void
		onBlur?: () => void
		onEscape?: () => void
		onLoadError?: (error: StripeError) => void
	}

	let { contactDetailsOptions, element = $bindable(), onChange, onComplete, onReady, onFocus, onBlur, onEscape, onLoadError }: Props = $props()

	const ctx = getCheckoutContext()
	let checkout = $derived(ctx.checkout)

	const contactDetails: Attachment<HTMLElement> = (node) => {
		try {
			element = ctx.checkout?.createContactDetailsElement(contactDetailsOptions)
			element?.mount(node)
			element?.on('change', (e) => {
				onChange?.(e)
				if (e.complete) onComplete?.(e.value)
			})
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
	<div {@attach contactDetails}></div>
{/if}
