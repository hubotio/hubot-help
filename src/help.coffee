# Description:
#   Generates help commands for Hubot.
#
# Commands:
#   hubot help - Displays all of the help commands that Hubot knows about.
#   hubot help <query> - Displays all help commands that match <query>.
#
# URLS:
#   /hubot/help
#
# Configuration:
#   HUBOT_HELP_REPLY_IN_PRIVATE - Reply in private to `help`
#   HUBOT_HELP_PRIVATE_MSG      - Message to inform user that hubot replied in public
#   HUBOT_HELP_USE_ID           - Reply to user id instead of user name
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
  replyInPrivate      = process.env.HUBOT_HELP_REPLY_IN_PRIVATE
  privateNotifMessage = process.env.HUBOT_HELP_PRIVATE_MSG || 'replied to you in private!'
  useId               = process.env.HUBOT_HELP_USE_ID

  robot.respond /help(?:\s+(.*))?$/i, id: "hubot.help", (msg) ->
    cmds = renamedHelpCommands(robot)
    filter = msg.match[1]

    if filter
      cmds = cmds.filter (cmd) ->
        cmd.match new RegExp(filter, 'i')
      if cmds.length == 0
        msg.send "No available commands match #{filter}"
        return

    emit = cmds.join "\n"

    if replyInPrivate and (msg.message?.user?.name? || msg.message?.user?.id?)
      if(msg.message?.user?.name != msg.room && msg.message?.user?.id != msg.room)
        msg.reply privateNotifMessage
      if useId && msg.message?.user?.id?
        robot.send {room: msg.message?.user?.id}, emit
      else
        robot.send {room: msg.message?.user?.name}, emit
    else
      msg.reply emit

  robot.router.get "/#{robot.name}/help", (req, res) ->
    cmds = renamedHelpCommands(robot).map (cmd) ->
      cmd.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

    emit = "<p>#{cmds.join '</p><p>'}</p>"

    emit = emit.replace new RegExp("#{robot.name}", "ig"), "<b>#{robot.name}</b>"

    res.setHeader 'content-type', 'text/html'
    res.end helpContents robot.name, emit

renamedHelpCommands = (robot) ->
  robot_name = robot.alias or robot.name
  help_commands = robot.helpCommands().map (command) ->
    command.replace /^hubot/i, robot_name
  help_commands.sort()
