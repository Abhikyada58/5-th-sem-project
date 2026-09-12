const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Admin Authorization API', () => {
  let adminCookie;
  let studentCookie;

  beforeEach(async () => {
    // 1. Create Student
    await request(app).post('/api/auth/register').send({
      fullName: 'Test Student',
      email: 'student@test.edu',
      password: 'password',
      role: 'STUDENT'
    });
    const sLogin = await request(app).post('/api/auth/login').send({ email: 'student@test.edu', password: 'password' });
    studentCookie = sLogin.headers['set-cookie'];

    // 2. Create Admin
    await request(app).post('/api/auth/register').send({
      fullName: 'Test Admin',
      email: 'admin@test.edu',
      password: 'password',
      role: 'ADMIN'
    });
    await User.updateOne({ email: 'admin@test.edu' }, { role: 'ADMIN' });
    const aLogin = await request(app).post('/api/auth/login').send({ email: 'admin@test.edu', password: 'password' });
    adminCookie = aLogin.headers['set-cookie'];
  });

  it('should allow admin to access admin routes', async () => {
    const res = await request(app)
      .get('/api/admin/students')
      .set('Cookie', adminCookie);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
  });

  it('should strictly deny student access to admin routes', async () => {
    const res = await request(app)
      .get('/api/admin/students')
      .set('Cookie', studentCookie);
    
    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toContain('Forbidden');
  });

  it('should completely block access to admin APIs without a token', async () => {
    const res = await request(app).get('/api/admin/students');
    expect(res.statusCode).toEqual(401);
  });
});
