const PRIVATE_KEY =
  "ee4bc5d0a8d6713730ed4d402d53052f3e0eb3c66850142da395b56569f858ee";
const PUBLIC_KEY = "sec_5d4ce87d-b7e5-4027-93e2-83d8455fe11e";

const safepay = require("@sfpy/node-core")(PRIVATE_KEY, {
  authType: "secret",
  host: "https://sandbox.api.getsafepay.com",
});

const generateUrl = async () => {
  try {
    // Generate Time Tased Token (tbt)
    const { data: tbt } = await safepay.client.passport.create();
    console.log(tbt);

    // Create checkout session
    const {
      data: {
        tracker: { token },
      },
    } = await safepay.payments.session.setup({
      merchant_api_key: PUBLIC_KEY,
      intent: "CYBERSOURCE",
      mode: "payment",
      currency: "PKR",
      amount: 10000,
    });
    console.log(token);

    // Generate URL
    const checkoutUrl = safepay.checkout.createCheckoutUrl({
      env: "sandbox",
      source: "hosted",
      tbt,
      tracker: token,
      redirect_url: "https://example.com",
      cancel_url: "https://example.com",
      order_id: "1234",
    });

    console.log(checkoutUrl);
  } catch (error) {
    console.log(error);
  }
};

generateUrl();