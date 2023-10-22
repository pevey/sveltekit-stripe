<script lang="ts">
   import type { Appearance, Stripe, StripeAddressElementOptions } from '@stripe/stripe-js'
   import { loadStripe as stripejs } from '@stripe/stripe-js'
   import { onMount } from 'svelte'
   import { createEventDispatcher } from 'svelte'
   import { browser, dev } from '$app/environment'
   import { stripeClient, stripeElements } from '$lib/stores'

   export let publicKey: string
   export let clientSecret: string
   export let appearance: Appearance = { theme: 'stripe' }
   export let addressElementOptions: StripeAddressElementOptions|undefined = undefined
   export let addressContainer: any = {} 

   const dispatch = createEventDispatcher()

   // see all options available at
   // https://stripe.com/docs/js/elements_object/create_address_element
   if (!addressElementOptions) addressElementOptions = { mode: 'shipping' }
   addressElementOptions.mode = addressElementOptions.mode || 'shipping'
   addressElementOptions.autocomplete = addressElementOptions.autocomplete || { mode: 'automatic' }
   addressElementOptions.allowedCountries = addressElementOptions.allowedCountries || ['US']
   addressElementOptions.blockPoBox = addressElementOptions.blockPoBox || false
   addressElementOptions.contacts = addressElementOptions.contacts || []
   addressElementOptions.defaultValues = addressElementOptions.defaultValues || {}
   addressElementOptions.fields = addressElementOptions.fields || { phone: 'always' }
   addressElementOptions.validation = addressElementOptions.validation || { phone: { required: 'never' } }
   addressElementOptions.display = addressElementOptions.display || { name: 'split' }

   let mounted = false

   onMount(() => {		
      if (!publicKey || !clientSecret) return false

      // wrap in function since onMount callback can't be async
      async function loadStripe(publicKey: string) {
         if (!$stripeClient) {
            try {
               if (browser) {
                  const client: Stripe|null = await stripejs(publicKey)
                  stripeClient.set(client)
               }
            } catch (e) {
               if (dev) console.error(e)
            }
         }
         
         if (!$stripeElements) {
            try {
               $stripeElements = $stripeClient?.elements({ clientSecret, appearance })
            } catch (e) {
               if (dev) console.error(e)
            }
         }
         
         mounted = true
      }
      loadStripe(publicKey)

      return () => {
         mounted = false
      }
   })
   
   const addressElement = (node: any) => {
      try {
         // @ts-ignore
         addressContainer = $stripeElements?.create('address', addressElementOptions)
         addressContainer.mount(node)
         addressContainer.on('change', (e: any) => { 
            dispatch('change', e)
            if (e.complete) dispatch('complete', e.value.address)
         })
         addressContainer.on('ready', (e: any) => dispatch('ready', e))
         addressContainer.on('focus', (e: any) => dispatch('focus', e))
         addressContainer.on('blur', (e: any) => dispatch('blur', e))
      } catch (e) {
         if (dev) console.error(e)
      }
      return {
         destroy: () => {
            if (addressContainer) addressContainer.destroy()
            stripeClient.set(null)
            stripeElements.set(undefined)
         }
      }
   }

</script>

{#if mounted}
   <div use:addressElement />
{/if}