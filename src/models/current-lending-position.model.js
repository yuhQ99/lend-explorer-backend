const mongoose = require('mongoose');
const { underlyingTokensSymbolList } = require('../config/token');
const { paginate } = require('./plugins');

const positionData = {
  _id: false,
  amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  liquidityIndex: mongoose.Schema.Types.Decimal128,
  scaledBalance: mongoose.Schema.Types.Decimal128,
  blockNumber: Number,
  date: Date,
};

const tokensData = underlyingTokensSymbolList.reduce((o, token) => {
  o[token] = {
    _id: false,
    lend: positionData,
    borrow: positionData,
  };
  return o;
}, {});

const schema = mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
      unique: true,
    },
    tokensData,
  },
  {
    timestamps: true,
  }
);

schema.plugin(paginate);

/**
 * @typedef CurrentLendingPosition
 */
const CurrentLendingPosition = mongoose.model('CurrentLendingPosition', schema, 'current_lending_position');

module.exports = CurrentLendingPosition;
