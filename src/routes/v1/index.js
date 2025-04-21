const express = require('express');
const userRoute = require('./user.route');
const currentLendingPositionRoute = require('./current-lending-position.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/current-position',
    route: currentLendingPositionRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
