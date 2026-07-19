<script lang="ts">
	import type {
		StripeCardNumberElement,
		StripeCardNumberElementOptions,
		StripeCardNumberElementChangeEvent
	} from '@stripe/stripe-js'
	import type { Attachment } from 'svelte/attachments'
	import { dev } from '$app/env'
	import { getStripeContext } from './context.js'

	interface Props {
		// see https://stripe.com/docs/js/element/other_element?type=cardNumber
		cardNumberOptions?: StripeCardNumberElementOptions
		element?: StripeCardNumberElement
		onChange?: (event: StripeCardNumberElementChangeEvent) => void
		onReady?: () => void
		onFocus?: () => void
		onBlur?: () => void
		onEscape?: () => void
	}

	let {
		cardNumberOptions,
		element = $bindable(),
		onChange,
		onReady,
		onFocus,
		onBlur,
		onEscape
	}: Props = $props()

	const ctx = getStripeContext()
	let elements = $derived(ctx.elements)

	const cardNumber: Attachment<HTMLElement> = (node) => {
		try {
			element = ctx.elements?.create('cardNumber', cardNumberOptions)
			element?.mount(node)
			element?.on('change', (e) => onChange?.(e))
			element?.on('ready', () => onReady?.())
			element?.on('focus', () => onFocus?.())
			element?.on('blur', () => onBlur?.())
			element?.on('escape', () => onEscape?.())
		} catch (e) {
			if (dev) console.error(e)
		}
		return () => {
			if (element) element.destroy()
		}
	}
</script>

{#if elements}
	<div {@attach cardNumber}></div>
{/if}
