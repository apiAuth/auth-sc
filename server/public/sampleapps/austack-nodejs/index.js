GLOBAL.logger = require('tracer').console({
  level: 'log',
  format: "{{timestamp}} {{path}}:{{line}} \n <{{title}}> {{message}}"
});

var Q = require('q');
var request = require('superagent');

var Austack = {
  data: {
    clientId: '',
    repoName: '',
    apiBaseURL: '',
    clientSecret: '',
    applicationJwt: '',
  },
  get: get,
  set: set,
  init: init,
  // method
  // 验证用户的JWT是否合法（主要是为了验证是否被用户强制退出登录而导致的过期）
  validateUserJwt: validateUserJwt,
  // 1. 获取jwt
  getApplicationJwt: getApplicationJwt,
  // 2. 获取用户列表
  listUser: listUser,
  // 3. 创建新用户
  createNewUser: createNewUser,
  // 4. 获取用户详情
  getUserDetail: getUserDetail,
  // 5. 更新用户
  updateUser: updateUser,
  // 6. 删除用户
  deleteUser: deleteUser,
};

module.exports = Austack;

function init(cfg) {
  logger.log(cfg);
  Austack.set('clientId', cfg.clientId);
  Austack.set('repoName', cfg.repoName);
  Austack.set('apiBaseURL', cfg.apiBaseURL);
  Austack.set('clientSecret', cfg.clientSecret);
}

function get(key) {
  if (Austack.data[key]) {
    return Austack.data[key];
  }

  return null;
}

function set(key, val) {
  Austack.data[key] = val;

  return Austack;
}

function validateUserJwt(userJwt) {
  var d = Q.defer();

  Austack.getApplicationJwt()
    .then(function (applicationJwt) {
      console.log('start validateUserJwt applicationJwt', applicationJwt);
      request.post(Austack.get('apiBaseURL') + '/loginRecords/validateJwt')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + applicationJwt)
        .send({
          userJwt: userJwt
        })
        .end(function (err, res) {
          if (err) {
            console.log(err);
            console.dir(res);
            return d.reject(err);
          }

          console.log('validateUserJwt', userJwt);
          d.resolve(userJwt);
        });
    });

  return d.promise;
}

function getApplicationJwt() {
  var d = Q.defer();
  var applicationJwt = Austack.get('applicationJwt');
  if (applicationJwt) {
    console.log('use applicationJwt from cache');
    d.resolve(applicationJwt);
    return d.promise;
  }

  request.post(Austack.get('apiBaseURL') + '/auth/application')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send({
      clientId: Austack.get('clientId'),
      clientSecret: Austack.get('clientSecret')
    })
    .end(function (err, res) {
      if (err) {
        return d.reject(err);
      }

      var applicationJwt = res.body.token;
      console.log('get applicationJwt', applicationJwt);
      Austack.set('applicationJwt', res.body.token);
      d.resolve(applicationJwt);
    });

  return d.promise;
}

function listUser() {
  var url = Austack.get('apiBaseURL') + '/repos/' + Austack.get('repoName');
  var d = Q.defer();
  logger.log(url);
  Austack.getApplicationJwt()
    .then(function (applicationJwt) {
      request.get(url)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + applicationJwt)
        .end(function (err, res) {
          logger.log(err, res.body);
          if (err) {
            return d.reject(err.response.body.message);
          }
          d.resolve(res.body);
        });
    });

  return d.promise;
}

function createNewUser(user) {
  var d = Q.defer();
  Austack.getApplicationJwt()
    .then(function (applicationJwt) {
      request.post(Austack.get('apiBaseURL') + '/appUsers/')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + applicationJwt)
        .send(user)
        .end(function (err, res) {
          if (err) {
            return d.reject(err.response.body.message);
          }
          d.resolve(res.body);
        });
    });

  return d.promise;
}

function getUserDetail(uid) {
  var url = Austack.get('apiBaseURL') + '/repos/' + Austack.get('repoName') + '/' + uid;
  var d = Q.defer();
  logger.log(url);
  Austack.getApplicationJwt()
    .then(function (applicationJwt) {
      request.get(url)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + applicationJwt)
        .end(function (err, res) {
          logger.log(err, res.body);
          if (err) {
            return d.reject(err.response.body.message);
          }
          d.resolve(res.body);
        });
    });

  return d.promise;
}

function updateUser(uid, data) {
  var url = Austack.get('apiBaseURL') + '/repos/' + Austack.get('repoName') + '/' + uid;
  var d = Q.defer();
  logger.log('put', url);
  Austack.getApplicationJwt()
    .then(function (applicationJwt) {
      request.put(url)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + applicationJwt)
        .send(data)
        .end(function (err, res) {
          logger.log(err, res.body);
          if (err) {
            return d.reject(err.response.body.message);
          }
          d.resolve(res.body);
        });
    });

  return d.promise;
}

function deleteUser(uid) {
  var url = Austack.get('apiBaseURL') + '/repos/' + Austack.get('repoName') + '/' + uid;
  var d = Q.defer();
  logger.log('delete', url);
  Austack.getApplicationJwt()
    .then(function (applicationJwt) {
      request.del(url)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + applicationJwt)
        .end(function (err, res) {
          logger.log(err, res.body);
          if (err) {
            return d.reject(err.response.body.message);
          }
          d.resolve(res.body);
        });
    });

  return d.promise;
}