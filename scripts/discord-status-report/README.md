# Report AlgoD and Indexer to Discord

A **0 dependency script** for querying archival node and indexer statuses and send to a discord webhook. its verbose because it doesnt use dependencies.

> clone or copy the script to wherever youd like on the node / indexer host machine

here is an example to send it to `/etc/algorand-discord-report`

```sh
mkdir /etc/algorand-discord-report
curl -s -o /etc/algorand-discord-report/report.js https://raw.githubusercontent.com/AlgoChads/algorand-undoc-docs/main/scripts/discord-status-report/script.js
```

> create a webhook on your private discord server

1. create a channel for reports
2. right click -> channel settings
3. integrations -> create webhook
4. copy webhook url: `https://discord.com/api/webhooks/<WEBHOOK_ID>/<WEBHOOK_TOKEN>`

> configure the `discord-status-report.js` script

```js
const ALGOD_TOKEN = ""; // $ALGORAND_DATA/algod.admin.token
const INDEXER_TOKEN = ""; // default no token unless you ran algorand-indexer --token option

// https://discord.com/api/webhooks/<WEBHOOK_ID>/<WEBHOOK_TOKEN>
const DISCORD_WEBHOOK_ID = "";
const DISCORD_WEBHOOK_TOKEN = "";
```

> set up cron task to report on a schedule

1. open the cron schedule for the current user

```sh
crontab -e
```

2. use [this cron guide](https://devhints.io/cron) to determine the syntax for your chosen schedule

3. enter the schedule followed by the **absolute paths** to the `node` binary and reporting script

```sh
# example of every 2 hours
0 */2 * * * /absolute/path/to/node/binary /absolute/path/to/report.js
```

4. save and exit, cron will handle the rest

> modify the script

- add any other data you want reported in the following format to the fields arrays

```js
// general form
{ name: "field name", value: "field value" }
// add to this array (or indexer equivalent below)
algodReport.fields = [
      { name: "Last block", value: lastBlock },
      { name: "Sync time", value: algodStatus["catchup-time"] },
    ]
```

- if either service fails to respond it will report its down and skip the fields
- more info on format of discord webhook payload [discord embed format](https://discord.com/developers/docs/resources/channel#embed-object)
- [shape of data from algod status check](https://developer.algorand.org/docs/rest-apis/algod/v2/#get-v2status)
- feel free to request other data using the `algod` and `indexer` request object configs as templates
