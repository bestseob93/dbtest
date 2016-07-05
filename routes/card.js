  var express = require('express');
  var router = express.Router();

  var multer = require('multer');
  var mysql = require('mysql');
  var s3 = require('multer-storage-s3');

  var connection = mysql.createConnection({

  });

  /* 랜덤 문자 출력
     이미지 파일 저장 이름*/
  var ran_string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var ran_result = '';
  for (var i = 0; i < 6; i++) {
      ran_result += ran_string.charAt(Math.random() * ran_string.length);
  };


  var storage = s3({
      destination: function(req, file, cb) {
          cb(null, 'file/');
      },
      filename: function(req, file, cb) {
          cb(null, Date.now() + ran_result + "." + file.originalname.split('.').pop());
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

  router.post('/list', function(req, res, next) {
    console.log(req.user.user_id);
    console.log("test------aaaa");
    console.log(req.session);
    var user_id = req.user.user_id;
      connection.query('select card.card_id, card.memo, card.photo_url, card.internet_url, card.groupname from user, card where user.user_id = card.user_id and user.user_id = ?;', [user_id], function(error, cursor) {
        console.log("1");
          if (!error) {
            if(cursor.length > 0) {
            console.log(cursor);
            res.json({
                result : true, card_id : cursor[0].card_id, memo : cursor[0].memo, photo_url : cursor[0].photo_url, internet_url :cursor[0].internet_url, groupname : cursor[0].groupname
            });
          } else {
            console.log("555");
            res.sendStatus("506");
          }
          } else {
              res.sendStatus(503);
              console.log("2");
          }
      });
  });

  router.post('/show_group', function(req, res) {
    var user_id = req.user.user_id;
    connection.query('select p.groupname from ping_group p, user u where p.user_id = u.user_id and u.user_id = ?;', [user_id], function(err, cursor) {
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
          userid = req.user.user_id,
          group_def = '미분류';
      connection.query('INSERT INTO card ( memo, filename, photo_url, internet_url, user_id, groupname) VALUES (?, ?, ?, ?, ?, ?) ;', [memo, file_name, photo_url, internet_url, userid, group_def], function(error, info) {
          if (error != undefined)
              res.sendStatus(503);
          else
              res.send('File was Uploaded Successfully');
      });
  });

  router.post('/update/:card_id', function(req, res) {
      connection.query('update card set memo = ?;',
          //?로 표현하지 않고, ? 대신 어떤 값을 넣으면 그자리에 계속 그 값만 들어가게된다.
          [req.body.memo, req.params.card_id]);
      res.writeHead(302, {
          'Location': '/'
      });
      res.end();
  });


  router.get('/delete/:card_id', function(req, res) {
      connection.query('delete from card where card_id=?;', [req.params.card_id]);
      res.writeHead(302, {
          'Location': '/'
      });
      res.end();
  });

  module.exports = router;
