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
const routines = require('hubot-routines')

let groupCommand

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
      groupCommand = groupByMarkerGroupName(robot, cmds, 'group')
      return msg.send(makeRichMessage(groupCommand))
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
  if (!str.match(/^(begin|end)/i)) {
    str = '*' + str
    str = str.replace(/ - /i, ' *- ')
  }
  return str
}

/**
 * Parse the array with commands and write groups names and relevant commands to the object.
 *
 * @param {Robot} robot - Hubot instance.
 * @param {array} commands - Array of commands.
 * @param {string} markerName - The name of the marker that mark a start of commands group.
 *
 * @returns {object}
 */
var groupByMarkerGroupName = function groupByMarkerGroupName (robot, commands, markerName) {
  let commandsObject = {}
  let errStatus
  let groupName
  let inMarkerGroup = false
  let inOpeningMarker = false
  let marker
  let markerFullName
  let markerGroupName
  let markerMatch
  let markerReg = new RegExp(`(begin|end)\\s*(${markerName})\\s*(.*)`, 'i')
  let markerRole

  let pushInGroup = (command, markerGroupName) => {
    if (!commandsObject[markerGroupName]) {
      commandsObject[markerGroupName] = []
    }
    commandsObject[markerGroupName].push(command)
  }
  commands.map((command, index) => {
    markerMatch = command.match(markerReg)
    if (markerMatch) {
      marker = markerMatch[1]
      markerRole = markerMatch[2]
      groupName = markerMatch[3]
      markerFullName = markerMatch[0]
      if ((inMarkerGroup && (marker + markerRole) === 'begingroup')) {
        errStatus = `closing`
      }
      if (!inOpeningMarker && markerFullName === `end ${markerName}`) {
        markerGroupName = !inOpeningMarker ? false : markerGroupName
        errStatus = `opening`
      }

      inOpeningMarker = marker === 'begin'
      inMarkerGroup = inOpeningMarker && markerRole === markerName
      markerGroupName = (inMarkerGroup && markerFullName) ? groupName : markerGroupName
    } else {
      if (inMarkerGroup) {
        if (commands.length === index + 1) {
          errStatus = `closing`
        }
        pushInGroup(command, markerGroupName)
      } else {
        pushInGroup(command, 'Other commands')
      }
    }
    if (errStatus) {
      throw (routines.rave(robot, `${markerGroupName ? `In the script "${markerGroupName}" ` : `In some script`} the ${errStatus} marker was not found.`))
    }
  })
  return commandsObject
}

/**
 * Construct the array of rich messages.
 *
 * @param {object} groupCommand - Object with commands divided into groups by keys.
 *
 * @returns {object}
 */
var makeRichMessage = function makeRichMessage (groupCommand) {
  let result = []
  let makeRichMessage = (group) => {
    let commandText
    commandText = groupCommand[group]

    result.push({
      color: '#459d87',
      title: group,
      text: commandText.join('\n'),
      collapsed: true
    })
  }
  for (let group in groupCommand) {
    if (group !== 'Other commands') {
      makeRichMessage(group)
    }
  }
  if (groupCommand['Other commands']) {
    makeRichMessage('Other commands')
  }
  return {attachments: result}
}

var getHelpCommands = function getHelpCommands (robot) {
  let helpCommands = robot.commands

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

  return helpCommands
}

var hiddenCommandsPattern = function hiddenCommandsPattern () {
  const hiddenCommands = process.env.HUBOT_HELP_HIDDEN_COMMANDS != null ? process.env.HUBOT_HELP_HIDDEN_COMMANDS.split(',') : undefined
  if (hiddenCommands) {
    return new RegExp(`^hubot (?:${hiddenCommands != null ? hiddenCommands.join('|') : undefined}) - `)
  }
}
