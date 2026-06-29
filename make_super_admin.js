const mongoose = require('mongoose');

async function run() {
  try {
    // process.env.MONGODB_URI_NOSRV will be populated by --env-file
    await mongoose.connect(process.env.MONGODB_URI_NOSRV);
    console.log('Connected to DB');

    // Create a generic User schema if it doesn't exist
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    const email = 'akgamerz397@gmail.com';

    const result = await User.findOneAndUpdate(
      { email },
      { $set: { role: 'super_admin' } },
      { new: true }
    );

    if (result) {
      console.log(`Successfully updated ${email} to super_admin!`);
    } else {
      console.log(`User with email ${email} not found.`);
    }

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

run();
