<script lang="ts">
	// Bancontact billing input (name only). Renders inside <Elements>. The consumer binds `name` and
	// calls confirmBancontactPayment(stripe, clientSecret, { billingDetails: { name }, returnUrl }) on
	// their submit button; the browser redirects to the shopper's bank. `showFields={false}` = no input.
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
