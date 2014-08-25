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

## Sample Interaction

```
user1>> hubot help
hubot>> hubot help - Displays all of the help commands that Hubot knows about.
hubot>> hubot help <query> - Displays all help commands that match <query>.

```
