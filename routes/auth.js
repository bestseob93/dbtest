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
router.get('/loginfail', function(req, res) {
  res.send('wrong password');     // 비번 틀렸을 때
});
router.get('/login', function(req, res) {
  res.render('login', { title: 'login' });
});
router.get('/logout', function(req, res) {
  req.logout();
  req.session.save(function() {//?????????????
        res.redirect('/auth/login');
  });
});

router.post('/login/done', function(req, res) {

    var uid = req.body.user_id,
        pwd = req.body.passwd;

/*** 유저 존재 유무 확인 ***/
    connection.query('select * from user where user_id = ?;', [uid], function(error, cursor) {
        if(!error) {
            if(cursor[0]) {
                var user = cursor[0];

                console.log("회원정보 : \n");
                console.log(user);

                return hasher({password:pwd, salt:user.salt}, function(err, pass, salt, hash){

                    if( hash == user.passwd ) {
/*** 토큰 받아 오기 ***/
                        connection.query('select u.user_id, u.user_name, p.access_token from ping_token p, user u where u.user_id = p.user_id and u.user_id = ?;', [user.user_id], function(error, cursor) {
                            if(!error){
                                if(cursor[0]){
                                  console.log(cursor[0]);
                                    res.status(200).json({
                                        result: true,
                                        user_id: cursor[0].user_id,
                                        user_name: cursor[0].user_name,
                                        token: cursor[0].access_token
                                    });//여기에서 어떻게 response 할 것인가
                                }else{
                                    res.status(505).json({
                                    result: false,
                                    reason: "토큰 결과 없음"
                                });
                                }

                            }else{
                                res.status(504).json({
                                    result: false,
                                    reason: "토큰 쿼리 에러"
                                });
                            }

                        });

                    } else {
                         res.status(503).json({
                            result: false,
                            reason: "비밀번호 불일치"
                        });
                    }
                });
            } else {
                res.status(502).json({
                    result: false,
                    reason: "유저 없음"
                });
            }
        }
        else {
            res.status(501).json({
                result: false,
                reason: "쿼리 에러러"
            });
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

/*** token 발행 ***/
    var jwt_container = {
        name: req.body.user_id,
        passwd: req.body.passwd
    };

    var secret = 'common wolf fly bend';

    var token = jwt.encode(jwt_container, secret);
    console.log("token 값: " + token);


    var user_id = jwt_container.name,
        before_passwd = jwt_container.passwd,
        before_repasswd = req.body.repasswd;

/*** 중복 검사 ***/
    connection.query('select * from user where user_id=?;',[user_id],function(error, cursor){
        if (!error) {
            if (cursor[0]) {    //중복검사
                res.status(501).json({
                    result : false,
                    reason : "아이디 중복"
                });
            } else {            //사용가능한 아이디
                if (before_passwd === before_repasswd) {

                    hasher({    //암호화
                        password: req.body.passwd
                    }, function(err, pass, salt, hash) {
                            var user = {
                                user_id: req.body.user_id,
                                passwd: hash,
                                user_name: req.body.user_name,
                                user_sex: req.body.user_sex,
                                user_birth: req.body.user_birth,
                                salt: salt
                            };
/*** 회원 등록 ***/
                            var sqlm = 'insert into user set ?';
                            connection.query(sqlm, user, function(error, results) {
                                if(!error) {
/*** 회원 등록 성공시 해당 회원의 디폴트 그룹 생성 ***/
                                    var group_def = '미분류';
                                    connection.query('INSERT INTO ping_group (groupname, user_id) VALUES (?, ?) ;', [group_def, user.user_id], function(err){
                                        if(!err) {
/*** 회원의 토큰 등록 ***/
                                            connection.query('INSERT INTO ping_token (access_token, user_id) VALUES (?, ?);',[token, user_id], function(err){

                                                /*** 최종 회원 가입 완료 ***/
                                                if(!err) {
                                                    connection.query('select u.user_id, u.user_name, p.access_token from user u, ping_token p where u.user_id = p.user_id and u.user_id = ?;', [user_id], function(err, cursor) {
                                                      if(!err) {
                                                        if(cursor[0]) {
                                                          res.status(200).json({
                                                              result: true,
                                                              user_id: cursor[0].user_id,
                                                              user_name: cursor[0].user_name,
                                                              token: cursor[0].access_token
                                                          });
                                                        } else {
                                                          res.status(507).json({
                                                            result: false,
                                                            reason: "유저정보 및 토큰 DB 존재 X"
                                                          });
                                                        }
                                                      } else {
                                                        res.status(508).json({
                                                          result: false,
                                                          reason: "DB 에러"
                                                        });
                                                      }
                                                    });

                                                } else{
                                                    res.status(506).json({
                                                        result: false,
                                                        reason: "토큰 발행 에러"
                                                    });
                                                }
                                            });

                                        } else {
                                            res.status(505).json({
                                                    result: false,
                                                    reason: "회원가입시 그룹 생성 쿼리 에러"
                                                });
                                        }
                                      });

                                } else {
                                    res.status(504).json({
                                        result: false,
                                        reason: "회원가입 insert 쿼리 에러"
                                    });
                                }
                            });

                      });
                      } else {
                          res.status(503).json({
                            result: false,
                            reason: "비밀번호가 불일치"
                          });
                      }
                    }
        } else {
            res.sendStatus(502).json({
                result: false,
                reason: "중복검사 쿼리 에러"
            });
        }
    });
});

router.post('/join/update', function(req, res) {//비밀번호 수정
    var token = req.headers.token,
        passwd = req.body.passwd,
        update_passwd = req.body.update_passwd,
        update_repasswd = req.body.update_repasswd;

/*** 회원 존재 유무 파악 및 비밀번호 일치 유무 파악 ***/           //데이터 낭비를 막기 위해 삭제해도 될 듯?
    connection.query('select * from user where user.user_id = (select ping_token.user_id from ping_token where access_token = ?)',[token], function(error, cursor){
        if(!error) {
            if(cursor[0]) {

                var user_id = cursor[0].user_id;

                return hasher({password: passwd, salt: cursor[0].salt}, function(err, pass, salt, hash) {
                    if(hash == cursor[0].passwd) {
                        if(update_passwd == update_repasswd){
                            hasher({ password: update_passwd}, function (err, pass,salt, hash) {
                                var upuser = {
                                    passwd : hash,
                                    salt : salt
                                };
/*** 회원 정보 수정 ***/
                                connection.query('update user set ? where user_id = ?', [upuser, user_id], function(error) {
                                    if (!error) {
                                        res.status(200).json({
                                          result: true,
                                          reason: "회원 정보 수정 완료"
                                        });
                                    } else {
                                        res.status(505).json({
                                          result: false,
                                          reason: "회원 정보 수정 쿼리 에러"
                                        });
                                    }
                                });
                            });
                        } else {
                            res.status(504).json({
                                result: false,
                                reason: "repasswd 불일치"
                            });
                        }
                    } else {
                      res.status(503).json({
                        result: false,
                        reason: "비밀번호 불일치"
                      });
                    }
              });
            } else {
                res.status(502).json({
                    result: false,
                    reason: "찾고자 하는 회원 없음"
                });
            }
        } else {
            res.status(501).json({
                result: false,
                reason: "회원 존재 유무 쿼리 에러"
            });
        }
    });
});

router.post('/join/delete', function(req, res) {
    var token = req.headers.token,
        passwd = req.body.passwd,
        repasswd = req.body.repasswd;


    if(passwd == repasswd) {
/*** 회원 존재 유무 파악 ***/
        connection.query('select * from user where user.user_id = (select ping_token.user_id from ping_token where access_token = ?)',[token], function(error, cursor){
              if(!error){
                if(cursor[0]) {

                    var user_id = cursor[0].user_id;

                    hasher({
                        password : passwd, salt : cursor[0].salt }, function(err, pass, salt, hash) {
                            if(hash == cursor[0].passwd) {
/*** 순차적으로 삭제 ***/
                                connection.query('delete from ping_token where user_id=?;',[user_id],function(error){
                                    if(!error) {
                                        connection.query('delete from card where user_id=?;',[user_id],function(error){
                                            if(!error) {
                                                connection.query('delete from ping_group where user_id=?;',[user_id],function(error){
                                                    if(!error) {
                                                        connection.query('delete from user where user_id=?;',[user_id],function(error){
                                                            if(!error) {
                                                                res.status(200).json({
                                                                      result : true,
                                                                      reason : "탈퇴 성공"
                                                                });
                                                            } else {
                                                                res.status(508).json({
                                                                    result : false,
                                                                    reason : "유저 삭제 쿼리 에러"
                                                                });
                                                            }
                                                        });
                                                    } else {
                                                        res.status(507).json({
                                                            result : false,
                                                            reason : "그룹 삭제 쿼리 에러"
                                                        });
                                                    }
                                                });
                                            } else {
                                                res.status(506).json({
                                                    result : false,
                                                    reason : "카드 삭제 쿼리 에러"
                                                });
                                            }
                                        });
                                    } else{
                                        res.status(505).json({
                                            result : false,
                                            reason : "토큰 삭제 쿼리 에러"
                                        });
                                    }
                                });

                            } else {
                                res.status(504).json({
                                    result : false,
                                    reason : "비밀번호 불일치"
                                });
                            }
                        });
                } else {
                    res.status(503).json({
                        result : false,
                        reason : "해당 유저 없음"
                    });
                }
            } else {
                res.status(502).json({
                    result : false,
                    reason : "회원 존재 유무 파악 쿼리 에러"
                });
            }
        });

    } else {
        res.status(501).json({
            result : false,
            reason : "passwd repasswd 불일치"
        });
    }
});

module.exports = router;
