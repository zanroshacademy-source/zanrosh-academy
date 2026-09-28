// Run with: node scripts/cleanup-easypaisa-pending.js
// Deletes all pending Easypaisa payments that were never confirmed

const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  const Payment  = require('./models/Payment.ts')  // adjust if needed
  const Purchase = require('./models/Purchase.ts')

  const pendingPayments = await Payment.find({ method: 'easypaisa', status: 'pending' })
  console.log(`Found ${pendingPayments.length} pending Easypaisa payment(s)`)

  for (const p of pendingPayments) {
    await Purchase.deleteMany({ paymentId: p._id })
    await p.deleteOne()
    console.log('Deleted payment + purchase:', p.easypaisaRef)
  }

  console.log('Done.')
  await mongoose.disconnect()
}

cleanup().catch(console.error)
