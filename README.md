# hubot-help

A hubot script to show available hubot commands

See [`src/help.coffee`](src/help.coffee) for full documentation.

## Installation

In hubot project repo, run:

`npm install hubot-help --save`

Then add **hubot-help** to your `external-scripts.json`:

```json
["hubot-help"]
```

## Configuration

You can set various environment variables to tune up the behavior of thios help plugin:

- `HUBOT_HELP_REPLY_IN_PRIVATE` (set to any value) will force calls to `hubot help` to be answered in private
  - Note: it has been tested with `hubot-irc` and `hubot-slack`, it works for both  
    tested with `hubot-gitter2`, it fails to display the help  
    (please open issues if you can test on other adapters, to say if it works or not)
- `HUBOT_HELP_DISABLE_HTTP` (set to any value) will disable the web interface for help
- `HUBOT_HELP_HIDDEN_COMMANDS` comma-separated list of commands that will not be displayed in help

## Sample Interaction

```
user1>> hubot help
hubot>> hubot help - Displays all of the help commands that this bot knows about.
hubot>> hubot help <query> - Displays all help commands that match <query>.
```
