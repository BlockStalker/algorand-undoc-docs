const http = require("http");
const https = require("https");

// -- SET THESE VARS (SEE README) -- //

const ALGOD_TOKEN = "";
const INDEXER_TOKEN = ""; // usually empty

const DISCORD_WEBHOOK_ID = ""
const DISCORD_WEBHOOK_TOKEN = ""

// -- END VARS -- //

const handleResponse = (resolve, reject) => (response) => {
  const { statusCode, headers } = response;
  const contentType = response.headers['content-type'];

  if (statusCode - 200 >= 200) { // 400+
    // Consume response data to free up memory
    response.resume();
    return reject(new Error('Request Failed.\n' +
      `Status Code: ${statusCode}, Headers: ${JSON.stringify(headers)}`))
  }

  response.setEncoding('utf8');

  let rawData = "";
  response.on('data', (chunk) => { rawData += chunk; });

  response.on('end', () => {
    console.log(rawData)
    if (!/^application\/json/.test(contentType)) {
      return resolve(rawData);
    } else {
      try {
        const parsedData = JSON.parse(rawData);
        return resolve(parsedData);
      } catch (e) {
        return reject(e.message);
      }
    }
  });
};

const request = (options, body) => new Promise((resolve, reject) => {
  const protocol = options.port === 443 ? https : http;

  const request = protocol.request(options, handleResponse(resolve, reject));

  if (body) {
    request.write(JSON.stringify(body));
  }

  request.end();

  request.on('error', (e) => {
    reject(`Got error: ${e.message}`);
  });
});

const report = async () => {
  const algod = {
    method: "GET", hostname: "localhost", port: 8080, path: "/v2/status", headers: { "Authorization": `Bearer ${ALGOD_TOKEN}` }
  };

  const indexer = {
    method: "GET", hostname: "localhost", port: 8980, path: "/health", headers: { "Authorization": `Bearer ${INDEXER_TOKEN}` }
  }

  const discord = {
    method: "POST", hostname: "discord.com", port: 443, path: `/api/webhooks/${DISCORD_WEBHOOK_ID}/${DISCORD_WEBHOOK_TOKEN}`,
    headers: { "Content-Type": "application/json" },
  }

  const algodStatus = await request(algod).catch(console.error);
  const indexerStatus = await request(indexer).catch(console.error);

  const algodReport = {
    title: "Algod Report"
  };

  if (algodStatus) {
    algodReport.fields = [
      { name: "Last block", value: algodStatus["last-round"] },
      { name: "Sync time", value: algodStatus["catchup-time"] },
    ]
  } else {
    algodReport.description = "Algod is down";
  }

  const indexerReport = {
    title: "Indexer Report"
  };

  if (indexerStatus) {
    const lastIndexerBlock = Number(indexerStatus.round);

    indexerReport.fields = [
      { name: "Last block", value: lastIndexerBlock },
      { name: "Blocks remaining", value: (algodStatus["last-round"] - lastIndexerBlock) },
    ]
  } else {
    indexerReport.description = "Indexer is down";
  }

  await request(discord, { embeds: [algodReport, indexerReport] }).catch(console.error);
}


report();


