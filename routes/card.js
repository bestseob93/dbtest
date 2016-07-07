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
      ran_result = ran_result + ran_string.charAt(Math.random() * ran_string.length);
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
      var user_id = req.params.user_id;
      connection.query('select card.card_id, card.memo, card.photo_url, card.internet_url, card.groupname from user, card where user.user_id = card.user_id and user.user_id = ?;', [user_id], function(error, cursor) {
          if (!error) {
              if (cursor.length > 0) {
                  console.log(cursor);
                  res.json(cursor);
              } else {
                  res.status(506).json({
                    result: false,
                    reason: "DB 에러"
                  })
              }
          } else {
              res.status(503).json({
                result: false,
                reason: "리스트 출력 실패"
              });
          }
      });
  });

  router.post('/card_group_move', function(req, res) {
      var card_group_move = req.body.cardgroupmove,
          card_id = req.body.card_id,
          user_id = req.body.user_id;

      connection.query('update card set groupname = ? where card_id = ? and user_id = ?;', [card_group_move, card_id, user_id], function(error) {
          if (!error) {
              res.json({
                reuslt: true,
                reason: "카드 그룹 변경 성공"
              })
          } else {
              res.status(503).json({
                result: false,
                reason: "카드 그룹 변경 실패"
              });
          }
      });
  });

router.post('/bookmarking', function(req, res) {
  var bookmark = req.body.bookmark,
      card_id = req.body.card_id;

  connection.query('UPDATE card set bookmark = ? where card_id = ?;', [bookmark, card_id], function(error) {
    if(!error) {
      res.json({
        result: true,
        reason: "북마크 추가 성공"
      });
    } else {
      res.status(503).json({
        result: false,
        reason: "북마크 추가 실패"
      });
    }
  });
});

  router.post('/upload', upload.single('userPhoto'), function(req, res, next) {
      var memo = req.body.memo,
          file_name = req.file.filename,
          photo_url = req.file.s3.Location,
          internet_url = req.body.internet_url,
          userid = req.body.user_id,
          group_def = '미분류';

      connection.query('INSERT INTO card ( memo, filename, photo_url, internet_url, user_id, groupname) VALUES (?, ?, ?, ?, ?, ?) ;', [memo, file_name, photo_url, internet_url, userid, group_def], function(error, info) {
          if (error != undefined) {
              res.status(503).json({
                result: false,
                reason: "사진 업로드 실패"
              });
              } else {
              res.json({
                result: true,
                reason: "캡쳐 되었음"
              });
              }
      });
  });

  router.post('/update', function(req, res) {
      var update_memo = req.body.memo,
          card_id = req.body.card_id;
      connection.query('update card set memo = ? where card_id = ?;', [update_memo, card_id], function(err, cursor) {
              if (!err) {
                      res.json({
                          result: true,
                          reason: "update done"
                      });
                  } else {
                  res.status(503).json({
                    result: false,
                    reason: "업데이트 실패"
                  });
              }
          });
  });

  router.get('/delete/:card_id', function(req, res) {
    var card_id = req.params.card_id;
      connection.query('delete from card where card_id = ?;', [card_id], function(error, cursor) {
          if (!error) {
              res.json({
                  result: true,
                  reason: "카드 삭제 성공"
              });
          } else {
              res.status(506).json({
                  result: false,
                  reason: "카드 삭제 실퍠"
              });
          }
      });
  });

  module.exports = router;
