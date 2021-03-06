var _ = require('underscore');
var async = require('async');

var cache = require('../core/cache');

var ProblemModel = require('../models/db/index').ProblemModel;
var Submission = require('../models/Submission');
var SubmissionModel = require('../models/db/index').SubmissionModel;
var UserModel = require('../models/db/index').UserModel;

var REDIS_SUBMISSION_ID_PREFIX = "submission:id:";
var REDIS_SUBMISSION_EXPIRATION_TIME = 1200;

var submissionService = {};

var constructSubmissionFromPlainObject = function (object) {
  var submission = new Submission();
  submission.setId(object.id)
    .setSubmissionJid(object.submissionJid)
    .setVerdictCode(object.verdictCode)
    .setVerdictName(object.verdictName)
    .setScore(object.score)
    .setUserId(object.userId)
    .setUsername(object.username)
    .setName(object.name)
    .setSubmitTime(object.submitTime)
    .setLanguage(object.language)
    .setProblemId(object.problemId)
    .setProblemSlug(object.problemSlug);

  return submission;
};

var getSubmissionByIdFromDb = function (id,callback) {
  SubmissionModel.findOne({
    where: {
      id: id
    },
    include: [
      {model: UserModel, as: 'user'},
      {model: ProblemModel, as: 'problem'}
    ]
  }).then(function (submissionRecord) {
    if (!submissionRecord) {
      callback(null, null);
    } else {
      var submission = new Submission();
      submission.setId(submissionRecord.id)
        .setSubmissionJid(submissionRecord.submissionJid)
        .setVerdictCode(submissionRecord.verdictCode)
        .setVerdictName(submissionRecord.verdictName)
        .setScore(submissionRecord.score)
        .setUserId(submissionRecord.userId)
        .setSubmitTime(submissionRecord.submitTime)
        .setLanguage(submissionRecord.language)
        .setProblemId(submissionRecord.problemId);

      if (submissionRecord.user) {
        submission.setUsername(submissionRecord.user.username)
          .setName(submissionRecord.user.name);
      }

      if (submissionRecord.problem) {
        submission.setProblemSlug(submissionRecord.problem.slug);
      }

      callback(null, submission);
    }
  }, function (err) {
    callback(err);
  });
};

submissionService.getSubmissionById = function (id, callback) {
  var redisKey = REDIS_SUBMISSION_EXPIRATION_TIME + id;

  cache.getUpdateCacheValue(redisKey, REDIS_SUBMISSION_EXPIRATION_TIME, function (callback) {
    getSubmissionByIdFromDb(id, function (err, submission) {
      callback(err, submission);
    });
  }, function (err, submission) {
    callback(err, constructSubmissionFromPlainObject(submission));
  });
};

submissionService.getSubmissionIdToSubmissionMap = function (submissionIds, callback) {
  submissionService.getSubmissionByIds(submissionIds, function (err, submissions) {
    if (err) {
      callback(err);
    } else {
      var map = {};
      submissions.forEach(function (submission) {
        map[submission.getId()] = submission;
      });

      callback(err, map);
    }
  });
};

submissionService.getSubmission = function (userId, problemId, limit, callback) {
  var whereCondition = {};
  if (userId) {
    whereCondition["userId"] = userId;
  }
  if (problemId) {
    whereCondition["problemId"] = problemId;
  }

  SubmissionModel.findAll({
    where: whereCondition,
    limit: limit,
    order: 'id DESC'
  }).then(function (submissionModels) {
    var submissionIds = _.map(submissionModels, function (submissionModel) {
      return submissionModel.id;
    });

    submissionService.getSubmissionIdToSubmissionMap(submissionIds, function (err, submissionMap) {
      var submissions = _.map(submissionIds, function (submissionId) {
        return submissionMap[submissionId];
      });

      callback(err, submissions);
    });
  }, function (err) {
    callback(err);
  });
};

submissionService.getSubmissionByIds = function (submissionIds, callback) {
  var submissions = [];
  async.each(submissionIds, function (submissionId, callback) {
    submissionService.getSubmissionById(submissionId, function (err, submission) {
      submissions.push(submission);
      callback(err);
    });
  }, function (err) {
    callback(err, submissions);
  });
};

submissionService.getLatestSubmission = function (limit, callback) {
  SubmissionModel.findAll({
    limit: limit,
    order: 'id DESC'
  }).then(function (submissionRecords) {
    var submissionIds = _.map(submissionRecords, function (submissionRecord) {
      return submissionRecord.id;
    });

    submissionService.getSubmissionByIds(submissionIds, function (err, submissions) {
      callback(err, submissions);
    });
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

// used by the cron evaluator, don't use redis cache for this
submissionService.getSubmissionByLastId = function (lastId, limit, callback) {
  SubmissionModel.findAll({
    where: {
      id: {
        $gt: lastId
      }
    },
    limit: limit,
    include: [
      {model: UserModel, as: 'user'},
      {model: ProblemModel, as: 'problem'}
    ]
  }).then(function (submissionRecords) {
    var submissions = [];
    submissionRecords.forEach(function (submissionRecord) {
      var submission = constructSubmissionFromPlainObject(submissionRecord);

      submissions.push(submission);
    });

    callback(null, submissions);
  }, function (err) {
    console.dir(err);
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
module.exports.REDIS_SUBMISSION_ID_PREFIX = REDIS_SUBMISSION_ID_PREFIX;