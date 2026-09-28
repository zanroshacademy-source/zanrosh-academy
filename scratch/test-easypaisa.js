const crypto = require('crypto');

const HASH_KEY = '4PJX8LSZ9MLG92RR';
const STORE_ID = '999999';
const INDEX_URL = 'https://easypay.easypaisa.com.pk/easypay/Index.jsf';
const params = {
  storeId: STORE_ID,
  amount: '150.0',
  postBackURL: 'https://zanroshacademy.com/api/easypaisa/callback?orderRef=EP1234&userId=USER123',
  orderRefNum: 'EP' + Date.now(),
  expiryDate: '20261231 235959',
  autoRedirect: '0'
};

const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
const valueString = sorted.map(([k, v]) => `${k}=${v}`).join('&');
const keyBuffer = Buffer.from(HASH_KEY, 'utf8');
const cipher = crypto.createCipheriv('aes-128-ecb', keyBuffer.slice(0, 16), null);
cipher.setAutoPadding(true);
params.merchantHashedReq = Buffer.concat([cipher.update(valueString, 'utf8'), cipher.final()]).toString('base64');

console.log('Posting:', params);

fetch(INDEX_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(params).toString(),
  redirect: 'manual'
}).then(async r => {
  console.log('Status:', r.status);
  console.log('Location:', r.headers.get('location'));

  const text = await r.text();
  if (text.length > 500) {
    console.log('Response: (HTML)', text.substring(0, 500) + '...');
  } else {
    console.log('Response:', text);
  }
}).catch(console.error);
