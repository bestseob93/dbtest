var express = require('express');
var jwt = require('jwt-simple');
var bkfd2Password = require('pbkdf2-password');
var mysql = require('mysql');

var router = express.Router();

var hasher = bkfd2Password();

var connection = mysql.createConnection({

});

/* login */

router.get('/welcome', function(req, res) {

});


router.get('/fuck', function(req, res) {
  res.send('hello fucker');     // 비번 틀렸을 때
});

router.get('/login', function(req, res) {
  res.render('login', { title: 'login' });
});

router.get('/logout', function(req, res) {
  req.logout();
  req.session.save(function() {
        res.redirect('/auth/login');
  });
});


router.post('/login/done', function(req, res) {
  var jwt_body = {
    name: req.body.user_id,
    passwd: req.body.passwd
  };

  var secret = 'common wolf fly bend';

  var token = jwt.encode(jwt_body, secret);
  console.log("token 값: " + token);

      var uid = jwt_body.name,
          pwd = jwt_body.passwd;
          connection.query('select * from user where user_id = ?;', [uid], function(error, cursor) {
            if(error) {
              console.log("에러");
              return done('there is no user');
            }
            else {
            if(cursor[0]) {
                    console.log("동일");
                    var user = cursor[0];

                    return hasher({password:pwd, salt:user.salt}, function(err, pass, salt, hash){
                    console.log("hash값" + hash);
                  if( hash == user.passwd ) {
                    connection.query('INSERT INTO ping_token (access_token, user_id) VALUES (?, ?);', [token, uid], function(err) {
                      if(err) {
                        res.sendStatus(503);
                        console.log("회원 가입 시 토큰 발행 에러");
                      } else {
                        console.log("로그인 성공");
                        res.redirect_to('/auth/welcome');
                      }
                    });
                  } else {
                    console.log("비번 틀림");
                  }
                });
                } else {
                    console.log("유저없당");
                }
            }
          });
  });

  /* join */
router.get('/join', function(req, res, next) {
    res.render('join_ejs', {
        title: '회원가입'
    });
});
router.get('/join/welcome', function(req, res, next) {
    res.send("hello");
});


router.post('/join/insert', function(req, res, next) {
  var jwt_container = {
    name: req.body.user_id,
    passwd: req.body.passwd
  };

  var secret = 'common wolf fly bend';

  var token = jwt.encode(jwt_container, secret);
  console.log("token 값: " + token);

    var before_passwd = jwt_container.passwd,
        before_repasswd = req.body.repasswd,
        user_id = jwt_container.name;

        connection.query('select * from user where user_id=?;', [user_id],
            function(error, cursor) {
                if (!error) {
                    if (cursor[0]) {
                        // var string_cursor = JSON.stringify(cursor[0].user_id);
                        // if (string_cursor == user_id) {
                            res.status(503).json({
                              result : false,
                              reason : "이미 있는 아이디 입니다."
                          });
                        // } else {
                        //     res.end("사용 가능한 아이디 입니다.1");
                        // }
                    } else {
                      if (before_passwd === before_repasswd) {
                          hasher({
                              password: req.body.passwd
                          }, function(err, pass, salt, hash) {
                            var user = {
                              authId: 'local:' + req.body.user_id,
                              user_id: req.body.user_id,
                              passwd: hash,
                              user_name: req.body.user_name,
                              user_sex: req.body.user_sex,
                              user_birth: req.body.user_birth,
                              salt: salt
                            };
                              var sqlm = 'insert into user set ?';

                              connection.query(sqlm, user, function(error, results) {
                                    if(error) {
                                      console.log(error);
                                      res.status(500);
                                    } else {
                                      var group_def = '미분류';

                                      connection.query('INSERT INTO ping_group (groupname, user_id) VALUES (?, ?) ;', [group_def, user.user_id], function(err){
                                        if(err) {
                                          res.sendStatus(503);
                                          console.log("회원 가입 시 그룹생성 에러");
                                        } else {
                                          connection.quer('INSERT INTO ping_token (access_token, user_id) VALUES (?, ?);', [token, user_id], function(err){
                                            if(err) {
                                              res.sendStatus(503);
                                              console.log("회원 가입 시 토큰 발행 에러");
                                            }
                                          });
                                        }
                                      });
                                    }
                                  });
                          });
                      } else {
                          res.status(504).json({
                            result: false,
                            reason: "비밀번호가 일치하지 않습니다"
                          });
                      }
                    }
                } else {
                    res.sendStatus(503);
                }
            });
});

router.post('/join/update', function(req, res) {//비밀번호 수정
    var user_id = req.body.user_id,
        passwd = req.body.passwd,
        update_passwd = req.body.update_passwd,
        update_repasswd = req.body.update_repasswd;

    connection.query('select * from user where user_id =?',[user_id], function(error, cursor){
      console.log(cursor);
        if(!error) {
            if(cursor[0]) {
              return hasher({password: passwd, salt: cursor[0].salt}, function(err, pass, salt, hash) {
                if(hash == cursor[0].passwd) {
                  if(update_passwd == update_repasswd){
                    hasher({ password: update_passwd}, function (err, pass,salt, hash) {
                      var upuser = {
                          passwd : hash,
                          salt : salt
                        };

                    connection.query('update user set ? where user_id = ?', [upuser, user_id], function(error) {
                        if (!error) {
                            res.json({
                              result: true,
                              reason: "회원 정보 수정 완료"
                            });
                        } else {
                            res.status(503).json({
                              result: false,
                              reason: "DB 에러"
                            });
                        }
                    });
                  });
                  } else {
                    res.status(503).json({
                      result: false,
                      reason: "수정될 비밀번호가 일치하지 않습니다"
                    });
                  }
            } else {
              res.status(503).json({
                result: false,
                reason: "기존 비밀번호가 일치하지 않습니다"
              });
            }
        });
      } else {
        res.status(503).json({
          result: false,
          reason: "유저 없음"
        });
        }
      } else {
        res.status(506).json({
          result: false,
          reason: "걍 에러"
        });
      }
    });
});

router.post('/join/delete', function(req, res) {//회원 탈퇴
    var user_id = req.body.user_id,
        passwd = req.body.passwd,
        repasswd = req.body.repasswd;

    if(passwd == repasswd) {
        connection.query('select * from user where user_id =?;',[user_id], function(error,cursor){
            if(!error){
                if(cursor[0]) {
                  hasher({
                    password : passwd, salt : cursor[0].salt }, function(err, pass, salt, hash) {
                      if(hash == cursor[0].passwd) {
                        connection.query('delete from card where user_id=?;',[user_id],function(error){
                          if(!error) {
                              connection.query('delete from ping_group where user_id=?;',[user_id],function(error){
                              if(!error) {
                                  connection.query('delete from user where user_id=?;',[user_id],function(error){
                                  if(!error) {
                                      res.json({
                                        result : true, reason : "삭제 성공"
                                      });
                                  } else {
                                      console.log("유저 삭제 실패");
                                      res.status(503).json({
                                        result : false, reason : "유저 삭제 실패"
                                      });
                                  }
                                  });
                              } else {
                                  console.log("그룹 삭제 실패");
                                  res.status(503).json({
                                    result : false, reason : "그룹 삭제 실패"
                                  });
                              }
                              });
                          } else {
                            console.log("카드 삭제 실퍠");
                              res.status(503).json({
                                result : false, reason : "카드 삭제 실패"
                              });
                          }
                      });
                    } else {
                      console.log("비밀번호 일치하지 않음");
                      res.status(503).json({
                        result : false, reason : "비밀번호 일치하지 않음"
                      });
                    }
                      });
                } else {
                  console.log("cursor[0] 존재하지 않음");
                    res.status(503).json({
                      result : false, reason : "cursor[0] 존재하지 않음"
                    });
                }
            } else {
              console.log("유저 아이디 없음");
                res.status(506).json({
                  result : false, reason : "유저 아이디 없음"
                });
            }
        });

    } else {
      console.log("재확인 비밀번호 일치하지 않음");
        res.status(506).json({
          result : false,
          reason : "재확인 비밀번호 일치하지 않음"
        });
    }
});

module.exports = router;
