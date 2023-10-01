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

describe('help', () => describe('getHelpCommands', () => {
  let robot = null
  beforeEach(async () => {
    robot = await newTestRobot()
    await robot.run()
  })

  afterEach(() => {
    robot.shutdown()
  })

  describe('when HUBOT_HELP_HIDDEN_COMMANDS is not set', () => it('lists all commands', async () => {
    let wasCalled = false
    robot.adapter.on('send', (envelope, strings) => {
      const commands = strings[0].split('\n')
      assert.equal(commands.length, 2)
      assert.deepEqual(commands, robot.helpCommands())
      wasCalled = true
    })

    await robot.receive(new TextMessage(this.user, 'hubot help'))
    assert.deepEqual(wasCalled, true)
  }))

  describe('when HUBOT_HELP_HIDDEN_COMMANDS is set with 1 command', () => it('lists all commands but one set in environment variable', async () => {
    let wasCalled = false
    process.env.HUBOT_HELP_HIDDEN_COMMANDS = 'help'
    robot.adapter.on('send', (envelope, strings) => {
      const commands = strings[0].split('\n')
      assert.equal(commands.length, 1)
      assert.match(commands[0], /hubot help <query> - Displays all help commands that match <query>/)
      wasCalled = true
    })

    await robot.receive(new TextMessage(this.user, 'hubot help'))
    assert.deepEqual(wasCalled, true)
  }))

  describe('when HUBOT_HELP_HIDDEN_COMMANDS is set with multiple commands', () => it('lists all commands but comma separated ones in environment variable', async () => {
    let wasCalled = false
    process.env.HUBOT_HELP_HIDDEN_COMMANDS = 'help, help <query>'
    robot.adapter.on('send', (envelope, strings) => {
      const commands = strings[0].split('\n').filter(command => command.trim().length > 0)
      assert.equal(commands.length, 0)
      wasCalled = true
    })

    await robot.receive(new TextMessage(this.user, 'hubot help'))
    assert.deepEqual(wasCalled, true)
  }))
}))
