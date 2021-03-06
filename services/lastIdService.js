var LastIdModel = require('../models/db/index').LastIdModel;

var lastIdService = {};

lastIdService.GRADING_LAST_ID_KEY = "grading";
lastIdService.PROBLEMSET_PROBLEM_LAST_ID_KEY = "problemset_problem";
lastIdService.COURSE_PROBLEM_LAST_ID_KEY = "course_problem";
lastIdService.SUBMISSION_EVALUATED_LAST_ID = "evaluated_submission";
lastIdService.ACCEPTED_SUBMISSION_EVALUATED_LAST_ID = "accepted_evaluated_submission";
lastIdService.ACCEPTED_PROBLEM_EVALUATED_LAST_ID = "accepted_problem_evaluated_submission";

var insertKeyLastId  = function (key, callback) {
  LastIdModel.create({
    field: key,
    value: 0
  }).then(function () {
    callback(null);
  }, function (err) {
    callback(err);
  });
};

lastIdService.getKeyLastId = function (key, callback) {
  LastIdModel.findOne({
    where: {
      field: key
    }
  }).then(function (lastId) {
    if (!lastId) {
      insertKeyLastId(key, function (err) {
        callback(null, 0);
      });
    } else {
      callback(null, lastId.value);
    }
  }, function (err) {
    callback(err);
  });
};

lastIdService.updateLastId = function (key, lastId, callback) {
  if (lastId) {
    LastIdModel.findOne({
      where: {
        field: key
      }
    }).then(function (lastIdInstance) {
      lastIdInstance.update({
        value: lastId
      }).then(function () {
        callback(null);
      }, function (err) {
        callback(err);
      });
    });
  } else {
    callback(null);
  }
};

module.exports = lastIdService;