<script lang="ts">
   import type { Appearance, Stripe, StripePaymentElementOptions } from '@stripe/stripe-js'
   import { loadStripe as stripejs } from '@stripe/stripe-js'
   import { onMount } from 'svelte'
   import { browser, dev } from '$app/environment'
   import { stripeClient, stripeElements } from '$lib/stores'

   export let publicKey: string
   export let clientSecret: string
   export let appearance: Appearance = { theme: 'stripe' }
   export let paymentElementOptions: StripePaymentElementOptions|undefined = undefined
   export let paymentContainer: any = {}

   // see all options available at
   // https://stripe.com/docs/js/elements_object/create_payment_element
   if (!paymentElementOptions) paymentElementOptions = { layout: 'tabs' }

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
   
   const paymentElement = (node: any) => {
      try {
         paymentContainer = $stripeElements?.create('payment', paymentElementOptions)
         paymentContainer.mount(node)
      } catch (e) {
         if (dev) console.error(e)
      }
      return {
         destroy: () => {
            if (paymentContainer) paymentContainer.destroy()
            stripeClient.set(null)
            stripeElements.set(undefined)
         }
      }
   }

</script>

{#if mounted}
   <div use:paymentElement />
{/if}