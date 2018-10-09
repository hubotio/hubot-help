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

const deleteFormating = function deleteFormating (strings) {
  while (strings[0].indexOf('*-') !== -1) {
    strings[0] = strings[0].replace(/\*-/i, '-')
  }

  while (strings[0].indexOf('*') !== -1) {
    strings[0] = strings[0].replace(/\*/i, '')
  }
}

describe('help', () => describe('getHelpCommands', () => {
  beforeEach(function () {
    this.robot = newTestRobot()
    this.robot.run()
    this.user = this.robot.brain.userForName('john')
  })

  afterEach(function () {
    this.robot.shutdown()
  })

  context('when HUBOT_HELP_HIDDEN_COMMANDS is not set', () => it('lists all commands', function (done) {
    this.robot.adapter.on('send', function (envelope, strings) {
      deleteFormating(strings)

      const commands = strings[0].split('\n')

      expect(commands.length).to.eql(2)
      expect(commands).to.eql(this.robot.helpCommands())

      return done()
    })

    return this.robot.adapter.receive(new TextMessage(this.user, 'hubot help'))
  }))

  context('when HUBOT_HELP_HIDDEN_COMMANDS is set', () => it('lists all commands but those in environment variable', function (done) {
    process.env.HUBOT_HELP_HIDDEN_COMMANDS = 'help'
    this.robot.adapter.on('send', function (envelope, strings) {
      deleteFormating(strings)
      const commands = strings[0].split('\n')

      expect(commands.length).to.eql(1)
      expect(commands[0]).to.match(/hubot help <query> - Displays all help commands that match <query>/)

      return done()
    })

    return this.robot.adapter.receive(new TextMessage(this.user, 'hubot help'))
  }))
}))
