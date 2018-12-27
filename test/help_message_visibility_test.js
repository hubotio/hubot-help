'use strict'

/* global describe, beforeEach, afterEach, it, context */

const chai = require('chai')
const expect = chai.expect

chai.use(require('sinon-chai'))

const Helper = require('hubot-test-helper')

const helper = new Helper('../src/help.js')

describe('help', () => describe('message visibility', () => {
  beforeEach(function () {
    this.timeout(5000)
    this.room = helper.createRoom()
  })

  afterEach(function () {
    this.room.destroy()
  })

  context('when HUBOT_HELP_REPLY_IN_PRIVATE is unset', () => it('replies in the same room', function (done) {
    this.room.user.say('john', '@hubot help help').then(() => {
      expect(this.room.messages).to.eql([
        ['john', '@hubot help help'],
        ['hubot',
          {
            'attachments': [
              {
                'color': '#459d87',
                'text': '*hubot help *- Displays all of the help commands that this bot knows about.\n*hubot help <query> *- Displays all help commands that match <query>.',
                'title': 'Other commands',
                'collapsed': true
              }
            ]
          }

        ]
      ])
    }).then(done, done)
  }))
}))

describe('help', () => describe('message visibility', () => {
  beforeEach(function () {
    process.env.HUBOT_HELP_REPLY_IN_PRIVATE = true
    this.room = helper.createRoom()
  })

  afterEach(function () {
    delete process.env.HUBOT_HELP_REPLY_IN_PRIVATE
    this.room.destroy()
  })

  context('when HUBOT_HELP_REPLY_IN_PRIVATE is set', () => it('replies in a private message', function (done) {
    this.room.user.say('john', '@hubot help help').then(() => {
      expect(this.room.messages).to.eql([
        ['john', '@hubot help help'],
        ['hubot', '@john I just replied to you in private.']
      ])
      expect(this.room.privateMessages).to.eql({
        john: [
            ['hubot', '*hubot help *- Displays all of the help commands that this bot knows about.\n*hubot help <query> *- Displays all help commands that match <query>.']
        ]
      })
    }).then(done, done)
  }))
}))
