const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

// Setup a small simulation of the erroring function
async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const Course = mongoose.models.Course || mongoose.model('Course', new mongoose.Schema({}, { strict: false }));
  const Chapter = mongoose.models.Chapter || mongoose.model('Chapter', new mongoose.Schema({}, { strict: false }));
  const Topic = mongoose.models.Topic || mongoose.model('Topic', new mongoose.Schema({}, { strict: false }));
  const Purchase = mongoose.models.Purchase || mongoose.model('Purchase', new mongoose.Schema({}, { strict: false }));

  const id = '6a41295c7bcc5a588423112d';

  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log('Invalid ID');
    return;
  }

  try {
    const course = await Course.findById(id).lean();
    console.log('Course:', !!course);
    if (!course || !course.isPublished) {
      console.log('Course not found or not published');
      return;
    }

    const units = await Chapter.find({ courseId: id, isPublished: true }).sort({ order: 1 }).lean();
    console.log('Units:', units.length);

    const allTopics = await Topic.find({
      unitId: { $in: units.map(u => u._id) },
      isPublished: true,
    }).sort({ order: 1 }).select('_id title duration order unitId').lean();
    console.log('Topics:', allTopics.length);

    const topicsByUnit = new Map();
    allTopics.forEach((t) => {
      const key = t.unitId?.toString();
      if (!topicsByUnit.has(key)) topicsByUnit.set(key, []);
      topicsByUnit.get(key).push(t);
    });

    const transformedUnits = units.map((u) => ({
      ...u,
      _id: u._id.toString(),
      courseId: u.courseId?.toString(),
      topics: (topicsByUnit.get(u._id.toString()) ?? []).map((t) => ({
        ...t,
        _id: t._id.toString(),
        unitId: u._id.toString(),
      })),
    }));

    console.log('Success, transformed units:', transformedUnits.length);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
