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
		try {
			element = ctx.elements?.create('expressCheckout', expressCheckoutOptions)
			element?.mount(node)
			element?.on('ready', (e) => onReady?.(e))
			element?.on('confirm', (e) => onConfirm?.(e))
			element?.on('click', (e) => onClick?.(e))
			element?.on('cancel', () => onCancel?.())
			element?.on('shippingaddresschange', (e) => onShippingAddressChange?.(e))
			element?.on('shippingratechange', (e) => onShippingRateChange?.(e))
			element?.on('availablepaymentmethodschange', (e) => onAvailablePaymentMethodsChange?.(e))
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

{#if elements}
	<div {@attach expressCheckout}></div>
{/if}
