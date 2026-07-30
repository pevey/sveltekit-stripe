<script lang="ts">
	import type { StripeCardExpiryElement, StripeCardExpiryElementOptions, StripeCardExpiryElementChangeEvent } from '@stripe/stripe-js'
	import type { Attachment } from 'svelte/attachments'
	import { dev } from '$app/env'
	import { getStripeContext } from './context.js'

	interface Props {
		// see https://stripe.com/docs/js/element/other_element?type=cardExpiry
		cardExpiryOptions?: StripeCardExpiryElementOptions
		element?: StripeCardExpiryElement
		onChange?: (event: StripeCardExpiryElementChangeEvent) => void
		onReady?: () => void
		onFocus?: () => void
		onBlur?: () => void
		onEscape?: () => void
	}

	let { cardExpiryOptions, element = $bindable(), onChange, onReady, onFocus, onBlur, onEscape }: Props = $props()

	const ctx = getStripeContext()
	let elements = $derived(ctx.elements)

	const cardExpiry: Attachment<HTMLElement> = node => {
		let el: typeof element = undefined
		try {
			el = ctx.elements?.create('cardExpiry', cardExpiryOptions)
			element = el // write-only — never READ `element` inside this attachment (avoids the self-loop)
			el?.mount(node)
			el?.on('change', e => onChange?.(e))
			el?.on('ready', () => onReady?.())
			el?.on('focus', () => onFocus?.())
			el?.on('blur', () => onBlur?.())
			el?.on('escape', () => onEscape?.())
		} catch (e) {
			if (dev) console.error(e)
		}
		return () => el?.destroy()
	}
</script>

{#if elements}
	<div {@attach cardExpiry}></div>
{/if}
