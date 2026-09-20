const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Class = require('./models/Class');
const Subject = require('./models/Subject');

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartattend');
    console.log('Connected to MongoDB');

    // 1. Get the teacher
    const teacher = await User.findOne({ role: 'TEACHER', email: 'abhi.sir@example.com' }) || await User.findOne({ role: 'TEACHER' });
    
    if (!teacher) {
      console.log('No teacher found. Please create one.');
      process.exit(1);
    }
    console.log('Found teacher:', teacher.fullName);

    // 2. Create or find a class
    let classObj = await Class.findOne({ name: 'CS-101' });
    if (!classObj) {
      classObj = await Class.create({
        name: 'CS-101',
        semester: '1',
        academicYear: '2026-2027'
      });
      console.log('Created Class:', classObj.name);
    } else {
      console.log('Found Class:', classObj.name);
    }

    // 3. Create a subject and assign to teacher
    let subject = await Subject.findOne({ code: 'CS-201' });
    if (!subject) {
      subject = await Subject.create({
        name: 'Data Structures',
        code: 'CS-201',
        classId: classObj._id,
        teacherId: teacher._id
      });
      console.log('Created Subject:', subject.name);
    } else {
      // update teacher just in case
      subject.teacherId = teacher._id;
      subject.classId = classObj._id;
      await subject.save();
      console.log('Updated Subject:', subject.name);
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedData();
