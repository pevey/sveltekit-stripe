<script lang="ts">
	import type { StripeAddressElement, StripeAddressElementOptions } from '@stripe/stripe-js'
	import type { Attachment } from 'svelte/attachments'
	import { dev } from '$app/env'
	import { getStripeContext } from './context.js'

	interface Props {
		// see all options at https://stripe.com/docs/js/elements_object/create_address_element
		addressElementOptions?: StripeAddressElementOptions
		addressContainer?: StripeAddressElement
		onChange?: (e: any) => void
		onComplete?: (value: any) => void
		onReady?: (e: any) => void
		onFocus?: (e: any) => void
		onBlur?: (e: any) => void
	}

	let {
		addressElementOptions,
		addressContainer = $bindable(),
		onChange,
		onComplete,
		onReady,
		onFocus,
		onBlur
	}: Props = $props()

	const ctx = getStripeContext()
	let elements = $derived(ctx.elements)

	// Merge caller options over sensible defaults (props are read-only in runes).
	const options: StripeAddressElementOptions = $derived({
		mode: 'shipping',
		autocomplete: { mode: 'automatic' },
		allowedCountries: ['US'],
		blockPoBox: false,
		contacts: [],
		defaultValues: {},
		fields: { phone: 'always' },
		validation: { phone: { required: 'never' } },
		display: { name: 'split' },
		...addressElementOptions
	})

	const addressElement: Attachment<HTMLElement> = (node) => {
		// Drive mount/teardown from a LOCAL — assigning `addressContainer` is a write-only side effect.
		// Reading the bindable back inside this attachment would make the effect depend on state it also
		// writes, which loops immediately (`effect_update_depth_exceeded`).
		let el: StripeAddressElement | undefined
		try {
			el = ctx.elements?.create('address', options)
			addressContainer = el
			el?.mount(node)
			el?.on('change', (e: any) => {
				onChange?.(e)
				if (e.complete) onComplete?.(e.value)
			})
			el?.on('ready', (e: any) => onReady?.(e))
			el?.on('focus', (e: any) => onFocus?.(e))
			el?.on('blur', (e: any) => onBlur?.(e))
		} catch (e) {
			if (dev) console.error(e)
		}
		return () => {
			el?.destroy()
		}
	}
</script>

{#if elements}
	<div {@attach addressElement}></div>
{/if}
