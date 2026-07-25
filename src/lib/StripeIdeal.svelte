<script lang="ts">
	// iDEAL billing input. Renders inside <Elements>. The consumer binds `name` and calls
	//   confirmIdealPayment(getStripeContext().stripe, clientSecret, { billingDetails: { name }, returnUrl })
	// on their own submit button; the browser then redirects to the shopper's bank.
	// `showFields={false}` renders nothing (the consumer supplies the name themselves).
	let {
		name = $bindable(''),
		showFields = true,
		label = 'Full name',
		placeholder = 'Full name',
		class: className = ''
	}: {
		name?: string
		showFields?: boolean
		label?: string
		placeholder?: string
		class?: string
	} = $props()
</script>

{#if showFields}
	<label class="block text-sm {className}">
		<span class="mb-1 block">{label}</span>
		<input type="text" bind:value={name} {placeholder} autocomplete="name" />
	</label>
{/if}
