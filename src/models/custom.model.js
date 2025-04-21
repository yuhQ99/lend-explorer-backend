const mongoose = require('mongoose');

const customSchema = mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
    },
    value: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

/**
 * @typedef Custom
 */
const Custom = mongoose.model('Custom', customSchema, 'custom');

module.exports = Custom;
