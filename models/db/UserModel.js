var sequelize = require('sequelize');

var sequelizeConnection = require('../../core/sequelizeConnection');

var UserModel = sequelizeConnection.define('user', {
  id: {
    type: sequelize.INTEGER,
    primaryKey: true
  },
  userJid: {
    type: sequelize.STRING,
    field: 'user_jid'
  },
  username: {
    type: sequelize.STRING
  },
  name: {
    type: sequelize.STRING
  },
  acceptedSubmission: {
    type: sequelize.INTEGER,
    field: 'accepted_submission',
    defaultValue: 0
  },
  totalSubmission: {
    type: sequelize.INTEGER,
    field: 'total_submission',
    defaultValue: 0
  },
  acceptedProblem: {
    type: sequelize.INTEGER,
    field: 'accepted_problem',
    defaultValue: 0
  }
});

module.exports = UserModel;