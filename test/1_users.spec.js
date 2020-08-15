/* eslint-disable no-undef */
const mongoose = require('mongoose');
const expect = require('chai').expect
const supertest = require('supertest')
const { config } = require('../utils/utils');
const api = supertest(`${config.host}`)
console.log(`${config.host}`)

describe('Auth Test', () => {
  let user_id = ''
  let user_jwt = ''
  let rec_token = ''

  const username = 'onejohndoe'
  const email = 'email@mail.com'
  const password = 'John'

  before(async () => {
    console.log(config.mongo);
    await mongoose.connect(config.mongo, { useNewUrlParser: true });
    await mongoose.connection.db.dropDatabase();
  })
  it('Should create a user', (done) => {
    
    api
      .post('user/register')
      .set('Accept', 'application/json')
      .send({
        username,
        email,
        password
      })
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).to.equal('success')
        expect(res.body.message).to.equal('User created successfully')
        expect(res.body.data._id).to.have.lengthOf.above(0)
        expect(res.body.data.email).to.equal(email)
        expect(res.body.data.username).to.equal(username)
        expect(res.body.data.password).to.not.equal(password)
        user_id = res.body.data._id
        user_jwt = res.body.data.token
        done()
      })
  }).timeout(30000)

  it('Should login user', (done) => {
    api
      .post('user/login')
      .set('Accept', 'application/json')
      .send({
        email,
        password
      })
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).to.equal('success')
        expect(res.body.message).to.equal('User signed in')
        expect(res.body.data.email).to.equal(email)
        expect(res.body.data.password).to.not.equal(password)
        user_jwt = res.body.data.token
        done()
      })
  }).timeout(30000)

  it('Should send token', (done) => {
    api
      .post('user/send-token')
      .set('Accept', 'application/json')
      .send({
        email
      })
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).to.equal('success')
        expect(res.body.message).to.equal('Token sent')
        expect(res.body.data.length).to.equal(5)
        rec_token = res.body.data
        done()
      })
  }).timeout(10000)

  it('Should reset password', (done) => {
    const token = rec_token
    api
      .patch('user/reset-pass')
      .set('Accept', 'application/json')
      .send({
        email,
        password,
        token
      })
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).to.equal('success')
        expect(res.body.message).to.equal('Password reset')
        expect(res.body.data).to.equal(null)
        done()
      })
  }).timeout(10000)

  it('Should get a user', (done) => {
    api
      .get(`user/${user_id}`)
      .set('Accept', 'application/json')
      .set('authorization', `Bearer ${user_jwt}`)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).to.equal('success')
        expect(res.body.message).to.equal('User retrieved')
        expect(res.body.data).to.be.instanceof(Object)
        done()
      })
  }).timeout(10000)

  it('Should get all users', (done) => {
    api
      .get('user')
      .set('Accept', 'application/json')
      .set('authorization', `Bearer ${user_jwt}`)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).to.equal('success')
        expect(res.body.message).to.equal('Users retrieved')
        expect(res.body.data).to.be.instanceof(Array)
        done()
      })
  }).timeout(10000)
})

