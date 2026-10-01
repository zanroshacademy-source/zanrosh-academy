const { MongoClient, ObjectId } = require('mongodb');

// Hardcoded credentials since dotenv may not be available
const MONGODB_URI = process.env.MONGODB_URI || require('fs').readFileSync('.env.local', 'utf8')
  .split('\n').find(l => l.startsWith('MONGODB_URI='))?.replace('MONGODB_URI=', '').trim();

async function unlock() {
  if (!MONGODB_URI) { console.error('No MONGODB_URI found'); process.exit(1); }
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('Connected to MongoDB');
  const db = client.db();
  
  // Find ALL pending easypaisa payments
  const pendingPayments = await db.collection('payments')
    .find({ status: 'pending' })
    .toArray();
  console.log('Found ' + pendingPayments.length + ' pending payment(s).');
  
  for (const payment of pendingPayments) {
    console.log('Processing: ' + payment._id + ' | user: ' + payment.userId + ' | method: ' + payment.method);

    // Mark as approved
    await db.collection('payments').updateOne(
      { _id: payment._id },
      { $set: { status: 'approved' } }
    );
    
    // Calculate expiry
    let expiresAt = null;
    if (payment.chapterId) {
      const chapter = await db.collection('chapters').findOne({ _id: payment.chapterId });
      const days = chapter ? (chapter.accessDays || 15) : 15;
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      console.log('  Chapter found, expires: ' + expiresAt);
    }
    
    // Create purchase if not exists
    const existing = await db.collection('purchases').findOne({ paymentId: payment._id });
    if (!existing) {
      const purchase = {
        userId: payment.userId,
        paymentId: payment._id,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      if (payment.courseId)  purchase.courseId  = payment.courseId;
      if (payment.chapterId) {
        purchase.chapterId = payment.chapterId;
        if (expiresAt) purchase.expiresAt = expiresAt;
      }
      await db.collection('purchases').insertOne(purchase);
      console.log('  Created Purchase for user: ' + payment.userId);
    } else {
      await db.collection('purchases').updateOne(
        { _id: existing._id },
        { $set: { status: 'approved' } }
      );
      console.log('  Updated existing Purchase for user: ' + payment.userId);
    }
  }
  
  await client.close();
  console.log('DONE! All pending payments approved and courses unlocked.');
}

unlock().catch(err => { console.error(err); process.exit(1); });
