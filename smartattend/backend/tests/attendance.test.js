const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const AttendanceSession = require('../models/AttendanceSession');
const { encrypt } = require('../utils/crypto');
const jwt = require('jsonwebtoken');

describe('Attendance API', () => {
  let studentCookie;
  let teacherCookie;
  let studentUser;
  let testClass;
  let testSubject;
  let activeSession;

  // A dummy face template (128 floats)
  const dummyTemplate = Array(128).fill(0.1);
  const spoofTemplate = Array(128).fill(0.9); // will fail euclidean distance

  beforeEach(async () => {
    // 1. Create Class & Subject
    testClass = await Class.create({ name: 'CS101', description: 'Intro to CS' });
    testSubject = await Subject.create({ name: 'Programming', classId: testClass._id });

    // 2. Create Teacher
    const teacher = await request(app).post('/api/auth/register').send({
      fullName: 'Test Teacher',
      email: 'teacher@test.edu',
      password: 'password',
      role: 'TEACHER'
    });
    // Manually elevate to TEACHER since register makes STUDENT by default (wait, register makes student or requires role? Let's assume we update it)
    await User.updateOne({ email: 'teacher@test.edu' }, { role: 'TEACHER' });
    
    const tLogin = await request(app).post('/api/auth/login').send({ email: 'teacher@test.edu', password: 'password' });
    teacherCookie = tLogin.headers['set-cookie'];

    // 3. Create Student (with face enrolled)
    await request(app).post('/api/auth/register').send({
      fullName: 'Test Student',
      email: 'student@test.edu',
      password: 'password',
      role: 'STUDENT'
    });
    
    // Enroll Face and Assign Class manually
    const encryptedTemplate = encrypt(JSON.stringify(dummyTemplate));
    studentUser = await User.findOneAndUpdate(
      { email: 'student@test.edu' },
      { 
        classId: testClass._id,
        faceEnrolled: true,
        encryptedFaceTemplate: encryptedTemplate
      },
      { new: true }
    );

    const sLogin = await request(app).post('/api/auth/login').send({ email: 'student@test.edu', password: 'password' });
    studentCookie = sLogin.headers['set-cookie'];

    // 4. Create Active Session
    const sessionRes = await request(app)
      .post('/api/sessions/start')
      .set('Cookie', teacherCookie)
      .send({
        classId: testClass._id,
        subjectId: testSubject._id,
        durationMinutes: 10
      });
    
    activeSession = sessionRes.body;
  });

  it('should successfully verify a valid QR code', async () => {
    const res = await request(app)
      .post('/api/attendance/verify-qr')
      .set('Cookie', studentCookie)
      .send({
        sessionId: activeSession.session._id,
        token: activeSession.rawToken
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.verificationToken).toBeDefined();
  });

  it('should reject an invalid QR token', async () => {
    const res = await request(app)
      .post('/api/attendance/verify-qr')
      .set('Cookie', studentCookie)
      .send({
        sessionId: activeSession.session._id,
        token: 'invalid_fake_token_string'
      });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBeFalsy();
    expect(res.body.message).toContain('Invalid');
  });

  it('should successfully mark attendance with valid face descriptor', async () => {
    // 1. Get handoff token
    const qrRes = await request(app)
      .post('/api/attendance/verify-qr')
      .set('Cookie', studentCookie)
      .send({ sessionId: activeSession.session._id, token: activeSession.rawToken });
    
    const verificationToken = qrRes.body.verificationToken;

    // 2. Submit face
    const markRes = await request(app)
      .post('/api/attendance/mark')
      .set('Cookie', studentCookie)
      .send({
        verificationToken,
        liveDescriptor: dummyTemplate // matches exactly, distance = 0
      });

    expect(markRes.statusCode).toEqual(200);
    expect(markRes.body.success).toBeTruthy();
    expect(markRes.body.attendance.status).toEqual('PRESENT');
  });

  it('should reject attendance if face does not match', async () => {
    const qrRes = await request(app)
      .post('/api/attendance/verify-qr')
      .set('Cookie', studentCookie)
      .send({ sessionId: activeSession.session._id, token: activeSession.rawToken });
    
    const verificationToken = qrRes.body.verificationToken;

    const markRes = await request(app)
      .post('/api/attendance/mark')
      .set('Cookie', studentCookie)
      .send({
        verificationToken,
        liveDescriptor: spoofTemplate // vastly different
      });

    expect(markRes.statusCode).toEqual(403);
    expect(markRes.body.message).toContain('Face verification failed');
  });

  it('should prevent duplicate attendance', async () => {
    const qrRes = await request(app)
      .post('/api/attendance/verify-qr')
      .set('Cookie', studentCookie)
      .send({ sessionId: activeSession.session._id, token: activeSession.rawToken });
    
    const verificationToken = qrRes.body.verificationToken;

    // First mark
    await request(app)
      .post('/api/attendance/mark')
      .set('Cookie', studentCookie)
      .send({ verificationToken, liveDescriptor: dummyTemplate });

    // Second mark
    const markRes2 = await request(app)
      .post('/api/attendance/mark')
      .set('Cookie', studentCookie)
      .send({ verificationToken, liveDescriptor: dummyTemplate });

    expect(markRes2.statusCode).toEqual(400);
    expect(markRes2.body.message).toContain('already marked');
  });

  it('should reject if session is closed', async () => {
    // Close the session
    await request(app)
      .post(`/api/sessions/${activeSession.session._id}/close`)
      .set('Cookie', teacherCookie);
    
    const qrRes = await request(app)
      .post('/api/attendance/verify-qr')
      .set('Cookie', studentCookie)
      .send({ sessionId: activeSession.session._id, token: activeSession.rawToken });
    
    expect(qrRes.statusCode).toEqual(400);
    expect(qrRes.body.message).toContain('not active');
  });

  it('should prevent student from marking attendance for wrong class', async () => {
    const otherClass = await Class.create({ name: 'MATH101', description: 'Math' });
    await User.updateOne({ _id: studentUser._id }, { classId: otherClass._id });

    const qrRes = await request(app)
      .post('/api/attendance/verify-qr')
      .set('Cookie', studentCookie)
      .send({ sessionId: activeSession.session._id, token: activeSession.rawToken });
    
    expect(qrRes.statusCode).toEqual(403);
    expect(qrRes.body.message).toContain('does not belong');
  });

  it('should reject if face is not enrolled', async () => {
    await User.updateOne({ _id: studentUser._id }, { faceEnrolled: false });

    const qrRes = await request(app)
      .post('/api/attendance/verify-qr')
      .set('Cookie', studentCookie)
      .send({ sessionId: activeSession.session._id, token: activeSession.rawToken });
    
    expect(qrRes.statusCode).toEqual(403);
    expect(qrRes.body.message).toContain('enroll');
  });
});
