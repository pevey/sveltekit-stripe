# sveltekit-stripe

This package is a barebones SvelteKit implementation for concisely rendering Stripe Elements. It gets the job done in most cases with as little complexity as possible.

[Documentation](https://pevey.com/sveltekit-stripe)

## Features

- [Payment Element](https://stripe.com/docs/payments/payment-element)
- [Address Element](https://stripe.com/docs/elements/address-element)
- Individual card fields (`CardNumber` / `CardExpiry` / `CardCvc`) + confirm helpers
- [Express Checkout Element](https://stripe.com/docs/elements/express-checkout-element) (Apple/Google Pay, Link, PayPal)
- [Contact Details Element](https://stripe.com/docs/payments/elements/contact-details-element) (email + Link, with pre-fill)
- [Payment Method Messaging Element](https://stripe.com/docs/payments/payment-method-messaging) (BNPL promo)
- Server helpers (`sveltekit-stripe/server`): configured client, PaymentIntent/SetupIntent, webhook verification

## Setup

Create a SvelteKit project and install the package:

```bash
npm create svelte@latest my-app
cd my-app
npm install -D sveltekit-stripe
```

Install the Stripe.js peer dependency:

```bash
npm install @stripe/stripe-js
```

Add your Stripe public key to your environment variables:

`.env`

```bash
PUBLIC_STRIPE_KEY=pk_test_1234567890...
```

## Usage

After integrating Stripe with SvelteKit for the umpteenth time, I created this to significantly reduce the boilerplate I was writing over and over again.

A functioning Stripe integration can be achieved with very little code.

The options objects for the Svelte components are properly typed using the underlying Stripe library types to provide type hints for syntax. If you define your options outside of the component, you can import the Stripe types from this library instead of the underlying Stripe package.

### Basic Checkout (client secret)

The recommended pattern binds `stripe` and `elements` out of `<Elements>` and confirms in your submit handler:

```svelte
<script>
	import { Elements, PaymentElement } from 'sveltekit-stripe'
	import { PUBLIC_STRIPE_KEY } from '$env/static/public'
	let clientSecret = 'pi_...' // from your server
	let return_url = 'https://example.com/checkout/complete'
	let stripe = $state()
	let elements = $state()
</script>

<Elements publicKey={PUBLIC_STRIPE_KEY} elementsOptions={{ clientSecret }} bind:stripe bind:elements>
	<form onsubmit={async (e) => {
		e.preventDefault()
		const { error } = await stripe.confirmPayment({ elements, clientSecret, confirmParams: { return_url }, redirect: 'if_required' })
		if (error) console.log(error)
	}}>
		<PaymentElement />
		<button type="submit">Pay</button>
	</form>
</Elements>
```

You can also read `{ stripe, elements }` from the `children` snippet params instead of binding, if you prefer.

### Example: Self-Hosted Checkout Using `use:enhance`

In the example below, we assume we've already obtained a clientSecret. In many cases, your existing ecommerce backend (such as [Vendure](https://vendure.io)) or [Medusa](https://medusajs.com)) will handle generating payment intents and/or setup intents. Client secrets come from these intents. See a section further down for more information about generating client secrets if you need to generate them yourself.

NOTE: For payment setup rather than checkout, replace the line

`const stripeResponse = await stripe.confirmPayment({ elements, redirect: 'if_required' })`

with

`const stripeResponse = await stripe.confirmSetup({ elements, redirect: 'if_required' })`

The address element and payment element are Stripe-hosted forms, so any content entered will not be submitted to our server with the form. The payment and address element allow you to embed the forms on your own page, but all the processing still happens on Stripe servers. We can use SvelteKit's built-in `enhance` action on the form to have control what happens when a user submits the form. See the SvelteKit documentation on Form Actions for more detailed explanation of Form Actions and `use:enhance`.

The return_url below will be called after Stripe has processed the payment. The call to the return_url will include a payload from Stripe about the status of the payment.

`+page.svelte`

```svelte
<script>
	import { Elements, PaymentElement, type StripeElementsOptions } from 'sveltekit-stripe'
	import { PUBLIC_STRIPE_KEY } from '$env/static/public'
	import { enhance } from '$app/forms'
	let clientSecret = 'pi_1234567890...' // from your server, see README
	let success = false

	const elementsOptions: StripeElementsOptions = {
		appearance: {
			theme: 'stripe',
		},
		mode: 'payment',
		currency: 'usd',
		amount: 1000
	}
</script>

<Elements publicKey={PUBLIC_STRIPE_KEY} {elementsOptions}>
	{#snippet children({ stripe, elements })}
	<form method="POST" use:enhance={ async ({ cancel }) => {
		let stripeResponse = await elements?.submit()
		// console.log(stripeResponse)
		if (stripeResponse && !stripeResponse.error) {
			let stripeResponse = await stripe.confirmPayment({
				elements,
				clientSecret,
				confirmParams: { return_url: `https://example.com/order/success/${exampleOrderCode}` }
			})
			// console.log(stripeResponse)
			if (stripeResponse.error) {
				console.log(stripeResponse.error)
				cancel()
			}
		}
		return async ({ result }) => {
			// If we get here instead of being redirected to the url set above,
			// we know that something went wrong.
			errorMessage = stripeResponse?.error?.message
			processing = false
		}
	}}>
		<PaymentElement />
		<button type="submit">Place Your Order</button>
	</form>
	{/snippet}
</Elements>
```

### Example: Self-Hosted Checkout Using the Address Element

One way to use the Address component is to bind the container. Once we have a binding, we can use the Stripe-provided function getValue():

`+page.svelte`

```svelte
<script>
	import { Elements, PaymentElement, AddressElement } from 'sveltekit-stripe'
	import { PUBLIC_STRIPE_KEY } from '$env/static/public'
	import { enhance } from '$app/forms'
	let clientSecret = 'pi_1234567890...' // from your server, see README
	let addressContainer
</script>

<Elements publicKey={PUBLIC_STRIPE_KEY} {elementsOptions}>
	{#snippet children({ stripe, elements })}
	<form method="POST" use:enhance={ async ({ cancel }) => {
		const {complete, value} = await addressContainer.getValue()
		if (complete) {
			// save the address somewhere
			console.log(value)
		} //else {
			// You can choose to handle the error yourself (e.g., show an error message)
			// Or you can just continue the submission and Stripe will handle the error
		//}

		// ...submit to Stripe as in example above
	}}>
		<AddressElement {addressElementOptions} bind:addressContainer />
		<PaymentElement />
		<button type="submit">Place Your Order</button>
	</form>
	{/snippet}
</Elements>
```

### Example: Using the `onComplete` Callback Prop with the Address Element

One downside of the above is that it only gets the value when the entire form is submitted. This may not be suitable for some checkout flows. The Stripe-provided change event can be surfaced via the `onChange` callback prop, but this is not usually what we want. You still have to check each time to see if the form element is complete. For convenience, this package provides an `onComplete` callback prop that fires with any change that constitutes a full, valid address (it receives the address value directly).

```svelte
<AddressElement onComplete={async (value) => {
		console.log(value)
		// we have an address we can do something with
		// for instance, get shipping/payment options
	}}
/>
```

## Deferred Intent (create the PaymentIntent at submit)

You can render the Payment Element before creating a PaymentIntent by passing `mode`,
`amount`, and `currency` instead of a `clientSecret`. Fetch the client secret at submit:

```svelte
<script>
	import { Elements, PaymentElement } from 'sveltekit-stripe'
	import { PUBLIC_STRIPE_KEY } from '$env/static/public'
	let return_url = 'https://example.com/checkout/complete'
	let stripe = $state()
	let elements = $state()
</script>

<Elements
	publicKey={PUBLIC_STRIPE_KEY}
	elementsOptions={{ mode: 'payment', amount: 1099, currency: 'usd' }}
	bind:stripe
	bind:elements
>
	<form onsubmit={async (e) => {
		e.preventDefault()
		const { error: submitError } = await elements.submit()
		if (submitError) return
		const clientSecret = await fetchClientSecretFromServer()
		const { error } = await stripe.confirmPayment({
			elements,
			clientSecret,
			confirmParams: { return_url }
		})
		if (error) console.log(error)
	}}>
		<PaymentElement />
		<button type="submit">Pay</button>
	</form>
</Elements>
```

### Accessing `stripe` and `elements`

Bind them out of `<Elements>` with `bind:stripe` / `bind:elements` (shown above) to use
in your submit handler. Inside any descendant component you can also read the reactive
context directly:

```svelte
<script>
	import { getStripeContext } from 'sveltekit-stripe'
	const ctx = getStripeContext() // { stripe, elements }, reactive
</script>
```

> The module-level `stripeClient` / `stripeElements` stores and the `sveltekit-stripe/stores.js`
> export were removed in v4 — use `bind:` or `getStripeContext()` instead.

## Card Fields (Hosted Fields style)

For full control over your card form layout, use the individual `CardNumber`, `CardExpiry`,
and `CardCvc` components — you place and style each one yourself. They render inside
`<Elements>` (no `clientSecret` or `mode` needed for the card flow), and Stripe links the
three together automatically.

```svelte
<script>
	import { Elements, CardNumber, CardExpiry, CardCvc, confirmCardPayment } from 'sveltekit-stripe'
	import { PUBLIC_STRIPE_KEY } from '$env/static/public'

	let clientSecret = 'pi_...' // from your server
	let name = $state('')
	let stripe = $state()
	let elements = $state()

	const style = {
		base: { color: '#333', fontFamily: 'system-ui, sans-serif', fontSize: '16px' }
	}
</script>

<Elements publicKey={PUBLIC_STRIPE_KEY} bind:stripe bind:elements>
	<form onsubmit={async (e) => {
		e.preventDefault()
		const { error, paymentIntent } = await confirmCardPayment(stripe, elements, clientSecret, {
			payment_method: { billing_details: { name } }
		})
		if (error) console.log(error)
	}}>
		<label>Card number</label>
		<div class="field"><CardNumber cardNumberOptions={{ style }} /></div>

		<label>Expiry</label>
		<div class="field"><CardExpiry cardExpiryOptions={{ style }} /></div>

		<label>CVC</label>
		<div class="field"><CardCvc cardCvcOptions={{ style }} /></div>

		<input bind:value={name} placeholder="Name on card" />
		<button type="submit">Pay</button>
	</form>
</Elements>
```

Notes:

- These use Stripe's **classic card flow** (card-only; no `elements.submit()`). For wallets
  and 100+ payment methods, use `<PaymentElement>` (the Payment Element) instead.
- Only **one** of each field (`CardNumber`/`CardExpiry`/`CardCvc`) may be rendered per
  `<Elements>`.
- There is no card postal-code element — collect it with a plain input or the Address element.
- Each field exposes `onChange`/`onReady`/`onFocus`/`onBlur`/`onEscape` and a bindable
  `element`. The `onChange` event carries `complete`, `error`, and (for `CardNumber`) `brand`.

### Confirm helpers

`confirmCardPayment`, `confirmCardSetup`, and `createCardPaymentMethod` wrap Stripe's methods
and inject the card element for you (via `elements.getElement('cardNumber')`):

```svelte
// checkout (PaymentIntent)
await confirmCardPayment(stripe, elements, clientSecret, { payment_method: { billing_details: { name } } })

// save a card (SetupIntent)
await confirmCardSetup(stripe, elements, clientSecret, { payment_method: { billing_details: { name } } })

// create a PaymentMethod to confirm server-side
const { paymentMethod } = await createCardPaymentMethod(stripe, elements, { billing_details: { name } })
```

## Express Checkout, contact details & messaging

### Express Checkout (wallet buttons)

The Express Checkout Element shows one-click wallet buttons (Apple Pay, Google Pay, Link,
PayPal, …). It needs an `<Elements>` group created with `mode`/`amount`/`currency`:

```svelte
<script>
	import { Elements, ExpressCheckout } from 'sveltekit-stripe'
	import { PUBLIC_STRIPE_KEY } from '$env/static/public'
	let return_url = 'https://example.com/checkout/complete'
	let stripe = $state()
	let elements = $state()
</script>

<Elements
	publicKey={PUBLIC_STRIPE_KEY}
	elementsOptions={{ mode: 'payment', amount: 1099, currency: 'usd' }}
	bind:stripe
	bind:elements
>
	<ExpressCheckout
		onConfirm={async () => {
			const clientSecret = await fetchClientSecretFromServer()
			const { error } = await stripe.confirmPayment({ elements, clientSecret, confirmParams: { return_url }, redirect: 'if_required' })
			if (error) console.log(error)
		}}
	/>
</Elements>
```

### Contact Details (email + Link) — with pre-fill

Collects the customer's email and drives Link autofill. Pre-fill a logged-in customer via
`defaultValues`:

```svelte
<script>
	import { ContactDetails } from 'sveltekit-stripe'
	let { data } = $props() // e.g. { user: { email } } from your load function
</script>

<ContactDetails
	contactDetailsOptions={{ defaultValues: { email: data.user?.email } }}
	onComplete={(value) => console.log('email', value.email)}
/>
```

### Payment Method Messaging (BNPL promo)

Displays "pay over time" messaging. Its options are required:

```svelte
<script>
	import { PaymentMethodMessaging } from 'sveltekit-stripe'
</script>

<PaymentMethodMessaging
	paymentMethodMessagingOptions={{
		amount: 1099,
		currency: 'usd',
		countryCode: 'US',
		paymentMethodTypes: ['klarna', 'afterpay_clearpay']
	}}
/>
```

All of these are styled by the Appearance API you pass to `<Elements>` via
`elementsOptions.appearance`.

## Obtaining a Client Secret

Each time a user begins checkout, a payment intent needs to be generated. The payment intent contains a client secret that must be passed to the client. A valid client secret must be passed to the Address and Payment components, or they will not render.

In many use cases, another system, such as an ecommerce backend, already has a method of generating and providing client secrets for checkout. Please see the relevant documentation for your backend.

### Passing from Server to Client in a Load Function

One way to pass a client secret to the client in SvelteKit is via the load function. The client secret can be passed to the client as a prop, which is then passed to the Address and Payment components.

`+page.server.js`

```js
export const load = async () => {
	const clientSecret = await generateClientSecret() // example function
	return {
		clientSecret
	}
}
```

Please note that `generateClientSecret()` is not a real function. It is a placeholder for however you generate a client secret using your ecommerce backend.

`+page.svelte`

```svelte
<script>
	...
	export let data
	let clientSecret = data?.clientSecret
	...
</script>
```

### Passing from Server to Client in an Endpoint

Another way to obtain a client secret is to use an endpoint. A simplified example:

`+server.js`

```js
import { json } from '@sveltejs/kit'

export async function POST({ request }) {
	const data = await request.json()
	// some sort of validation on data
	const clientSecret = await generateClientSecret() // example function
	return json({ clientSecret })
}
```

NOTE: In practice, you would want to use recaptcha or turnstile on this endpoint. See example in a section below.

You can load the clientSecret from the server endpoint when the page loads like this:

`+page.svelte`

```js
{#if !clientSecret}
	let clientSecret = await fetch('/api/stripe', {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({some:data})
	}).then(res => res.json())
{:else}
// rest of page
```

Or, you can take advantage of the relatively new ability in Stripe to produce Payment element without yet having a clientSecret, and then generate the client secret when the payment is submitted. This approach of creating the intent/clientSecret at the last moment is useful if the final price might change due to shipping ot other charges, and avoids the need to use the stripe client to manually update the payment intent after it was initially created.

`+page.svelte`

```svelte
<script>
	import { Elements, PaymentElement, AddressElement } from 'sveltekit-stripe'
	import { PUBLIC_STRIPE_KEY } from '$env/static/public'
	import { enhance } from '$app/forms'
	let clientSecret = 'pi_1234567890...' // from your server, see README
	let addressContainer
</script>

<Elements publicKey={PUBLIC_STRIPE_KEY} {elementsOptions}>
	{#snippet children({ stripe, elements })}
	<form method="POST" use:enhance={ async ({ cancel }) => {
		let stripeResponse = await elements?.submit()
		// get the client secret here before final submission of payment
		const { clientSecret } = await fetch('/checkout/turnstile', {
			method: 'POST',
			body: JSON.stringify({ token })
		}).then(res => res.json()).catch(e => console.log(e))

		if (stripeResponse && !stripeResponse.error) {
			let stripeResponse = await stripe.confirmPayment({
				elements,
				clientSecret,
				confirmParams: { return_url: `https://example.com/order/success/${exampleOrderCode}` }
			})
			if (stripeResponse.error) {
				console.log(stripeResponse.error)
				cancel()
			}
		}
		return async ({ result }) => {
			// If we get here instead of being redirected to the url set above,
			// we know that something went wrong.
			errorMessage = stripeResponse?.error?.message
			processing = false
		}
	}}>
		<AddressElement onComplete={ async (value) => {
			console.log(value.firstName, value.lastName, value.address)
		}}/>
		<PaymentElement />
		<button type="submit">Place Your Order</button>
	</form>
	{/snippet}
</Elements>
```

### A Note About Security

Client secrets include payment intents. Exposing a way that a bot could generate payment intents very rapidly will expose you to carding attacks. There are number of ways to mitigate the risk of automated carding attacks. One way is client-side tools like Turnstile or reCAPTCHA. A full discussion is outside the scope of this readme, but it's important to mention. Consider using Turnstile or reCAPTCHA and other tools to rate limit the generation of payment intents.

If passing the client secret via a load function, consider adding a form action to the checkout page and make your checkout button post the token from Turnstile. The checkout page form action will run before the checkout page load function.

If obtaining the client secret via an endpoint, you can obtain a client-side token before calling the endpoint and validate the token before returning a payment intent. A Turnstile Example:

`+server.js`

```js
import { validateToken } from 'sveltekit-turnstile'
import { SECRET_TURNSTILE_KEY } from '$env/static/private'
import { error, json } from '@sveltejs/kit'

export async function POST({ request }) {
	const data = await request.json()
	if (!(await validateToken(data.token, SECRET_TURNSTILE_KEY)))
		throw error(400, { message: 'Bot risk' })
	// some sort of validation on data
	const clientSecret = await generateClientSecret() // example function
	return json(clientSecret)
}
```

`+page.svelte`

```svelte
<script>
	...
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public'
	import { Turnstile } from 'sveltekit-turnstile'

	let token: string
	...
</script>
...
{#if !token}
	<Turnstile siteKey={PUBLIC_TURNSTILE_SITE_KEY} on:turnstile-callback={ async (e) => {
		token = e.detail.token
	}} />
{:else}
...
```

## Checkout Sessions

Stripe Checkout Sessions come in two forms. Create the session on the server, then use the
matching client piece.

### Server

```ts
import { stripe } from '$lib/server/stripe'
import { createCheckoutSession } from 'sveltekit-stripe/server'

export const load = async () => {
	const { clientSecret } = await createCheckoutSession(stripe, {
		ui_mode: 'embedded_page', // or 'elements' for Custom Checkout
		mode: 'payment',
		line_items: [{ price: 'price_123', quantity: 1 }],
		return_url: 'https://example.com/return?session_id={CHECKOUT_SESSION_ID}'
	})
	return { clientSecret }
}
```

### Embedded Checkout (Stripe-hosted)

```svelte
<script>
	import { EmbeddedCheckout } from 'sveltekit-stripe'
	import { PUBLIC_STRIPE_KEY } from '$env/static/public'
	let { data } = $props()
</script>

<EmbeddedCheckout publicKey={PUBLIC_STRIPE_KEY} clientSecret={data.clientSecret} />
```

### Custom Checkout (build with Elements)

Wrap your checkout-mode elements in `<CheckoutProvider>` (session created with
`ui_mode: 'elements'`), and confirm via `loadCheckoutActions`:

```svelte
<script>
	import { CheckoutProvider, CheckoutPayment, CurrencySelector, loadCheckoutActions } from 'sveltekit-stripe'
	import { PUBLIC_STRIPE_KEY } from '$env/static/public'
	let { data } = $props()
	let checkout = $state()
</script>

<CheckoutProvider publicKey={PUBLIC_STRIPE_KEY} clientSecret={data.clientSecret} bind:checkout>
	<form onsubmit={async (e) => {
		e.preventDefault()
		const actions = await loadCheckoutActions(checkout)
		const result = await actions.confirm({ returnUrl: 'https://example.com/return' })
		if (result.type === 'error') console.log(result.error)
	}}>
		<CurrencySelector />
		<CheckoutPayment />
		<button type="submit">Pay</button>
	</form>
</CheckoutProvider>
```

Also available in Custom Checkout: `CheckoutBillingAddress`, `CheckoutShippingAddress`,
`CheckoutContactDetails`, `CheckoutExpressCheckout`. These read the `<CheckoutProvider>`
context (`getCheckoutContext`) — they are separate from the regular `<Elements>` components
(`getStripeContext`) and are not interchangeable.

## Payment Links

A [Payment Link](https://docs.stripe.com/payment-links) is a reusable, Stripe-hosted URL.
Create it on the server and send the customer to it.

### Server

```ts
import { stripe } from '$lib/server/stripe'
import { createPaymentLink } from 'sveltekit-stripe/server'

export const load = async () => {
	const { url } = await createPaymentLink(stripe, {
		line_items: [{ price: 'price_123', quantity: 1 }]
	})
	return { url }
}
```

### Client

Payment Links are external pages, so redirect with a full-page navigation — not SvelteKit's
`goto` (which is for internal routes):

```svelte
<script>
	import { redirectToPaymentLink } from 'sveltekit-stripe'
	let { data } = $props()
</script>

<button onclick={() => redirectToPaymentLink(data.url)}>Checkout</button>
<!-- or simply: <a href={data.url}>Checkout</a> -->
```

## Server (creating intents)

The Stripe server SDK cannot be run in edge environments like AWS Lambda or Cloudflare Workers.

First, install the Stripe Node SDK (peer dependency):

```bash
npm install stripe
```

> `sveltekit-stripe/server` is **server-only** (it imports the Node `stripe` SDK). Import it
> only from `.server.ts` / `+server.ts` / `+page.server.ts` / hooks — never from a client
> component.

Create a singleton client, passing your secret key:

`src/lib/server/stripe.ts`

```ts
import { createStripeServer } from 'sveltekit-stripe/server'
import { SECRET_STRIPE_KEY } from '$env/static/private'

export const stripe = createStripeServer(SECRET_STRIPE_KEY)
```

Create a PaymentIntent and return its client secret to the page:

`src/routes/checkout/+page.server.ts`

```ts
import { stripe } from '$lib/server/stripe'
import { createPaymentIntent } from 'sveltekit-stripe/server'

export const load = async () => {
	const { clientSecret } = await createPaymentIntent(stripe, {
		amount: 1099,
		currency: 'usd',
		automatic_payment_methods: { enabled: true }
	})
	return { clientSecret }
}
```

`createSetupIntent(stripe, params?)` works the same way for saving a card (SetupIntent).

### Verifying webhooks

```ts
// src/routes/webhooks/stripe/+server.ts
import { stripe } from '$lib/server/stripe'
import { constructWebhookEvent } from 'sveltekit-stripe/server'
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private'
import { error, json } from '@sveltejs/kit'

export async function POST({ request }) {
	const payload = await request.text() // raw body — required for signature verification
	const signature = request.headers.get('stripe-signature') ?? ''
	let event
	try {
		event = constructWebhookEvent(stripe, payload, signature, STRIPE_WEBHOOK_SECRET)
	} catch {
		throw error(400, 'Invalid signature')
	}
	if (event.type === 'payment_intent.succeeded') {
		// fulfill the order
	}
	return json({ received: true })
}
```

You can also bring your own client — every helper takes a `Stripe` instance, so
`new Stripe(key)` works instead of `createStripeServer`. And `createStripeServer` returns the
raw `stripe` client, so anything not wrapped here (customers, refunds, …) is one call away.

## Passing Options

The Payment and Address components support all options available in the Stripe SDK.

For details about options available, see the Stripe Documentation:

- Payment Element [(docs)](https://stripe.com/docs/js/element/payment_element)
- Address Element [(docs)](https://stripe.com/docs/js/element/address_element)

### Example: Passing Options

`+page.svelte`

```svelte
<script>
	...
	let addressElementOptions = {
		autocomplete: 'automatic',
		allowedCountries: ['US', 'CA'],
		blockPoBox: false,
		display: { name: 'split' }
		contacts: [{
			name: 'Jenny Rosen',
			address: {
				line1: '185 Berry St.',
				city: 'San Francisco',
				state: 'CA',
				postal_code: '94941',
				country: 'US',
			}
		}]
	}
	...
</script>

...
<AddressElement {addressElementOptions} />
...
```

### Example: Passing Options from a Separate File

If preferred, your options can be set in a separate file and imported.

`addressElementOptions.ts`

```ts
import type { StripeAddressElementOptions } from 'sveltekit-stripe'
export default addressElementOptions: StripeAddressElementOptions = {
	// options
}
```

`+page.svelte`

```svelte
import addressElementOptions from './addressElementOptions'
...
```

## Customizing the Elements

The Payment and Address components support the [Appearance API](https://stripe.com/docs/elements/appearance-api).
