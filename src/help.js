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
    let cmds = getHelpCommands(robot)
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

  robot.listen(msg => {
    const regExps = robot.listeners.map(item => {
      if (item.regex && item.regex.source) {
        return item.regex
      }
    }).filter(item => item)
    for (const reg of regExps) {
      const match = msg.text.match(reg)
      if (match && match[0]) {
        return false
      }
    }

    return true
  }, {}, msg => {
    const message = msg.message.text.replace('rocketbot ', '')
    const robotName = robot.alias || robot.name
    const ingnorWords = new RegExp(`${robotName} |\\s<.*>|\\s@.*`, 'g')
    let commands = getHelpCommands(robot)
        .filter(command => !command.match(/^begin|^end/i))
        .map(command => command.slice(0, command.indexOf('-') - 1))
        .filter(command => typoCorrection(message, command.replace(ingnorWords, '')))

    if (commands.length) msg.send(`Может ты имел ввиду - ${commands.map(command => `*${command}*`).join(', ')}?`)
  })

  if (process.env.HUBOT_HELP_DISABLE_HTTP == null) {
    return robot.router.get(`/${robot.name}/help`, (req, res) => {
      let cmds = getHelpCommands(robot).map(cmd => cmd.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))

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

var getHelpCommands = function getHelpCommands (robot) {
  let helpCommands = robot.helpCommands()

  const robotName = robot.alias || robot.name

  if (hiddenCommandsPattern()) {
    helpCommands = helpCommands.filter(command => !hiddenCommandsPattern().test(command))
  }

  helpCommands = helpCommands.map((command) => {
    if (robotName.length === 1) {
      return command.replace(/^hubot\s*/i, robotName)
    }

    return command.replace(/^hubot/i, robotName)
  })

  return helpCommands.sort()
}

var hiddenCommandsPattern = function hiddenCommandsPattern () {
  const hiddenCommands = process.env.HUBOT_HELP_HIDDEN_COMMANDS != null ? process.env.HUBOT_HELP_HIDDEN_COMMANDS.split(',') : undefined
  if (hiddenCommands) {
    return new RegExp(`^hubot (?:${hiddenCommands != null ? hiddenCommands.join('|') : undefined}) - `)
  }
}

var typoCorrection = function typoCorrection (checked, correct) {
  let checkedWord = checked.toLowerCase().split('')
  let correctWord = correct.toLowerCase().split('')
  let lengthWord = correct.length
  let intersections = []
  let pass
  let characterShift = []
  let expectedWord
  let check
  if (correctWord.length - checkedWord.length > 3) return false
  for (let i = 0; i <= lengthWord - 1; i++) {
    if (pass === checkedWord[i]) {
      for (let j = -1; j >= -2; j--) {
        if (correctWord[i] === checkedWord[i + j]) intersections.push(j)
      }
    }
    if (intersections.length - 1 === i) continue
    for (let j = -1 * (intersections[i - 1] === null || intersections[i - 1] === -1); j <= 2; j++) {
      if (correctWord[i] === checkedWord[i + j] && i + j <= lengthWord - 1) {
        intersections.push(j)
        if (j > 0) pass = checkedWord[i + j]
        break
      }
    }
    if (intersections.length - 1 < i) {
      intersections.push(null)
      if (intersections[i - 1] !== null && intersections[i - 2] !== null) {
        characterShift.push(correctWord[i])
      }
    }
  }
  intersections.push('', '', '')
  intersections = intersections.map((iteam, index) => iteam === null ? null : iteam + index)

  expectedWord = intersections.map(word => {
    if (word !== null) {
      return checkedWord[word]
    } else if (characterShift.length) {
      return characterShift.shift()
    }
  }).join('')
  if (expectedWord.length <= 2) return false
  check = new RegExp(expectedWord.slice(0, correct.length), 'i')

  return !!correct.match(check)
}
