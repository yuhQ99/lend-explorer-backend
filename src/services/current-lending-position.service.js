const { CurrentLendingPosition } = require('../models');
const pick = require('../utils/pick');
const { underlyingTokensSymbolList, symbolAndTokenDataMapping } = require('../config/token');

const queryWithoutPagination = async (filter) => {
  return CurrentLendingPosition.find(filter);
};

const queryOne = async (filter) => {
  return CurrentLendingPosition.findOne(filter).lean();
};

const queryAll = async (filter, options) => {
  return CurrentLendingPosition.paginate(filter, options);
};

const bulkUpdate = async (updateData, session) => {
  await CurrentLendingPosition.bulkWrite(
    updateData.map((el) => ({
      updateOne: {
        filter: pick(el, ['user']),
        update: { $set: { [`tokensData.${el.symbol}`]: el.tokensData[el.symbol] } },
        upsert: true,
      },
    })),
    { session }
  );
};

const queryAllSortByTotalValue = async (interestData, options) => {
  const sort = options.sortBy.split(',').reduce((o, el) => {
    const [key, order] = el.split(':');
    o[key] = order === 'desc' ? -1 : 1;
    return o;
  }, {});
  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const skip = (page - 1) * limit;
  const addLendProject = underlyingTokensSymbolList.map((symbol) => ({
    $round: [
      {
        $multiply: [
          {
            $divide: [
              {
                $divide: [
                  {
                    $multiply: [
                      { $ifNull: [`$tokensData.${symbol}.lend.scaledBalance`, { $toDecimal: 0 }] },
                      { $toDecimal: interestData[symbol].lendIndex },
                    ],
                  },
                  { $toDecimal: 1e27 },
                ],
              },
              { $toDecimal: 10 ** symbolAndTokenDataMapping[symbol].decimals },
            ],
          },
          { $toDecimal: interestData[symbol].price },
        ],
      },
      0,
    ],
  }));
  const addBorrowProject = underlyingTokensSymbolList.map((symbol) => ({
    $round: [
      {
        $multiply: [
          {
            $divide: [
              {
                $divide: [
                  {
                    $multiply: [
                      { $ifNull: [`$tokensData.${symbol}.borrow.scaledBalance`, { $toDecimal: 0 }] },
                      { $toDecimal: interestData[symbol].borrowIndex },
                    ],
                  },
                  { $toDecimal: 1e27 },
                ],
              },
              { $toDecimal: 10 ** symbolAndTokenDataMapping[symbol].decimals },
            ],
          },
          { $toDecimal: interestData[symbol].price },
        ],
      },
      0,
    ],
  }));
  const results = await CurrentLendingPosition.aggregate([
    {
      $addFields: {
        totalLend: {
          $add: addLendProject,
        },
        totalBorrow: {
          $add: addBorrowProject,
        },
      },
    },
    {
      $facet: {
        data: [{ $sort: sort }, { $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
  ]);
  const totalResults = results[0].totalCount[0]?.count || 0;
  return {
    results: results[0].data,
    page,
    limit,
    totalResults,
    totalPages: Math.ceil(totalResults/limit),
  };
};

module.exports = {
  queryWithoutPagination,
  queryOne,
  queryAll,
  bulkUpdate,
  queryAllSortByTotalValue,
};
