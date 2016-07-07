var express = require('express');
var session = require('express-session');
var mysqlstore = require('express-mysql-session')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy; /**/
var bkfd2Password = require('pbkdf2-password');
var mysql = require('mysql');

var router = express.Router();

var hasher = bkfd2Password();

var options = {

};

var sessionstore = new mysqlstore(options);


var connection = mysql.createConnection({

});

/* login */
router.get('/welcome', function(req, res) {
  if(req.user && req.user.user_name) {
  res.send('hello login, <p>' + req.user.user_name + '</p>' + '<a href="/auth/logout">logout</a>' +
            '<a href="/card/">카드 보내기 </a>');
} else {
  res.redirect('/auth/login');
}
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
    req.session.destroy(function(err){
        res.redirect('/auth/login');
    });
  });
});

router.post('/login/done', passport.authenticate(
  'local', {
    successRedirect : '/card/list/',
    failureRedirect : '/auth/fuck'
  }
  )
  );

  passport.serializeUser(function(user, done) {
     console.log('serializeUser', user);
     var a = user.user_id;
     console.log('hello' + a);
    done(null, user.user_id);
    console.log('hi man : ' + a);
  });

  passport.deserializeUser(function(id, done) {
    console.log('deserializeUser', id);
       connection.query('select * from user where user_id = ?;', [id], function(err, cursor) {
      if(err) {
        console.log(err);
        done('there is no user');
      } else {
          if(cursor[0]){
            done(null, cursor[0]);
          }else{
              done(null, false);
          }
      }
    });
  });

  passport.use(new LocalStrategy({
    usernameField : 'user_id',
    passwordField : 'passwd',
    passReqToCallback : true
  }, function(req, user_id, passwd, done) {
      var uid = user_id,
          pwd = passwd;
          connection.query('select * from user where user_id = ?;', [uid], function(error, cursor) {
            if(error) {
              console.log("에러");
              return done('there is no user');
            }
            else {
            if(cursor[0]) {
                    console.log(cursor[0]);
                    console.log("동일");
                    var user = cursor[0];

                    return hasher({password:pwd, salt:user.salt}, function(err, pass, salt, hash){
                    console.log(hash);
                  if( hash == user.passwd ) {
                    console.log('LocalStrategy', user);
                    done(null, user);
                  } else {
                    done (null, false);
                  }

                });
                } else {
                    console.log("유저없오");
                    return done('there is no user');//수정
                }
            }
          });
    }
  ));

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
    var before_passwd = req.body.passwd,
        before_repasswd = req.body.repasswd,
        user_id = req.body.user_id;

        connection.query('select * from user where user_id=?;', [user_id],
            function(error, cursor) {
                if (!error) {
                    if (cursor[0]) {
                        // var string_cursor = JSON.stringify(cursor[0].user_id);
                        // if (string_cursor == user_id) {
                            res.status(503).json({
                              result : false, reason : "이미 있는 아이디 입니다."
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
                                        }
                                      });
                                      req.login(user, function(error){
                                        req.session.save(function(){
                                          res.json({
                                            result : true
                                          });
                                        });
                                      });
                                    }
                                      // if (!error) {
                                      //     res.redirect('/auth/join/welcome');
                                      //     console.log(" 회원등록 완료");
                                      // } else {
                                      //     res.status(503);
                                      // }
                                  });
                          });
                      } else {
                          res.send("비밀번호가 일치하지 않습니다.");
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

    connection.query('select * from user where user_id =? and passwd=?;',[user_id], function(error,cursor){
      console.log(cursor);
        if(!error) {
            if(cursor[0]) {
              hasher({
                  password: passwd, salt: cursor[0].salt
              }, function(err, pass, salt, hash) {
                if(hash == cursor[0].passwd) {
                  if(update_passwd == update_repasswd){
                    connection.query('update user set passwd=? where user_id=?', [update_passwd,user_id], function(error) {
                        if (!error) {
                            res.end("수정하였습니다.");
                        } else {
                            res.status(503);
                        }
                    });
                  } else {
                      res.end("수정될 비밀번호가 일치하지 않습니다.");
                  }
            } else {
                res.end("기존 비밀번호가 일치하지 않습니다.");
            }
        });
      } else {
                 res.end("유저 없음.");
        }
      } else {
        res.status(506);
      }
    });
});

router.post('/join/delete', function(req, res) {//회원 탈퇴
    var user_id = req.body.user_id,
        passwd = req.body.passwd,
        repasswd = req.body.repasswd;

    var string_passwd = JSON.stringify(passwd);
    var string_repasswd = JSON.stringify(repasswd);

    if(string_passwd == string_repasswd){
        connection.query('select * from user where user_id =? and passwd=?;',[user_id,passwd], function(error,cursor){
            if(!error){
                if(cursor[0]){
                      connection.query('delete from card where user_id=?;',[user_id],function(error,cursor){
                        if(!error){
                            connection.query('delete from ping_group where user_id=?;',[user_id],function(error,cursor){
                            if(!error){
                                connection.query('delete from user where user_id=?;',[user_id],function(error,cursor){
                                if(!error){
                                    res.end("탈퇴하셨습니다.");
                                }else{
                                    res.end("왜에러냐3");
                                }
                                });
                            }else{
                                res.end("왜에러냐2");
                            }
                            });

                        }else{
                            res.end("왜에러냐1");
                        }
                    });

                }
                else{
                    res.end("비밀번호가 일치하지 않습니다.");
                }
            }
            else{
                res.end("왜에러냐2");
            }
        });

    } else {
        res.end("재확인 비밀번호가 일치하지 않습니다.");//두 비밀번호가 다를 때
    }
});


module.exports = router;
