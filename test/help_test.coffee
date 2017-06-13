hubot  = require 'hubot'
path   = require 'path'
sinon  = require 'sinon'
expect = require('chai').use(require('sinon-chai')).expect

Hubot       = require "hubot"
Robot       = Hubot.Robot
TextMessage = Hubot.TextMessage

newTestRobot = ->
  process.env.PORT = '0'
  robot = new Robot null, 'mock-adapter', true, 'hubot'
  robot.loadFile path.resolve('src/'), 'help'
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

    context 'when HUBOT_ALIAS is set', ->
      context 'and alias is multi-charachter', ->
        beforeEach ->
          @robot.alias = 'toto'
        afterEach ->
          delete @robot.alias
        it 'lists help with hubot name replaced by the alias', (done) ->
          @robot.adapter.on 'send', (envelope, strings) ->
            commands = strings[0].split '\n'
            expect(commands.length).to.eql(2)
            expect(commands[1]).to.eql(
              'toto help <query> - Displays all help commands that match <query>.'
            )
            done()
          @robot.adapter.receive new TextMessage(@user, 'hubot help')

      context 'and alias is single-charachter', ->
        beforeEach ->
          @robot.alias = '.'
        afterEach ->
          delete @robot.alias
        it 'lists help with hubot name replaced by the alias, omitting the space', (done) ->
          @robot.adapter.on 'send', (envelope, strings) ->
            commands = strings[0].split '\n'
            expect(commands.length).to.eql(2)
            expect(commands[1]).to.eql(
              '.help <query> - Displays all help commands that match <query>.'
            )
            done()
          @robot.adapter.receive new TextMessage(@user, 'hubot help')

    context 'when HUBOT_HELP_HIDDEN_COMMANDS is set', ->
      beforeEach ->
        process.env.HUBOT_HELP_HIDDEN_COMMANDS = 'help'
      afterEach ->
        delete process.env.HUBOT_HELP_HIDDEN_COMMANDS
      it 'only list commands not in HUBOT_HELP_HIDDEN_COMMANDS', (done) ->
        @robot.adapter.on 'send', (envelope, strings) ->
          commands = strings[0].split '\n'
          expect(commands.length).to.eql(1)
          expect(commands[0]).to.eql(
            'hubot help <query> - Displays all help commands that match <query>.'
          )
          done()
        @robot.adapter.receive new TextMessage(@user, 'hubot help')

    context 'when HUBOT_HELP_REPLY_IN_PRIVATE is set', ->
      beforeEach ->
        process.env.HUBOT_HELP_REPLY_IN_PRIVATE = '1'
      afterEach ->
        delete process.env.HUBOT_HELP_REPLY_IN_PRIVATE
      it 'the list of commands is replied privately', (done) ->
        @robot.adapter.on 'send', (envelope, message) ->
          expect(envelope.room).to.eql('john')
          expect(message[0]).to.eql(@robot.helpCommands().join '\n')
          @robot.adapter.on 'reply', (envelope, message) ->
            expect(envelope.room).to.eql('#test')
            expect(message[0]).to.eql('replied to you in private!')
            done()
        @robot.adapter.receive new TextMessage(@user, 'hubot help')
