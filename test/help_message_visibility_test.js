'use strict'

const { describe, it, beforeEach, afterEach } = require('node:test')
const path = require('path')
const assert = require('node:assert/strict')
const Hubot = require('hubot')
const Robot = Hubot.Robot
const TextMessage = Hubot.TextMessage

const newTestRobot = async () => {
  process.env.PORT = 0
  const robot = new Robot('mock-adapter', true, 'hubot')
  await robot.loadFile(path.resolve('src/'), 'help.js')
  await robot.loadAdapter('./test/fixtures/MockAdapter.js')

  robot.adapter.on('connected', () => robot.brain.userForId('1', {
    name: 'john',
    real_name: 'John Doe',
    room: '#test'
  }))

  return robot
}

describe('help in private', () => describe('message visibility', () => {
  let robot = null
  beforeEach(async () => {
    robot = await newTestRobot()
  })

  afterEach(() => {
    robot.shutdown()
  })

  describe('when HUBOT_HELP_REPLY_IN_PRIVATE is unset', () => it('replies in the same room', (t, done) => {
    let wasCalled = false
    robot.adapter.on('send', (envelope, strings) => {
      assert.equal(envelope.room, '#test')
      assert.deepEqual(strings[0].split('\n'), [
        'hubot help - Displays all of the help commands that this bot knows about.',
        'hubot help <query> - Displays all help commands that match <query>.'
      ])
      wasCalled = true
    })
    robot.server.on('listening', async () => {
      await robot.run()
      const user = robot.brain.userForName('john')
      await robot.receive(new TextMessage(user, '@hubot help help'))
      assert.deepEqual(wasCalled, true)
      done()
    })
  }))

  describe('when HUBOT_HELP_REPLY_IN_PRIVATE is set', () => it('replies in private', (t, done) => {
    process.env.HUBOT_HELP_REPLY_IN_PRIVATE = 'true'
    let wasCalled = false
    robot.adapter.on('send', (envelope, strings) => {
      assert.equal(envelope.room, '1')
      assert.deepEqual(strings[0].split('\n'), [
        'hubot help - Displays all of the help commands that this bot knows about.',
        'hubot help <query> - Displays all help commands that match <query>.'
      ])
      wasCalled = true
    })
    robot.server.on('listening', async () => {
      await robot.run()
      const user = robot.brain.userForName('john')
      await robot.receive(new TextMessage(user, 'hubot help'))
      assert.deepEqual(wasCalled, true)
      done()
    })
  }))
}))
