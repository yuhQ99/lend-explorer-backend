const { Custom } = require('../models');

/**
 * Get custom by key
 *
 * @async
 * @param {string} key
 * @returns {Promise<*>}
 */
const getCustomByKey = async (key) => {
  return Custom.findOne({ key });
};

/**
 * Insert of update custom
 *
 * @async
 * @param key
 * @param value
 * @param [session]
 * @returns {Promise<Custom>}
 */
const insertOrUpdate = async (key, value, session) => {
  if (!session) {
    return Custom.updateOne({ key }, { value }, { upsert: true, new: true });
  }
  return Custom.updateOne({ key }, { value }, { upsert: true, new: true, session });
};

const getLastBlock = async () => {
  const trackingData = await getCustomByKey('LAST_BLOCK_NUMBER_ON_CHAIN');
  if (trackingData) {
    return trackingData.value;
  }
  return 1;
};

module.exports = {
  getCustomByKey,
  insertOrUpdate,
  getLastBlock,
};
