<script lang="ts">
	import type {
		StripeCardCvcElement,
		StripeCardCvcElementOptions,
		StripeCardCvcElementChangeEvent
	} from '@stripe/stripe-js'
	import type { Attachment } from 'svelte/attachments'
	import { dev } from '$app/env'
	import { getStripeContext } from './context.js'

	interface Props {
		// see https://stripe.com/docs/js/element/other_element?type=cardCvc
		cardCvcOptions?: StripeCardCvcElementOptions
		element?: StripeCardCvcElement
		onChange?: (event: StripeCardCvcElementChangeEvent) => void
		onReady?: () => void
		onFocus?: () => void
		onBlur?: () => void
		onEscape?: () => void
	}

	let {
		cardCvcOptions,
		element = $bindable(),
		onChange,
		onReady,
		onFocus,
		onBlur,
		onEscape
	}: Props = $props()

	const ctx = getStripeContext()
	let elements = $derived(ctx.elements)

	const cardCvc: Attachment<HTMLElement> = (node) => {
		try {
			element = ctx.elements?.create('cardCvc', cardCvcOptions)
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
	<div {@attach cardCvc}></div>
{/if}
