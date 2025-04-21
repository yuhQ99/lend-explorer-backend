const { createPublicClient, http } = require('viem');
const config = require('./config');

const viemClient = createPublicClient({
  transport: http(config.rpc.uri), // Replace with your RPC URL
});

module.exports = viemClient;
