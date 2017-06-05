# Description:
#   Generates help commands for Hubot.
#
# Commands:
#   hubot help - Displays all of the help commands that this bot knows about.
#   hubot help <query> - Displays all help commands that match <query>.
#
# URLS:
#   /hubot/help
#
# Configuration:
#   HUBOT_HELP_REPLY_IN_PRIVATE - if set to any avlue, all `hubot help` replies are sent in private
#   HUBOT_HELP_DISABLE_HTTP - if set, no web entry point will be declared
#   HUBOT_HELP_HIDDEN_COMMANDS - comma-separated list of commands that will not be displayed in help
#
# Notes:
#   These commands are grabbed from comment blocks at the top of each file.

helpContents = (name, commands) ->

  """
<!DOCTYPE html>
<html>
  <head>
  <meta charset="utf-8">
  <title>#{name} Help</title>
  <style type="text/css">
    body {
      background: #d3d6d9;
      color: #636c75;
      text-shadow: 0 1px 1px rgba(255, 255, 255, .5);
      font-family: Helvetica, Arial, sans-serif;
    }
    h1 {
      margin: 8px 0;
      padding: 0;
    }
    .commands {
      font-size: 13px;
    }
    p {
      border-bottom: 1px solid #eee;
      margin: 6px 0 0 0;
      padding-bottom: 5px;
    }
    p:last-child {
      border: 0;
    }
  </style>
  </head>
  <body>
    <h1>#{name} Help</h1>
    <div class="commands">
      #{commands}
    </div>
  </body>
</html>
  """

module.exports = (robot) ->

  robot.respond /help(?:\s+(.*))?$/i, (msg) ->
    cmds = getHelpCommands(robot)
    filter = msg.match[1]

    if filter
      cmds = cmds.filter (cmd) ->
        cmd.match new RegExp(filter, 'i')
      if cmds.length is 0
        msg.send "No available commands match #{filter}"
        return

    emit = cmds.join '\n'

    if process.env.HUBOT_HELP_REPLY_IN_PRIVATE and msg.message?.user?.name?
      msg.reply 'replied to you in private!'
      robot.send { room: msg.message?.user?.name }, emit
    else
      msg.send emit

  if not process.env.HUBOT_HELP_DISABLE_HTTP?
    robot.router.get "/#{robot.name}/help", (req, res) ->
      cmds = renamedHelpCommands(robot).map (cmd) ->
        cmd.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      
      if req.query.q?
        cmds = cmds.filter (cmd) ->
          cmd.match new RegExp(req.query.q, 'i')

      emit = "<p>#{cmds.join '</p><p>'}</p>"

      emit = emit.replace new RegExp(robot.name, 'ig'), "<b>#{robot.name}</b>"

      res.setHeader 'content-type', 'text/html'
      res.end helpContents robot.name, emit

getHelpCommands = (robot) ->
  help_commands = robot.helpCommands()

  robot_name = robot.alias or robot.name

  if hiddenCommandsPattern()
    help_commands = help_commands.filter (command) ->
      not hiddenCommandsPattern().test(command)

  help_commands = help_commands.map (command) ->
    if robot_name.length is 1
      command.replace /^hubot\s*/i, robot_name
    else
      command.replace /^hubot/i, robot_name

  help_commands.sort()

hiddenCommandsPattern = ->
  hiddenCommands = process.env.HUBOT_HELP_HIDDEN_COMMANDS?.split ','
  new RegExp "^hubot (?:#{hiddenCommands?.join '|'}) - " if hiddenCommands
