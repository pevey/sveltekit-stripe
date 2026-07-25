<script lang="ts">
	import type {
		StripeExpressCheckoutElement,
		StripeExpressCheckoutElementOptions,
		StripeExpressCheckoutElementReadyEvent,
		StripeExpressCheckoutElementConfirmEvent,
		StripeExpressCheckoutElementClickEvent,
		StripeExpressCheckoutElementShippingAddressChangeEvent,
		StripeExpressCheckoutElementShippingRateChangeEvent,
		StripeExpressCheckoutElementAvailablePaymentMethodsChangeEvent,
		StripeError
	} from '@stripe/stripe-js'
	import type { Attachment } from 'svelte/attachments'
	import { dev } from '$app/env'
	import { getStripeContext } from './context.js'

	interface Props {
		// The wallet buttons (Apple/Google Pay, Link, PayPal, …). Requires <Elements> created
		// with mode/amount/currency. https://stripe.com/docs/js/element/express_checkout_element
		expressCheckoutOptions?: StripeExpressCheckoutElementOptions
		element?: StripeExpressCheckoutElement
		onReady?: (event: StripeExpressCheckoutElementReadyEvent) => void
		onConfirm?: (event: StripeExpressCheckoutElementConfirmEvent) => void
		onClick?: (event: StripeExpressCheckoutElementClickEvent) => void
		onCancel?: () => void
		onShippingAddressChange?: (event: StripeExpressCheckoutElementShippingAddressChangeEvent) => void
		onShippingRateChange?: (event: StripeExpressCheckoutElementShippingRateChangeEvent) => void
		onAvailablePaymentMethodsChange?: (event: StripeExpressCheckoutElementAvailablePaymentMethodsChangeEvent) => void
		onFocus?: () => void
		onBlur?: () => void
		onEscape?: () => void
		onLoadError?: (error: StripeError) => void
	}

	let {
		expressCheckoutOptions,
		element = $bindable(),
		onReady,
		onConfirm,
		onClick,
		onCancel,
		onShippingAddressChange,
		onShippingRateChange,
		onAvailablePaymentMethodsChange,
		onFocus,
		onBlur,
		onEscape,
		onLoadError
	}: Props = $props()

	const ctx = getStripeContext()
	let elements = $derived(ctx.elements)

	const expressCheckout: Attachment<HTMLElement> = (node) => {
		let el: typeof element = undefined
		try {
			el = ctx.elements?.create('expressCheckout', expressCheckoutOptions)
			element = el
			el?.mount(node)
			el?.on('ready', (e) => onReady?.(e))
			el?.on('confirm', (e) => onConfirm?.(e))
			el?.on('click', (e) => onClick?.(e))
			el?.on('cancel', () => onCancel?.())
			el?.on('shippingaddresschange', (e) => onShippingAddressChange?.(e))
			el?.on('shippingratechange', (e) => onShippingRateChange?.(e))
			el?.on('availablepaymentmethodschange', (e) => onAvailablePaymentMethodsChange?.(e))
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
	<div {@attach expressCheckout}></div>
{/if}
