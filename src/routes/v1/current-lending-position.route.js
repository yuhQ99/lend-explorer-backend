const express = require('express');
const validate = require('../../middlewares/validate');
const currentLendingPositionController = require('../../controllers/current-lending-position.controller');
const currentLendingPositionValidation = require('../../validations/current-lending-position.validation');

const router = express.Router();

router.get('/', validate(currentLendingPositionValidation.index), currentLendingPositionController.index);

router.get(
  '/details',
  validate(currentLendingPositionValidation.tokenDetails),
  currentLendingPositionController.tokenDetails
);

router.post('/snapshot', validate(currentLendingPositionValidation.snapshot), currentLendingPositionController.snapshot);

module.exports = router;
