/* eslint-disable no-undef */
const mongoose = require('mongoose');
const expect = require('chai').expect
const supertest = require('supertest')
const { config } = require('../utils/utils');
const api = supertest(`${config.host}`)
console.log(`${config.host}`)

let user_id = ''
let user_identifier = ''
let user_jwt = ''
let question_id = ''

const email = 'email@mail.com'
const password = 'John'


describe('Question Test', () => {
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
        user_id = res.body.data._id
        user_jwt = res.body.data.token
        user_identifier = res.body.data.identifier
        done()
      })
  }).timeout(30000)

  it('Should ask question', (done) => {
    data = {
      "title": "Ganache Cli private network, all ethers on the network go to 0 after a while",
      "text": "I create a ganache cli and initialize my accounts to have ethers using `ganache-cli -h '159.89.119.189' -a 3 -e '1000000000000000000000000000' --secure -u 0 -u 1 -u 2 -s 20` \n but after a couple of minutes, all accounts on the network are 0. I'm not able to run any transactions or call contracts again. \n A DApp i created connects to this private network. This is my app.js",
      "tags": ["ball", "davido", "stuff"]
    }
    api
      .post('question')
      .set('Accept', 'application/json')
      .set('authorization', `Bearer ${user_jwt}`)
      .send(data)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).to.equal('success')
        expect(res.body.message).to.equal('Question created successfully')
        expect(res.body.data.votes).to.equal(0)
        expect(res.body.data.user).to.equal(user_id)
        expect(res.body.data.title).to.equal(data.title)
        expect(res.body.data.text).to.equal(data.text)
        // expect(res.body.data.tags).to.equal(data.tags)
        question_id = res.body.data._id
        done()
      })
  }).timeout(30000)

  it('Should get all questions', (done) => {
    api
      .get('question')
      .set('Accept', 'application/json')
      .send(data)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).to.equal('success')
        expect(res.body.message).to.equal('Questions retrieved')
        expect(res.body.data.questions).to.be.instanceof(Array)
        done()
      })
  }).timeout(30000)

  it('Should answer question', (done) => {
    data = {
      "text": "your phoenix javascript library (dependency) is updated without notice. You should fix version so it is limited to less than 1.3.0 in package.json (if you are using npm) or bower.json if you are using bower to use old implementation, or use narrowtux solution if you downloaded js file manually. Or upgrade phoenix version.",
    }
    api
      .post(`question/${question_id}/answer`)
      .set('Accept', 'application/json')
      .set('authorization', `Bearer ${user_jwt}`)
      .send(data)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).to.equal('success')
        expect(res.body.message).to.equal('Question has been answered successfully')
        expect(res.body.data.votes).to.equal(0)
        expect(res.body.data.question).to.equal(question_id)
        expect(res.body.data.user).to.equal(user_id)
        expect(res.body.data.text).to.equal(data.text)
        done()
      })
  }).timeout(30000)

  it('Should view a question', (done) => {
    api
      .get(`question/${question_id}`)
      .set('Accept', 'application/json')
      .send(data)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).to.equal('success')
        expect(res.body.message).to.equal('Question retrieved successfully')
        expect(res.body.data.question.votes).to.equal(0)
        expect(res.body.data.answers.length).to.equal(1)
        done()
      })
  }).timeout(30000)

  it('Should upvote a question', (done) => {
    api
      .patch(`question/${question_id}/upvote`)
      .set('Accept', 'application/json')
      .set('authorization', `Bearer ${user_jwt}`)
      .send(data)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).to.equal('success')
        expect(res.body.message).to.equal('Question has been upvoted')
        expect(res.body.data.votes).to.equal(1)
        expect(res.body.data.user).to.equal(user_id)
        done()
      })
  }).timeout(30000)

  it('Should downvote a question', (done) => {
    api
      .patch(`question/${question_id}/downvote`)
      .set('Accept', 'application/json')
      .set('authorization', `Bearer ${user_jwt}`)
      .send(data)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).to.equal('success')
        expect(res.body.message).to.equal('Question has been downvoted')
        expect(res.body.data.votes).to.equal(0)
        expect(res.body.data.user).to.equal(user_id)
        done()
      })
  }).timeout(30000)

  it('Should subscribe to a question', (done) => {
    api
      .post(`question/${question_id}/subscribe`)
      .set('Accept', 'application/json')
      .set('authorization', `Bearer ${user_jwt}`)
      .send(data)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).to.equal('success')
        expect(res.body.message).to.equal('User has been subscribed successfully')
        expect(res.body.data.user).to.equal(user_id)
        expect(res.body.data.question).to.equal(question_id)
        done()
      })
  }).timeout(30000)

  it('Should answer another question', (done) => {
    data = {
      "text": "another answer to test subscription email.",
    }
    api
      .post(`question/${question_id}/answer`)
      .set('Accept', 'application/json')
      .set('authorization', `Bearer ${user_jwt}`)
      .send(data)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).to.equal('success')
        expect(res.body.message).to.equal('Question has been answered successfully')
        expect(res.body.data.votes).to.equal(0)
        expect(res.body.data.question).to.equal(question_id)
        expect(res.body.data.user).to.equal(user_id)
        expect(res.body.data.text).to.equal(data.text)
        done()
      })
  }).timeout(30000)
})

describe('Search Test', () => {
  it('Should search questions and answers from user', (done) => {
    api
      .get(`search?search=user:${user_identifier}`)
      .set('Accept', 'application/json')
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).to.equal('success')
        expect(res.body.message).to.equal('Saerch successful')
        expect(res.body.data).to.be.instanceof(Array)
        done()
      })
  }).timeout(30000)

  it('Should search questions and answers that contain text', (done) => {
    const text = 'ganache'
    api
      .get(`search?search=${text}`)
      .set('Accept', 'application/json')
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).to.equal('success')
        expect(res.body.message).to.equal('Saerch successful')
        expect(res.body.data).to.be.instanceof(Array)
        done()
      })
  }).timeout(30000)
})