# Safepay V1 API Integration Plan

The issue we were facing previously is that Safepay's V3 (Passport/TBT) embedded checkout requires specific merchant account configuration that often fails on Sandbox accounts. 

Based on the documentation you provided, we will switch the entire integration to **Safepay's simpler V1 API**, which bypasses the Passport token requirement entirely and relies on a simple HMAC signature for security.

## Proposed Changes

### [MODIFY] `app/api/safepay/create-session/route.ts`
- **Change API Endpoint:** Switch from `POST /order/payments/v3/` to `POST /order/v1/init`.
- **Change Payload:** The V1 API only requires your Public Key (`client`), `amount`, `currency`, and `environment`.
- **Remove TBT/Passport:** We will delete the step that generates the `tbt` token, as V1 doesn't use it.
- **Update Checkout URL:** We will construct the redirect URL to `/components` using only the `beacon` (tracker), `env`, `source`, `order_id`, `redirect_url`, and `cancel_url`.

### [MODIFY] `app/api/safepay/verify/route.ts`
- **Support POST Requests:** According to your docs, Safepay V1 redirects the user back to the success URL via an HTML Form POST request. We will update the route to export a `POST` handler that reads `request.formData()`.
- **Implement HMAC Signature Validation:** Instead of fetching the tracker status from Safepay's API, we will validate the payload locally by hashing the `tracker` with your `Secret Key` using `crypto.createHmac('sha256')`. If the signature matches, the payment is secure and valid.
- **Update Database:** We will extract the `reference` and `tracker` from the POST payload and save them to the database, marking the payment as approved.
- **Client Redirect:** After verifying the POST request and updating the database, the API will redirect the user's browser to the success page (`/buy/[id]?success=true`).

## Verification Plan
1. You will click the Buy button on a course.
2. The server will hit the V1 `/order/v1/init` API and redirect you to Safepay.
3. You will complete a test payment.
4. Safepay will POST back to our `/api/safepay/verify` route.
5. Our server will validate the HMAC signature and redirect you to the success screen.
