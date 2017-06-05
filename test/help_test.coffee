hubot  = require 'hubot'
path   = require 'path'
sinon  = require 'sinon'
expect = require('chai').use(require('sinon-chai')).expect

Robot       = require 'hubot/src/robot'
TextMessage = require('hubot/src/message').TextMessage

newTestRobot = ->
  process.env.PORT = '0'
  robot = new Robot null, 'mock-adapter', true, 'hubot'
  robot.loadFile path.resolve('src/'), 'help.coffee'
  robot.adapter.on 'connected', ->
    robot.brain.userForId '1', {
      name: 'john'
      real_name: 'John Doe'
      room: '#test'
    }
  robot

describe 'help', ->

  describe 'getHelpCommands', ->
    beforeEach ->
      @robot = newTestRobot()
      @robot.run()
      @user = @robot.brain.userForName('john')

    afterEach ->
      @robot.shutdown()

    context 'when no configuration is set', ->
      context 'and all help is requested', ->
        it 'lists all commands', (done) ->
          @robot.adapter.on 'send', (envelope, strings) ->
            commands = strings[0].split '\n'
            expect(commands.length).to.eql(2)
            expect(commands).to.eql(@robot.helpCommands())
            done()
          @robot.adapter.receive new TextMessage(@user, 'hubot help')

      context 'and a filter is set', ->
        context 'and there is a match', ->
          it 'lists commands matching filter', (done) ->
            @robot.adapter.on 'send', (envelope, strings) ->
              commands = strings[0].split '\n'
              expect(commands.length).to.eql(1)
              expect(commands[0]).to.eql(
                'hubot help <query> - Displays all help commands that match <query>.'
              )
              done()
            @robot.adapter.receive new TextMessage(@user, 'hubot help query')

        context 'but there is no match', ->
          it 'apologize to user', (done) ->
            @robot.adapter.on 'send', (envelope, strings) ->
              commands = strings[0].split '\n'
              expect(commands.length).to.eql(1)
              expect(commands[0]).to.eql(
                'No available commands match xxx'
              )
              done()
            @robot.adapter.receive new TextMessage(@user, 'hubot help xxx')


    context 'when HUBOT_HELP_HIDDEN_COMMANDS is set', ->
      it 'only list commands not in HUBOT_HELP_HIDDEN_COMMANDS', (done) ->
        process.env.HUBOT_HELP_HIDDEN_COMMANDS = 'help'
        @robot.adapter.on 'send', (envelope, strings) ->
          commands = strings[0].split '\n'
          expect(commands.length).to.eql(1)
          expect(commands[0]).to.eql(
            'hubot help <query> - Displays all help commands that match <query>.'
          )
          done()
        @robot.adapter.receive new TextMessage(@user, 'hubot help')
