var _ = require('underscore');

var Submission = require('../models/Submission');
var SubmissionModel = require('../models/db/SubmissionModel');

var submissionService = {};

var constructSubmissionFromModel = function (submissionModel) {
  var submission = new Submission();
  submission.setId(submissionModel.id)
            .setSubmissionJid(submissionModel.submissionJid)
            .setVerdictCode(submissionModel.verdictCode)
            .setVerdictName(submissionModel.verdictName)
            .setScore(submissionModel.score)
            .setUserJid(submissionModel.userJid)
            .setUsername(submissionModel.username)
            .setLanguage(submissionModel.language)
            .setSubmitTime(submissionModel.submitTime)
            .setProblemJid(submissionModel.problemJid)
            .setProblemSlug(submissionModel.problemSlug);

  return submission;
};

submissionService.getSubmissionJidToSubmissionMap = function (submissionJids, callback) {
  submissionService.getSubmissionByJids(submissionJids, function (err, submissions) {
    if (err) {
      callback(err);
    } else {
      var map = {};
      submissions.forEach(function (submission) {
        map[submission.getSubmissionJid()] = submission;
      });

      callback(err, map);
    }
  });
};

submissionService.getSubmissionByJids = function (submissionJids, callback) {
  SubmissionModel.findAll({
    where: {
      submissionJid: {
        $in: submissionJids
      }
    }
  }).then(function (submissionModels) {
    var submissions = _.map(submissionModels, function (submissionModel) {
      return constructSubmissionFromModel(submissionModel);
    });
    callback(null, submissions);
  }, function (err) {
    callback(err);
  });
};

submissionService.getLatestSubmission = function (limit, callback) {
  SubmissionModel.findAll({
    limit: limit,
    order: 'id DESC'
  }).then(function (submissionRecords) {
    var submissions = _.map(submissionRecords, function (submissionRecord) {
      return constructSubmissionFromModel(submissionRecord);
    });

    callback(null, submissions);
  }, function (err) {
    callback(err);
  });
};

submissionService.getLastJerahmeelId = function (callback) {
  SubmissionModel.max('id').then(function (lastId) {
    if (lastId) {
      callback(null, lastId);
    } else {
      callback(null, 0);
    }
  }, function (err) {
    callback(err);
  });
};

submissionService.getSubmissionByLastId = function (lastId, limit, callback) {
  SubmissionModel.findAll({
    where: {
      id: {
        $gt: lastId
      }
    },
    limit: limit
  }).then(function (submissionRecords) {
    var submissions = [];
    submissionRecords.forEach(function (submissionRecord) {
      var submission = constructSubmissionFromModel(submissionRecord);
      submissions.push(submission);
    });

    callback(null, submissions);
  }, function (err) {
    callback(err);
  });
};

submissionService.insertSubmission = function (id, submissionJid, userId, problemId, language, submitTime, callback) {
  SubmissionModel.create({
    id: id,
    submissionJid: submissionJid,
    userId: userId,
    problemId: problemId,
    language: language,
    submitTime: submitTime,
    score: 0,
    verdictCode: "",
    verdictName: ""
  }).then(function () {
    callback(null);
  }, function (err) {
    callback(err);
  });
};

submissionService.updateSubmissionGrading = function (submissionId, score, verdictCode, verdictName, callback) {
  SubmissionModel.findOne({
    where: {
      id: submissionId
    }
  }).then(function (submission) {
    if (submission) {
      submission.update({
        score: score,
        verdictCode: verdictCode,
        verdictName: verdictName
      }).then(function () {
        callback(null);
      }, function (err) {
        callback(err);
      });
    } else {
      callback("submission not found");
    }
  }, function (err) {
    callback(err);
  });
};

module.exports = submissionService;