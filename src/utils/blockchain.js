const { Flipside } = require('@flipsidecrypto/sdk');
const Decimal = require('decimal.js');
const viemClient = require('../config/viem');
const config = require('../config/config');
const {
  topics,
  tokensList,
  poolAddress,
  multicallAddress,
  underlyingTokens,
  oracleAddress,
  underlyingTokensList,
  oracleBaseCurrencyUnit,
  symbolAndTokenDataMapping,
  tokenTypes,
} = require('../config/token');

const abi = [
  {
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    inputs: [{ name: 'asset', internalType: 'address', type: 'address' }],
    name: 'getReserveNormalizedIncome',
    stateMutability: 'view',
    type: 'function',
  },
  {
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    inputs: [{ name: 'asset', internalType: 'address', type: 'address' }],
    name: 'getReserveNormalizedVariableDebt',
    stateMutability: 'view',
    type: 'function',
  },
  {
    outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    inputs: [{ name: 'assets', internalType: 'address[]', type: 'address[]' }],
    name: 'getAssetsPrices',
    stateMutability: 'view',
    type: 'function',
  },
];

const flipsideLists = config.flipside.apiKeysList.map((apiKey) => new Flipside(apiKey, config.flipside.host));
let currentIndex = 0;

const getLastBlock = async () => {
  const query = `
    SELECT
      block_number
    FROM
      core.core.fact_blocks
    ORDER BY
      block_number DESC
    LIMIT 1;
  `;
  while (true) {
    try {
      const result = await flipsideLists[currentIndex].query.run({ sql: query, maxAgeMinutes: 1 });
      return result.records[0].block_number;
    } catch (e) {
      console.error(e);
      currentIndex = (currentIndex + 1) % config.flipside.apiKeysList.length;
    }
  }
};

const queryLogs = async (startBlock, endBlock, limit = 1000) => {
  const query = `
    SELECT *
    FROM core.core.ez_decoded_event_logs
    WHERE contract_address IN (${tokensList.map((el) => `'${el}'`).join(', ')})
      AND topic_0 IN ('${topics.transfer}', '${topics.mint}', '${topics.burn}', '${topics.balanceTransfer}')
      AND block_number >= ${startBlock}
      AND block_number <= ${endBlock}
      ORDER BY block_number asc
    LIMIT ${limit};
  `;
  while (true) {
    try {
      const { records } = await flipsideLists[currentIndex].query.run({ sql: query, maxAgeMinutes: 1 });
      return records;
    } catch (e) {
      console.error('Query logs in flipside error');
      console.error(e);
      currentIndex = (currentIndex + 1) % config.flipside.apiKeysList.length;
    }
  }
};

const queryLogsByBlockNumber = async (blockNumber) => {
  const query = `
    SELECT *
    FROM core.core.ez_decoded_event_logs
    WHERE contract_address IN (${tokensList.map((el) => `'${el}'`).join(', ')})
      AND topic_0 IN ('${topics.transfer}', '${topics.mint}', '${topics.burn}', '${topics.balanceTransfer}')
      AND block_number = ${blockNumber}
  `;
  while (true) {
    try {
      const { records } = await flipsideLists[currentIndex].query.run({ sql: query });
      return records;
    } catch (e) {
      console.error('Query logs in flipside error');
      console.error(e);
      currentIndex = (currentIndex + 1) % config.flipside.apiKeysList.length;
    }
  }
};

const callContractMultiCall = async (blockNumber) => {
  const [lendData, borrowData] = Object.keys(underlyingTokens).reduce(
    (acc, el) => {
      acc[0].push({
        address: poolAddress,
        abi,
        functionName: 'getReserveNormalizedIncome',
        args: [el],
      });
      acc[1].push({
        address: poolAddress,
        abi,
        functionName: 'getReserveNormalizedVariableDebt',
        args: [el],
      });
      return acc;
    },
    [[], []]
  );
  const getPriceData = {
    address: oracleAddress,
    abi,
    functionName: 'getAssetsPrices',
    args: [underlyingTokensList],
  };
  let result = await viemClient.multicall({
    contracts: [getPriceData, ...lendData, ...borrowData],
    multicallAddress,
    blockNumber,
  });
  const priceData = result[0];
  if (!priceData.result) {
    throw new Error('Price data is not available');
  }
  result = result.slice(1);
  result = underlyingTokensList.reduce((o, el, idx) => {
    const { symbol, decimals } = underlyingTokens[el];
    o[symbol] = {
      symbol,
      decimals,
      price: new Decimal(priceData.result[idx]).div(new Decimal(oracleBaseCurrencyUnit)).toString(),
      lendIndex: result[idx % underlyingTokensList.length].result.toString(),
      borrowIndex: result[(idx % underlyingTokensList.length) + underlyingTokensList.length].result.toString(),
    };
    return o;
  }, {});
  return result;
};

const findTokenInterest = async (token, mode) => {
  const readContractData = {
    address: poolAddress,
    abi,
    functionName: mode === tokenTypes.LEND ? 'getReserveNormalizedIncome' : 'getReserveNormalizedVariableDebt',
    args: [symbolAndTokenDataMapping[token].address],
  };
  return viemClient.readContract(readContractData);
};

const getBlockNumberByTimestamp = async (timestamp) => {
  const query = `
    SELECT
      block_number,
      block_timestamp
    FROM
      core.core.fact_blocks
    WHERE
      block_timestamp <= '${new Date(timestamp).toISOString()}'
    ORDER BY
      block_number DESC
    LIMIT 1;
  `;

  while (true) {
    try {
      const result = await flipsideLists[currentIndex].query.run({ sql: query, maxAgeMinutes: 1 });
      return result.records[0]?.block_number;
    } catch (e) {
      console.error('Query block by timestamp error');
      console.error(e);
      currentIndex = (currentIndex + 1) % config.flipside.apiKeysList.length;
    }
  }
};

module.exports = {
  getLastBlock,
  queryLogs,
  queryLogsByBlockNumber,
  callContractMultiCall,
  findTokenInterest,
  getBlockNumberByTimestamp,
};
