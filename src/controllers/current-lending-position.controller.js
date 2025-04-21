const Decimal = require('decimal.js');
const catchAsync = require('../utils/catchAsync');
const { currentLendingPositionService, customService, snapshotService } = require('../services');
const pick = require('../utils/pick');
const { callContractMultiCall, findTokenInterest, getBlockNumberByTimestamp } = require('../utils/blockchain');
const { symbolAndTokenDataMapping } = require('../config/token');
const mathUtils = require('../utils/math');

Decimal.set({ precision: 50, rounding: Decimal.ROUND_HALF_UP });

const index = catchAsync(async (req, res) => {
  const options = pick(req.query, ['page', 'limit', 'sortBy']);
  if (!options.sortBy) {
    options.sortBy = 'updatedAt:desc';
  }
  const filter = pick(req.query, ['user']);
  let data;
  let interestData;
  let calculateTotal = true;
  const lastBlock = await customService.getLastBlock();
  if (options.sortBy.includes('totalLend') || options.sortBy.includes('totalBorrow')) {
    interestData = await callContractMultiCall(lastBlock);
    data = await currentLendingPositionService.queryAllSortByTotalValue(interestData, options);
    calculateTotal = false;
  } else {
    [data, interestData] = await Promise.all([
      currentLendingPositionService.queryAll(filter, options),
      callContractMultiCall(lastBlock),
    ]);
  }
  data.results = data.results.map((result) => {
    const userResult = {
      user: result.user,
      ...Object.keys(result.tokensData).reduce((o, symbol) => {
        if (Object.keys(result.tokensData[symbol].lend).length > 1) {
          const currentBalance = mathUtils.rayMul(
            result.tokensData[symbol].lend.scaledBalance.toString(),
            interestData[symbol].lendIndex
          );
          o[`${symbol}LendAmount`] = new Decimal(currentBalance)
            .dividedBy(new Decimal(10).pow(symbolAndTokenDataMapping[symbol].decimals))
            .toDecimalPlaces(2)
            .toString();
          if (calculateTotal) {
            if (!o.totalLend) {
              o.totalLend = 0;
            }
            o.totalLend = new Decimal(o.totalLend).add(
              new Decimal(o[`${symbol}LendAmount`]).mul(new Decimal(interestData[symbol].price))
            );
          }
        }
        if (Object.keys(result.tokensData[symbol].borrow).length > 1) {
          const currentBalance = mathUtils.rayMul(
            result.tokensData[symbol].borrow.scaledBalance.toString(),
            interestData[symbol].borrowIndex
          );
          o[`${symbol}BorrowAmount`] = new Decimal(currentBalance)
            .dividedBy(new Decimal(10).pow(symbolAndTokenDataMapping[symbol].decimals))
            .toDecimalPlaces(2)
            .toString();
          if (calculateTotal) {
            if (!o.totalBorrow) {
              o.totalBorrow = 0;
            }
            o.totalBorrow = new Decimal(o.totalBorrow).add(
              new Decimal(o[`${symbol}BorrowAmount`]).mul(new Decimal(interestData[symbol].price))
            );
          }
        }
        return o;
      }, {}),
    };
    if (result.totalLend) {
      userResult.totalLend = result.totalLend.toString();
      userResult.totalBorrow = result.totalBorrow.toString();
    }
    return userResult;
  });
  return res.send({ data });
});

const tokenDetails = catchAsync(async (req, res) => {
  const { token, mode } = req.query;
  const options = pick(req.query, ['page', 'limit', 'sortBy']);
  options.select = `user tokensData.${token}.${mode.toLowerCase()}`;
  const [data, interestData] = await Promise.all([
    currentLendingPositionService.queryAll(
      {
        [`tokensData.${token}.${mode.toLowerCase()}.scaledBalance`]: { $gt: 0 },
      },
      options
    ),
    findTokenInterest(token, mode),
  ]);
  data.results = data.results.map((result) => ({
    user: result.user,
    amount: new Decimal(
      mathUtils.rayMul(result.tokensData[token][mode.toLowerCase()].scaledBalance.toString(), interestData.toString())
    )
      .dividedBy(new Decimal(10).pow(symbolAndTokenDataMapping[token].decimals))
      .toDecimalPlaces(6)
      .toString(),
  }));
  return res.send({ data });
});

const snapshot = catchAsync(async (req, res) => {
  const { date, user } = req.body;
  const blockNumber = await getBlockNumberByTimestamp(+date);
  const [data, interestData] = await Promise.all([
    snapshotService.queryLatestSnapshot(blockNumber, user),
    callContractMultiCall(blockNumber),
  ]);
  data.results = data.results.map((result) => ({
    user: result.user,
    ...Object.keys(result.tokensData).reduce((o, symbol) => {
      if (!o.totalLend) {
        o.totalLend = 0;
      }
      if (!o.totalBorrow) {
        o.totalBorrow = 0;
      }
      let currentBalance = mathUtils.rayMul(
        result.tokensData[symbol].lend.scaledBalance.toString(),
        interestData[symbol].lendIndex
      );
      o[`${symbol}LendAmount`] = new Decimal(currentBalance)
        .dividedBy(new Decimal(10).pow(symbolAndTokenDataMapping[symbol].decimals))
        .toDecimalPlaces(2)
        .toString();
      o.totalLend = new Decimal(o.totalLend).add(
        new Decimal(o[`${symbol}LendAmount`]).mul(new Decimal(interestData[symbol].price))
      );
      currentBalance = mathUtils.rayMul(
        result.tokensData[symbol].borrow.scaledBalance.toString(),
        interestData[symbol].borrowIndex
      );
      o[`${symbol}BorrowAmount`] = new Decimal(currentBalance)
        .dividedBy(new Decimal(10).pow(symbolAndTokenDataMapping[symbol].decimals))
        .toDecimalPlaces(2)
        .toString();
      o.totalBorrow = new Decimal(o.totalBorrow).add(
        new Decimal(o[`${symbol}BorrowAmount`]).mul(new Decimal(interestData[symbol].price))
      );
      return o;
    }, {}),
  }));
  return res.send({ data });
});

module.exports = {
  index,
  tokenDetails,
  snapshot,
};
