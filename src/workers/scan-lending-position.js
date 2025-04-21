const mongoose = require('mongoose');
const config = require('../config/config');
const { customService, currentLendingPositionService, snapshotService } = require('../services');
const { address0, tokens, tokenTypes, underlyingTokens } = require('../config/token');
const blockchainUtils = require('../utils/blockchain');
const pick = require('../utils/pick');
const mathUtils = require('../utils/math');

const trackedKey = 'CREDIT_LAST_BLOCK_NUMBER';
const lastBlockKey = 'LAST_BLOCK_NUMBER_ON_CHAIN';

const upsertData = async (snapshots, lastPosition, lastBlock, lastBlockOnChain) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (snapshots && snapshots.length > 0) {
        await currentLendingPositionService.bulkUpdate(lastPosition, session);
        await snapshotService.create(snapshots, session);
        await customService.insertOrUpdate(trackedKey, lastBlock, session);
        await customService.insertOrUpdate(lastBlockKey, lastBlockOnChain, session);
      } else {
        await customService.insertOrUpdate(lastBlockKey, lastBlockOnChain, session);
      }
    });
  } catch (e) {
    console.error('Transaction aborted');
    throw e;
  } finally {
    await session.endSession();
  }
};

const process = async () => {
  console.info(`Start processing at ${new Date().toISOString()}`);
  const lastBlock = await blockchainUtils.getLastBlock();
  const trackingData = await customService.getCustomByKey(trackedKey);
  let trackingBlock;
  if (trackingData) {
    trackingBlock = trackingData.value + 1;
  } else {
    trackingBlock = 0;
  }
  console.info(`Fetch log from ${trackingBlock} to ${lastBlock} at ${new Date().toISOString()}`);
  const logs = await blockchainUtils.queryLogs(trackingBlock, lastBlock);
  if (!logs || !logs.length) {
    await upsertData(null, null, null, lastBlock);
    console.info('No new logs');
    return 0;
  }
  const lastBlockInQuery = logs[logs.length - 1].block_number;
  let processingLogs;
  if (logs[0].block_number === lastBlockInQuery) {
    processingLogs = await blockchainUtils.queryLogsByBlockNumber(lastBlockInQuery);
  } else {
    processingLogs = logs.filter((el) => el.block_number !== lastBlockInQuery);
  }
  const blockAndLogsMapping = processingLogs.reduce((o, log) => {
    if (!o[`${log.block_number}`]) {
      o[`${log.block_number}`] = {
        blockNumber: log.block_number,
        blockTimestamp: log.block_timestamp,
        liquidityIndex: {},
        transferLogs: [],
      };
    }
    if (['Mint', 'Burn', 'BalanceTransfer'].includes(log.event_name)) {
      const scaledToken = log.full_decoded_log.address.toLowerCase();
      if (!o[`${log.block_number}`].liquidityIndex[tokens[scaledToken].underlyingToken]) {
        o[`${log.block_number}`].liquidityIndex[tokens[scaledToken].underlyingToken] = {};
      }
      if (tokens[scaledToken].type === tokenTypes.LEND) {
        o[`${log.block_number}`].liquidityIndex[tokens[scaledToken].underlyingToken].lend = log.decoded_log.index;
      } else if (tokens[scaledToken].type === tokenTypes.BORROW) {
        o[`${log.block_number}`].liquidityIndex[tokens[scaledToken].underlyingToken].borrow = log.decoded_log.index;
      }
    } else {
      o[`${log.block_number}`].transferLogs.push({
        ...log.decoded_log,
        token: log.contract_address,
      });
    }
    return o;
  }, {});
  const userAndDataMapping = {};
  for (const block in blockAndLogsMapping) {
    const { blockNumber, blockTimestamp, transferLogs, liquidityIndex } = blockAndLogsMapping[block];
    if (!Object.keys(liquidityIndex).length) {
      console.info('No liquidityIndex, block:', blockNumber);
      throw new Error('No liquidityIndex');
    }
    const userAndTokenMapping = {};
    for (const log of transferLogs) {
      if (!tokens[log.token]) {
        console.info(`Error token not listed, block: ${blockNumber}, token: ${log.token}`);
        throw new Error('Token not listed');
      }
      const { underlyingToken } = tokens[log.token];
      if (!address0.has(log.from)) {
        if (!userAndTokenMapping[log.from]) {
          userAndTokenMapping[log.from] = {};
        }
        if (!userAndTokenMapping[log.from][underlyingToken]) {
          userAndTokenMapping[log.from][underlyingToken] = {
            user: log.from,
            token: underlyingToken,
            lend: {
              amount: '0',
            },
            borrow: {
              amount: '0',
            }
          };
        }
      }
      if (!address0.has(log.to)) {
        if (!userAndTokenMapping[log.to]) {
          userAndTokenMapping[log.to] = {};
        }
        if (!userAndTokenMapping[log.to][underlyingToken]) {
          userAndTokenMapping[log.to][underlyingToken] = {
            user: log.to,
            token: underlyingToken,
            lend: {
              amount: '0',
            },
            borrow: {
              amount: '0',
            }
          }
        }
      }
      if (tokens[log.token].type === tokenTypes.LEND) {
        // from: -value
        // to: + value
        if (!address0.has(log.from)) {
          userAndTokenMapping[log.from][underlyingToken].lend.amount = (
            BigInt(`${userAndTokenMapping[log.from][underlyingToken].lend.amount}`) - BigInt(`${log.value}`)
          ).toString();
          userAndTokenMapping[log.from][underlyingToken].lend.liquidityIndex = liquidityIndex[underlyingToken].lend.toString();
          // userAndTokenMapping[log.from][underlyingToken].lend.scaledBalance = mathUtils.rayDiv(userAndTokenMapping[log.from][underlyingToken].lend.amount,  userAndTokenMapping[log.from][underlyingToken].lend.liquidityIndex);
          userAndTokenMapping[log.from][underlyingToken].lend.blockNumber = blockNumber;
          userAndTokenMapping[log.from][underlyingToken].lend.date = new Date(blockTimestamp);
        }
        if (!address0.has(log.to)) {
          userAndTokenMapping[log.to][underlyingToken].lend.amount = (
            BigInt(`${userAndTokenMapping[log.to][underlyingToken].lend.amount}`) + BigInt(`${log.value}`)
          ).toString();
          userAndTokenMapping[log.to][underlyingToken].lend.liquidityIndex = liquidityIndex[underlyingToken].lend.toString();
          // userAndTokenMapping[log.to][underlyingToken].lend.scaledBalance = mathUtils.rayDiv(userAndTokenMapping[log.to][underlyingToken].lend.amount,  userAndTokenMapping[log.to][underlyingToken].lend.liquidityIndex);
          userAndTokenMapping[log.to][underlyingToken].lend.blockNumber = blockNumber;
          userAndTokenMapping[log.to][underlyingToken].lend.date = new Date(blockTimestamp);
        }
      } else if (tokens[log.token].type === tokenTypes.BORROW) {
        if (!address0.has(log.from)) {
          userAndTokenMapping[log.from][underlyingToken].borrow.amount = (
            BigInt(`${userAndTokenMapping[log.from][underlyingToken].borrow.amount}`) - BigInt(`${log.value}`)
          ).toString();
          userAndTokenMapping[log.from][underlyingToken].borrow.liquidityIndex = liquidityIndex[underlyingToken].borrow.toString();
          // userAndTokenMapping[log.from][underlyingToken].borrow.scaledBalance = mathUtils.rayDiv(userAndTokenMapping[log.from][underlyingToken].borrow.amount,  userAndTokenMapping[log.from][underlyingToken].borrow.liquidityIndex);
          userAndTokenMapping[log.from][underlyingToken].borrow.blockNumber = blockNumber;
          userAndTokenMapping[log.from][underlyingToken].borrow.date = new Date(blockTimestamp);
        }
        if (!address0.has(log.to)) {
          userAndTokenMapping[log.to][underlyingToken].borrow.amount = (
            BigInt(`${userAndTokenMapping[log.to][underlyingToken].borrow.amount}`) + BigInt(`${log.value}`)
          ).toString();
          userAndTokenMapping[log.to][underlyingToken].borrow.liquidityIndex = liquidityIndex[underlyingToken].borrow.toString();
          // userAndTokenMapping[log.to][underlyingToken].borrow.scaledBalance = mathUtils.rayDiv(userAndTokenMapping[log.to][underlyingToken].borrow.amount,  userAndTokenMapping[log.to][underlyingToken].borrow.liquidityIndex);
          userAndTokenMapping[log.to][underlyingToken].borrow.blockNumber = blockNumber;
          userAndTokenMapping[log.to][underlyingToken].borrow.date = new Date(blockTimestamp);
        }
      }
    }
    for (const user in userAndTokenMapping) {
      for (const token in userAndTokenMapping[user]) {
        if (!userAndDataMapping[user]) {
          userAndDataMapping[user] = {};
        }
        if (!userAndDataMapping[user][token]) {
          userAndDataMapping[user][token] = [];
        }
        userAndDataMapping[user][token].push(userAndTokenMapping[user][token]);
      }
    }
  }
  let snapshotData = [];
  const lastPosition = [];
  for (const userAddress in userAndDataMapping) {
    for (const token in userAndDataMapping[userAddress]) {
      const { symbol } = underlyingTokens[token];
      const currentData = await currentLendingPositionService.queryOne({
        user: userAddress,
      });
      if (currentData && currentData.tokensData[symbol]) {
        const { lend, borrow } = currentData.tokensData[symbol];
        const userTokenData = userAndDataMapping[userAddress][token];
        const currentPosition = userTokenData[0];
        if (lend && Object.keys(lend).length > 0) {
          currentPosition.lend.amount = (BigInt(currentPosition.lend.amount) + BigInt(lend.amount)).toString()
          if (!currentPosition.lend.liquidityIndex) {
            // Current data not have liquidityIndex -> amount = 0 -> use index & scaled balance of previous data
            currentPosition.lend.liquidityIndex = lend.liquidityIndex;
            currentPosition.lend.scaledBalance = lend.scaledBalance;
            currentPosition.lend.blockNumber = lend.blockNumber;
            currentPosition.lend.date = lend.date;
          }
        }
        if (borrow && Object.keys(borrow).length > 0) {
          currentPosition.borrow.amount = (BigInt(currentPosition.borrow.amount) + BigInt(borrow.amount)).toString()
          if (!currentPosition.borrow.liquidityIndex) {
            currentPosition.borrow.liquidityIndex = borrow.liquidityIndex;
            currentPosition.borrow.scaledBalance = borrow.scaledBalance;
            currentPosition.borrow.blockNumber = borrow.blockNumber;
            currentPosition.borrow.date = borrow.date;
          }
        }
        currentPosition.blockNumber = Math.max(
          currentPosition.lend.blockNumber ? currentPosition.lend.blockNumber : 0,
          currentPosition.borrow.blockNumber ? currentPosition.borrow.blockNumber : 0,
        )
      }
      const snapshots = userAndDataMapping[userAddress][token].reduce((arr, el) => {
        const lastSnapshot = arr[arr.length - 1] || { lend: { amount: '0' }, borrow: { amount: '0' } };
        // calculate lend snapshot
        const lendAmount = (BigInt(`${lastSnapshot.lend.amount}`) + BigInt(`${el.lend.amount}`)).toString();
        el.lend.amount = lendAmount[0] === '-' && lendAmount.length <= 3 ? '0' : lendAmount;
        el.lend.liquidityIndex = el.lend.liquidityIndex ?? lastSnapshot.lend.liquidityIndex;
        if (el.lend.liquidityIndex) {
          el.lend.scaledBalance = mathUtils.rayDiv(el.lend.amount, el.lend.liquidityIndex.toString());
        }
        el.lend.blockNumber = el.lend.blockNumber ?? lastSnapshot.lend.blockNumber;
        el.lend.date = el.lend.date ?? lastSnapshot.lend.date;
        // calculate borrow snapshot
        const borrowAmount = (BigInt(`${lastSnapshot.borrow.amount}`) + BigInt(`${el.borrow.amount}`)).toString();
        el.borrow.amount = borrowAmount[0] === '-' && borrowAmount.length <= 3 ? '0' : borrowAmount;
        el.borrow.liquidityIndex = el.borrow.liquidityIndex ?? lastSnapshot.borrow.liquidityIndex;
        if (el.borrow.liquidityIndex) {
          el.borrow.scaledBalance = mathUtils.rayDiv(el.borrow.amount, el.borrow.liquidityIndex.toString());
        }
        el.borrow.blockNumber = el.borrow.blockNumber ?? lastSnapshot.borrow.blockNumber;
        el.borrow.date = el.borrow.date ?? lastSnapshot.borrow.date;
        el.blockNumber = Math.max(
          el.lend.blockNumber ? el.lend.blockNumber : 0,
          el.borrow.blockNumber ? el.borrow.blockNumber : 0
        )
        arr.push(el);
        return arr;
      }, []);
      snapshotData = [...snapshotData, ...snapshots];
      const lastSnapshot = snapshots[snapshots.length - 1];
      lastPosition.push({
        user: userAddress,
        symbol,
        tokensData: {
          [symbol]: {
            lend: pick(lastSnapshot.lend, ["amount", "liquidityIndex", "scaledBalance", "blockNumber", "date"]),
            borrow: pick(lastSnapshot.borrow, ["amount", "liquidityIndex", "scaledBalance", "blockNumber", "date"]),
          }
        }
      });
    }
  }
  const lastProcessedBlock = processingLogs[processingLogs.length - 1].block_number;
  await upsertData(snapshotData, lastPosition, lastProcessedBlock, lastProcessedBlock);
  console.info(
    `Processed ${
      processingLogs.length
    } logs from block ${trackingBlock} to block ${lastProcessedBlock} success at ${new Date().toISOString()}`
  );
  return processingLogs.length;
};

const run = async () => {
  try {
    const processedData = await process();
    if (!processedData) {
      console.info('No new data');
      return setTimeout(run, 6e3);
    }
    return run();
  } catch (e) {
    console.error(e);
    return setTimeout(run, 1e3);
  }
};

mongoose.connect(config.mongoose.url).then(run);
