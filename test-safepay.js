const https = require('https');

const SECRET_KEY = '79bb40450c97f16e7038ee5c80ad532279f031617b80f0454c2847b8c0ad013c';
const API_KEY = 'sec_9f09c3fd-1e36-425c-b3f3-4261e63aa00a';
const BASE_URL = 'https://sandbox.api.getsafepay.com';

async function testFlow() {
  const sessionRes = await fetch(`${BASE_URL}/order/payments/v3/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SFPY-MERCHANT-SECRET': SECRET_KEY,
    },
    body: JSON.stringify({
      merchant_api_key: API_KEY,
      mode: 'payment',
      currency: 'PKR',
      amount: 100000, 
    }),
  });

  const sessionData = await sessionRes.json();
  if (sessionData.status.errors.length > 0) {
    console.error('Session Error:', sessionData.status.errors);
    return;
  }
  const trackerToken = sessionData.data.tracker.token;
  console.log('Tracker:', trackerToken);
  console.log('Tracker Capabilities:', sessionData.data.capabilities);

  const passportRes = await fetch(`${BASE_URL}/client/passport/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SFPY-MERCHANT-SECRET': SECRET_KEY,
    },
  });

  const passportData = await passportRes.json();
  const tbt = passportData.data;

  const params = new URLSearchParams({
    environment: 'sandbox',
    beacon: trackerToken,
    tbt: tbt,
    source: 'hosted',
    redirect_url: 'http://localhost:3000/api/safepay/verify',
    cancel_url: 'http://localhost:3000/buy/test',
    order_id: 'test_order_123',
  });
  
  console.log('\n✅ Embedded Checkout URL (NO INTENT):');
  console.log(`${BASE_URL}/embedded/?${params.toString()}`);
}

testFlow().catch(console.error);
