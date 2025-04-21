const mongoose = require('mongoose');

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

const schema = mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    lend: positionData,
    borrow: positionData,
    blockNumber: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

schema.index({ user: 1, token: 1, blockNumber: 1 }, { unique: true });

/**
 * @typedef Snapshot
 */
const Snapshot = mongoose.model('Snapshot', schema, 'snapshot');

module.exports = Snapshot;
