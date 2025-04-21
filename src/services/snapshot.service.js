const { Snapshot } = require('../models');
const { underlyingTokens } = require('../config/token');

/**
 * Create snapshot
 *
 * @async
 * @param {Object | Object[]} body
 * @param [session]
 * @returns {Promise<Snapshot | Snapshot[]>}
 */
const create = async (body, session) => {
  return Snapshot.create(body, { session });
};

/**
 * Update snapshots with blockNumber field
 *
 * @async
 * @param {Object} filter - Query filter
 * @returns {Promise<Object>}
 */
const updateBlockNumber = async (filter = {}) => {
  return Snapshot.updateMany(filter, [
    {
      $set: {
        blockNumber: {
          $max: ['$lend.blockNumber', '$borrow.blockNumber'],
        },
      },
    },
  ]);
};

const queryLatestSnapshot = async (blockNumber, user) => {
  let data = await Snapshot.aggregate([
    {
      $match: { blockNumber: { $lte: blockNumber }, user },
    },
    {
      $group: {
        _id: '$token',
        maxScores: {
          $maxN: {
            input: ['$blockNumber', '$lend', '$borrow'],
            n: 1,
          },
        },
      },
    },
  ]);
  data = data.reduce((o, el) => {
    const { symbol } = underlyingTokens[el._id];
    o[symbol] = {
      lend: {
        scaledBalance: el.maxScores[0][1].scaledBalance ? el.maxScores[0][1].scaledBalance.toString() : '0',
      },
      borrow: {
        scaledBalance: el.maxScores[0][2].scaledBalance ? el.maxScores[0][2].scaledBalance.toString() : '0',
      },
    };
    return o;
  }, {});
  return { results: [{ user, tokensData: data }], totalPages: 1, totalResults: 1 };
};

module.exports = {
  create,
  updateBlockNumber,
  queryLatestSnapshot,
};
