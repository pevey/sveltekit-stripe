# Change Log

## 2.0.4

- Update README
- No other changes

## 2.0.3

- Breaking Change from v1.x: PaymentOptions property renamed to PaymentElementOptions, and AddressOptions renamed to AddressElementOptions.
- Added a custom event for the Address Element that triggers when an address in entered with complete information.  This is useful for streamlining multi-step checkout pages.
- Bumped all dependencies to latest
- Removed PricingTable component
- Moved to Typescript
- Better typing of $stripeClient and $stripeElements
- Typescript will no longer complain if you use the AddressElement in your app without using the addressContainer property.
- This package now re-exports the types { Appearance, Stripe, StripeAddressElementOptions, StripePaymentElementOptions } from stripe-js for convenience.  If you define your appearance and element options elsewhere to be passed into the coponent as props, use these types for tooltips on available properties.

## 1.1.0

- Bump versions on all dependencies to latest

## 1.0.2

- Handle refreshing of client secret in stripeElement store in SPAs, where onDestroy does not seem to be reliably called

## 1.0.0

- Initial Release