<script lang="ts">
	// Przelewy24 (P24) billing input — name + email (Stripe requires the email). Renders inside
	// <Elements>. The consumer binds `name`/`email` and calls
	//   confirmP24Payment(stripe, clientSecret, { billingDetails: { name, email }, returnUrl })
	// on their submit button; the browser redirects to the shopper's bank. `showFields={false}` = no input.
	let {
		name = $bindable(''),
		email = $bindable(''),
		showFields = true,
		nameLabel = 'Full name',
		emailLabel = 'Email',
		class: className = ''
	}: {
		name?: string
		email?: string
		showFields?: boolean
		nameLabel?: string
		emailLabel?: string
		class?: string
	} = $props()
</script>

{#if showFields}
	<div class="grid gap-3 {className}">
		<label class="block text-sm">
			<span class="mb-1 block">{nameLabel}</span>
			<input type="text" bind:value={name} placeholder={nameLabel} autocomplete="name" />
		</label>
		<label class="block text-sm">
			<span class="mb-1 block">{emailLabel}</span>
			<input type="email" bind:value={email} placeholder={emailLabel} autocomplete="email" />
		</label>
	</div>
{/if}
