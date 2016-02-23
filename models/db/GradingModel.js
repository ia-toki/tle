var sequelize = require('sequelize');

var sequelizeConnection = require('./sequelizeConnection');

var GradingModel = sequelizeConnection.define('grading', {
  id: {
    type: sequelize.INTEGER,
    primaryKey: true
  },
  submissionJid: {
    type: sequelize.STRING,
    field: 'submission_jid'
  },
  score: {
    type: sequelize.INTEGER
  },
  verdictCode: {
    type: sequelize.STRING,
    field: 'verdict_code'
  },
  verdictName: {
    type: sequelize.STRING,
    field: 'verdict_name'
  },
  evaluated: {
    type: sequelize.BOOLEAN
  },
  userJid: {
    type: sequelize.STRING,
    field: 'user_jid'
  },
  problemJid: {
    type: sequelize.STRING,
    field: 'problem_jid'
  }
});

module.exports = GradingModel;