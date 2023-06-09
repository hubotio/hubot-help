Hubot Help Plugin
==================

![Build Status](https://github.com/hubotio/hubot-help/actions/workflows/release.yml/badge.svg)

A hubot script to show available hubot commands

See [`src/help.js`](src/help.js) for full documentation.

Installation
-----------------

In hubot project repo, run:

`npm install hubot-help --save`

Then add **hubot-help** to your `external-scripts.json`:

```json
["hubot-help"]
```

Configuration
-----------------

You can set various environment variables to tune up the behavior of thios help plugin:

- `HUBOT_HELP_REPLY_IN_PRIVATE` (set to any value) will force calls to `hubot help` to be answered in private
- `HUBOT_HELP_DISABLE_HTTP` (set to any value) will disable the web interface for help
- `HUBOT_HELP_HIDDEN_COMMANDS` comma-separated list of commands that will not be displayed in help

Development
-----------------

For tests:

    npm test


Sample Interaction
-----------------

```
 user> hubot help
hubot> hubot help - Displays all of the help commands that this bot knows about.
hubot> hubot help <query> - Displays all help commands that match <query>.
```
