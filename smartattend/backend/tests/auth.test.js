const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Auth API', () => {
  const testStudent = {
    fullName: 'Test Student',
    email: 'student@test.edu',
    password: 'password123',
    role: 'STUDENT'
  };

  it('should register a new student', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testStudent);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBeTruthy();
    expect(res.body.user).toHaveProperty('email', testStudent.email);
    expect(res.body.user).not.toHaveProperty('passwordHash');
    
    const dbUser = await User.findOne({ email: testStudent.email });
    expect(dbUser).toBeTruthy();
  });

  it('should login an existing user', async () => {
    // First register
    await request(app).post('/api/auth/register').send(testStudent);

    // Then login
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testStudent.email, password: testStudent.password });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
    
    // Check if token cookie is set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/token=.*;/);
  });

  it('should fail login with incorrect password', async () => {
    await request(app).post('/api/auth/register').send(testStudent);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testStudent.email, password: 'wrongpassword' });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBeFalsy();
  });

  it('should reject login for suspended account', async () => {
    await request(app).post('/api/auth/register').send(testStudent);
    
    // Suspend the user manually
    await User.updateOne({ email: testStudent.email }, { accountStatus: 'SUSPENDED' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testStudent.email, password: testStudent.password });
    
    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toContain('suspended');
  });

  it('should reject login for expired account', async () => {
    await request(app).post('/api/auth/register').send(testStudent);
    
    // Expire the user
    await User.updateOne({ email: testStudent.email }, { accountExpiresAt: new Date(Date.now() - 10000) });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testStudent.email, password: testStudent.password });
    
    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toContain('expired');
  });
});
