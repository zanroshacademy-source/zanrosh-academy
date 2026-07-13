const merchantId = '384';
const clientSecret = 'secret';
const price = 100;
const basketId = 'TEST-123';

async function run() {
  const credentials = Buffer.from(`client:${clientSecret}`).toString('base64');
  const tokenRes = await fetch('https://secure.rapid-gateway.com/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const { access_token: token } = await tokenRes.json();
  console.log('Token acquired:', token.slice(0, 20) + '...');

  const txnParams = new URLSearchParams({
    MERCHANT_ID: merchantId,
    MERCHANT_NAME: 'Zanrosh Academy',
    TXNAMT: String(price),
    CURRENCY_CODE: 'PKR',
    CUSTOMER_MOBILE_NO: '03001234567',
    CUSTOMER_EMAIL_ADDRESS: 'student@zanroshacademy.com',
    BASKET_ID: basketId,
    TXNDESC: 'Zanrosh Academy - Unit Purchase',
    ORDER_DATE: new Date().toISOString().split('T')[0],
    SUCCESS_URL: 'https://httpbin.org/get',
    FAILURE_URL: 'https://httpbin.org/get',
    CHECKOUT_URL: 'https://httpbin.org/get',
    VERSION: 'MY_VER_1.0',
    PROCCODE: '0',
  });

  const txnRes = await fetch('https://secure.rapid-gateway.com/sandbox/process-transaction', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: txnParams,
    redirect: 'manual',
  });

  console.log('Status:', txnRes.status);
  console.log('Location:', txnRes.headers.get('location'));
  console.log('Body:', await txnRes.text());
}
run();
