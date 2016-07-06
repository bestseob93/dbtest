  var express = require('express');
  var session = require('express-session');
  var mysqlstore = require('express-mysql-session')(session);
  var passport = require('passport');
  var LocalStrategy = require('passport-local').Strategy; /**/
  var authhes = require('./auth');
  var router = express.Router();

  var multer = require('multer');
  var mysql = require('mysql');
  var s3 = require('multer-storage-s3');

  var options = {

  };

  var sessionstore = new mysqlstore(options);


  var connection = mysql.createConnection({

  });

  /* 랜덤 문자 출력
     이미지 파일 저장 이름*/
  var ran_string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var ran_result = '';
  for (var i = 0; i < 6; i++) {
      ran_result += ran_string.charAt(Math.random() * ran_string.length);
  };

  var check_time;
  check_time = new Date();
  check_time = check_time.getFullYear() + '' + (check_time.getMonth() + 1) + '' + check_time.getDate() + '' + check_time.getHours() + '' + check_time.getMinutes() + '' + check_time.getSeconds();


  var storage = s3({
      destination: function(req, file, cb) {
          cb(null, 'file/');
      },
      filename: function(req, file, cb) {
          cb(null, check_time + ran_result + "." + file.originalname.split('.').pop());
      },
      bucket: 'appjamping',
      acl : 'public-read',
      region: 'ap-northeast-2'
  });

  var upload = multer({
      storage: storage
  });

  router.get("/", function(req, res) {
      res.render('card', function(error, content) {
          if (!error) {
              res.end(content);
          } else {
              res.writeHead(501, {
                  'Content-Type': 'text/plain'
              });
              res.end("Error while reading a file");
          }
      });
  });

  router.get('/list/:user_id', function(req, res, next) {
    console.log(req.session);
    console.log("28");
    var user_id = req.params.user_id;
      connection.query('select card.card_id, card.memo, card.photo_url, card.internet_url, card.groupname from user, card where user.user_id = card.user_id and user.user_id = ?;', [user_id], function(error, cursor) {
        console.log("29");
          if (!error) {
            console.log("30");
            if(cursor.length > 0) {
              console.log("31");
            console.log(cursor);
            res.json(cursor);
            console.log("32");
          } else {
            console.log("555");
            res.sendStatus(506);
          }
          } else {
              res.sendStatus(503);
              console.log("2");
          }
      });
  });

  router.post('/show_group', function(req, res) {
    var user_id = req.body.user_id;
    connection.query('select p.groupname from ping_group p, user u where p.user_id = u.user_id and u.user_id = ?;', [user_id], function(error, cursor) {
      if(!error) {
        if(cursor[0]) {
          res.json({
            result : true, groupname : cursor[0].groupname
          });
        } else {
          console.log("디폴트 그룹 X");
          res.sendStatus(502);
        }
      } else {
        console.log("group query error");
        res.sendStatus(503);
      }
    });

  });

  router.post('/show_group/card_group_move', function(req, res) {
    var card_group_move = req.body.cardgroupmove,
        card_id = req.body.card_id,
        user_id = req.user.user_id;

    connection.query('update card set groupname = ? where card_id = ? and user_id = ?;', [card_group_move, card_id, user_id], function(err) {
      if(!err) {
        res.writeHead(302, {
          'Location': '/'
        });
      } else {
        res.sendStatus(503);
      }
    });
  });

/////////////////////////////////////////////////////////////////////////////////////////////////////
  router.post('/upload',  upload.single('userPhoto'), function(req, res, next) {
      var memo = req.body.memo,
          file_name = req.file.filename,
          photo_url = req.file.s3.Location,
          internet_url = req.body.internet_url,
          userid = req.body.user_id,
          group_def = '미분류',
          bookmark = req.body.bookmark;

      connection.query('INSERT INTO card ( memo, filename, photo_url, internet_url, user_id, groupname, bookmark) VALUES (?, ?, ?, ?, ?, ?, ?) ;', [memo, file_name, photo_url, internet_url, userid, group_def, bookmark], function(error, info) {
          if (error != undefined)
              res.sendStatus(503);
          else
              res.send('File was Uploaded Successfully');
      });
  });

  router.post('/update', function(req, res) {
    var update_memo = req.body.memo;
    var card_id = req.body.card_id;
      connection.query('update card set memo = ? where card_id = ?;',
          //?로 표현하지 않고, ? 대신 어떤 값을 넣으면 그자리에 계속 그 값만 들어가게된다.
          [update_memo, card_id], fucntion(err, cursor) {
            if(!err) {
              if(cursor[0]) {
                res.json({
                  result : true, reason : "update done"
                });
              } else {
                res.json({
                  result : false, reason : "no card"
                });
              }
            } else {
              res.sendStatus(503);
            }
          });
  });


  router.get('/delete/:card_id', function(req, res) {
      connection.query('delete from card where card_id=?;', [req.params.card_id]);
      res.writeHead(302, {
          'Location': '/'
      });
      res.end();
  });

  module.exports = router;
