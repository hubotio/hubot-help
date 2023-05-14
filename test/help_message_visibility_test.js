'use strict'

/* global describe, beforeEach, afterEach, it, context */

const path = require('path')

const chai = require('chai')
const expect = chai.expect

chai.use(require('sinon-chai'))

const Hubot = require('hubot')
const Robot = Hubot.Robot
const TextMessage = Hubot.TextMessage

const newTestRobot = function newTestRobot () {
  process.env.PORT = '0'
  const robot = new Robot(null, 'mock-adapter-v3', true, 'hubot')

  robot.loadFile(path.resolve('src/'), 'help.js')

  robot.adapter.on('connected', () => robot.brain.userForId('1', {
    name: 'john',
    real_name: 'John Doe',
    room: '#test'
  }))

  return robot
}

describe('help in private', () => describe('message visibility', () => {
  beforeEach(function () {
    this.robot = newTestRobot()
    this.robot.run()
    this.user = this.robot.brain.userForName('john')
  })

  afterEach(function () {
    this.robot.shutdown()
  })

  context('when HUBOT_HELP_REPLY_IN_PRIVATE is unset', () => it('replies in the same room', function (done) {
    this.robot.adapter.on('send', function (envelope, strings) {
      expect(envelope.room).to.eql('#test')
      expect(strings[0].split('\n')).to.eql([
        'hubot help - Displays all of the help commands that this bot knows about.',
        'hubot help <query> - Displays all help commands that match <query>.'
      ])
      return done()
    })
    return this.robot.adapter.receive(new TextMessage(this.user, '@hubot help help'))
  }))

  context('when HUBOT_HELP_REPLY_IN_PRIVATE is set', () => it('replies in private', function (done) {
    process.env.HUBOT_HELP_REPLY_IN_PRIVATE = 'true'
    this.robot.adapter.on('send', function (envelope, strings) {
      expect(envelope.room).to.eql('1')
      expect(strings[0].split('\n')).to.eql([
        'hubot help - Displays all of the help commands that this bot knows about.',
        'hubot help <query> - Displays all help commands that match <query>.'
      ])
      return done()
    })
    return this.robot.adapter.receive(new TextMessage(this.user, 'hubot help'))
  }))
}))
