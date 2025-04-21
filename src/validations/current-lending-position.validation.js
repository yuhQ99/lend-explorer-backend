const Joi = require('joi');
const { tokenTypesList, underlyingTokensSymbolList } = require('../config/token');

const index = {
  query: Joi.object().keys({
    user: Joi.string(),
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    sortBy: Joi.string(),
  }),
};

const tokenDetails = {
  query: Joi.object().keys({
    token: Joi.string()
      .valid(...underlyingTokensSymbolList)
      .required(),
    mode: Joi.string()
      .valid(...tokenTypesList)
      .required(),
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    sortBy: Joi.string(),
  }),
};

const snapshot = {
  body: Joi.object().keys({
    date: Joi.date().required(),
    user: Joi.string().required(),
  }),
};

module.exports = {
  index,
  tokenDetails,
  snapshot,
};
