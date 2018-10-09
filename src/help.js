'use strict'

// Description:
//   Generates help commands for Hubot.
//
// Commands:
//   hubot help - Displays all of the help commands that this bot knows about.
//   hubot help <query> - Displays all help commands that match <query>.
//
// URLS:
//   /hubot/help
//
// Configuration:
//   HUBOT_HELP_REPLY_IN_PRIVATE - if set to any value, all `hubot help` replies are sent in private
//   HUBOT_HELP_DISABLE_HTTP - if set, no web entry point will be declared
//   HUBOT_HELP_HIDDEN_COMMANDS - comma-separated list of commands that will not be displayed in help
//
// Notes:
//   These commands are grabbed from comment blocks at the top of each file.

const helpContents = (name, commands) => `\
<!DOCTYPE html>
<html>
  <head>
  <meta charset="utf-8">
  <title>${name} Help</title>
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
    <h1>${name} Help</h1>
    <div class="commands">
      ${commands}
    </div>
  </body>
</html>\
`

module.exports = (robot) => {
  robot.respond(/help(?:\s+(.*))?$/i, (msg) => {
    let cmds = getHelpCommands(robot, msg.message.user.name)
    const filter = msg.match[1]

    if (filter) {
      cmds = cmds.filter(cmd => cmd.match(new RegExp(filter, 'i')))
      if (cmds.length === 0) {
        msg.send(`No available commands match ${filter}`)
        return
      }
    }

    const emit = cmds.join('\n')

    if (process.env.HUBOT_HELP_REPLY_IN_PRIVATE && msg.message && msg.message.user && msg.message.user.name && msg.message.user.name !== msg.message.room) {
      msg.reply('I just replied to you in private.')
      return msg.sendPrivate(emit)
    } else {
      return msg.send(emit)
    }
  })

  if (process.env.HUBOT_HELP_DISABLE_HTTP == null) {
    return robot.router.get(`/${robot.name}/help`, (req, res) => {
      let msg
      let cmds = getHelpCommands(robot, msg.message.user.name).map(cmd => cmd.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))

      if (req.query.q != null) {
        cmds = cmds.filter(cmd => cmd.match(new RegExp(req.query.q, 'i')))
      }

      let emit = `<p>${cmds.join('</p><p>')}</p>`

      emit = emit.replace(new RegExp(`${robot.name}`, 'ig'), `<b>${robot.name}</b>`)

      res.setHeader('content-type', 'text/html')
      res.end(helpContents(robot.name, emit))
    })
  }
}
var stringFormatting = function stringFormatting (str) {
  const rights = /\(privileged: admins only\)/
  str = '*' + str
  str = str.replace(/ - /i, ' *- ')
  return str.replace(rights, '`privileged: admins only`')
}

var getHelpCommands = function getHelpCommands (robot) {
  let helpCommands = robot.helpCommands()

  const robotName = robot.alias || robot.name

  if (hiddenCommandsPattern()) {
    helpCommands = helpCommands.filter(command => !hiddenCommandsPattern().test(command))
  }

  helpCommands = helpCommands.map((command) => {
    if (robotName.length === 1) {
      command = command.replace(/^hubot\s*/i, robotName)
      return stringFormatting(command)
    }

    command = command.replace(/^hubot/i, robotName)
    return stringFormatting(command)
  })

  return helpCommands.sort()
}

var hiddenCommandsPattern = function hiddenCommandsPattern () {
  const hiddenCommands = process.env.HUBOT_HELP_HIDDEN_COMMANDS != null ? process.env.HUBOT_HELP_HIDDEN_COMMANDS.split(',') : undefined
  if (hiddenCommands) {
    return new RegExp(`^hubot (?:${hiddenCommands != null ? hiddenCommands.join('|') : undefined}) - `)
  }
}
