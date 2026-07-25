<script lang="ts">
	import type {
		StripeContactDetailsElement,
		StripeContactDetailsElementOptions,
		StripeContactDetailsElementChangeEvent,
		StripeError
	} from '@stripe/stripe-js'
	import type { Attachment } from 'svelte/attachments'
	import { dev } from '$app/env'
	import { getStripeContext } from './context.js'

	interface Props {
		// Email + Link (formerly the Link Authentication Element). Pre-fill a logged-in user
		// via contactDetailsOptions={{ defaultValues: { email } }}.
		// https://stripe.com/docs/payments/elements/contact-details-element
		contactDetailsOptions?: StripeContactDetailsElementOptions
		element?: StripeContactDetailsElement
		onChange?: (event: StripeContactDetailsElementChangeEvent) => void
		onComplete?: (value: { email: string }) => void
		onReady?: () => void
		onFocus?: () => void
		onBlur?: () => void
		onEscape?: () => void
		onLoadError?: (error: StripeError) => void
	}

	let {
		contactDetailsOptions,
		element = $bindable(),
		onChange,
		onComplete,
		onReady,
		onFocus,
		onBlur,
		onEscape,
		onLoadError
	}: Props = $props()

	const ctx = getStripeContext()
	let elements = $derived(ctx.elements)

	const contactDetails: Attachment<HTMLElement> = (node) => {
		let el: typeof element = undefined
		try {
			el = ctx.elements?.create('contactDetails', contactDetailsOptions)
			element = el
			el?.mount(node)
			el?.on('change', (e) => {
				onChange?.(e)
				if (e.complete) onComplete?.(e.value)
			})
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

{#if elements}
	<div {@attach contactDetails}></div>
{/if}
