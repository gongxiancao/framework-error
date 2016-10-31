'use strict';

var verror = require('verror'),

/**
  {
    invalidParam: 'invalid param',
    requireParam: 'require param'
  }
**/

function OfaError () {

}

OfaError.prototype.responseError = function (err) {
  return {errcode: err.code, message: err.message};
};

OfaError.prototype.responseWrapError = function (err) {
  return {errcode: err.code, message: err.message};
};

var svc = module.exports = {
  _codeMessages: buildCodeMessageMap(errors),
  codes: buildNameCodeMap(errors),

  response: function (err, defaultCode) {
    if(_.isObject(err)) {
      return {errcode: err.code || defaultCode || svc.codes.internalError, errmsg: err.message};
    }

    return {errcode: err, errmsg: svc._getErrorMessage(err)};
  },
  _getErrorMessage: function (code) {
    var errMessage = svc._codeMessages[code];
    if(!errMessage) {
      errMessage = 'undefined error code ' + code;
      console.error(errMessage);
    }
    return errMessage;
  },
  error: function (code) {
    var err = new Error(svc._getErrorMessage(code));
    err.code = code;
    return err;
  },
  wrapError: function (err, code) {
    err = new verror.WError(err, svc._getErrorMessage(code));
    err.code = code;
    return err;
  },
  errorFromResponse: function (result) {
    var err = new Error(result.errmsg);
    err.code = result.errcode;
    return err;
  },
  guardFalsy: function (done, errcode) {
    return function (err, result) {
      if(err) {
        return done(svc.wrapError(err, errcode));
      }
      if(!result) {
        return done(svc.wrapError(null, errcode));
      }
      return done.apply(this, arguments);
    };
  },
  guardFalsyLast: function (errcode, done) {
    return svc.guardFalsy(done, errcode);
  },
  guardSeneca: function (done, errcode, useResponseError) {
    return function (err, result) {
      if(err) {
        return done(svc.wrapError(err, errcode));
      }
      if(result && result.errcode) {
        err = svc.errorFromResponse(result);
        if(useResponseError) {
          return done(err);
        }
        return done(svc.wrapError(err, errcode));
      }
      return done.apply(this, arguments);
    };
  },
  guardSenecaLast: function (errcode, useResponseError, done) {
    return svc.guardSeneca(done, errcode, useResponseError);
  },
  guardRequest: function (done, errcode) {
    return function (err, res, body) {
      if(err) {
        return done(svc.wrapError(err, errcode));
      }
      body = JSON.parse(body) || body;
      if(res.statusCode !== 200) {
        return done(svc.wrapError(svc.errorFromResponse(body.errmsg), errcode));
      }

      if(body && body.errcode) {
        err = new Error(body.errmsg);
        err.code = body.errcode;
        return done(svc.wrapError(err, errcode));
      }
      return done.apply(this, arguments);
    };
  },
  guard: function (done, errcode) {
    return function (err) {
      if(err) {
        return done(svc.wrapError(err, errcode));
      }
      return done.apply(this, arguments);
    };
  },
  guardLast: function (errcode, done) {
    return svc.guard(done, errcode);
  }
};


module.exports = function (done) {
  this.error = {
    init: function (errors) {

    }
  };
  process.nextTick(done);
};
