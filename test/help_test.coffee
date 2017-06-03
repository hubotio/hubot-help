chai   = require "chai"
expect = chai.expect
hubot  = require "hubot"
path   = require "path"
sinon  = require "sinon"

chai.use require "sinon-chai"

Robot       = require "hubot/src/robot"
TextMessage = require("hubot/src/message").TextMessage

newTestRobot = ->
  robot = new Robot null, "mock-adapter", false, "hubot"

  robot.loadFile path.resolve("src/"), "help.coffee"

  robot.adapter.on "connected", ->

    robot.brain.userForId "1",
      name: "john"
      real_name: "John Doe"
      room: "#test"

  robot

describe "help", ->

  describe "getHelpCommands", ->
    beforeEach ->
      @robot = newTestRobot()
      @robot.run()
      @user = @robot.brain.userForName("john")

    afterEach ->
      @robot.shutdown()

    context "when HUBOT_HELP_HIDDEN_COMMANDS is not set", ->
      it "lists all commands", (done) ->
        @robot.adapter.on "send", (envelope, strings) ->
          commands = strings[0].split "\n"

          expect(commands.length).to.eql(2)
          expect(commands).to.eql(@robot.helpCommands())

          done()

        @robot.adapter.receive new TextMessage(@user, "hubot help")

    context "when HUBOT_HELP_HIDDEN_COMMANDS is set", ->
      it "lists all commands but those in environment variable", (done) ->
        process.env.HUBOT_HELP_HIDDEN_COMMANDS = "help"
        @robot.adapter.on "send", (envelope, strings) ->
          commands = strings[0].split "\n"

          expect(commands.length).to.eql(1)
          expect(commands[0]).to.match(
            /hubot help <query> - Displays all help commands that match <query>/
          )

          done()

        @robot.adapter.receive new TextMessage(@user, "hubot help")
