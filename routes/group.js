var express = require('express');
var router = express.Router();

var multer = require('multer');
var mysql = require('mysql');
var s3 = require( 'multer-storage-s3' );

var connection = mysql.createConnection({

});

router.get('/',function (req, res) {
    res.render('group', function (error, content) {
        if (!error) {
            res.end(content);
        }
        else {
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end("Error while reading a file");
        }
    });
});

router.post('/grouplist', function(req, res) {
  var groupname = req.body.groupname,
      user_id = req.user.user_id;

      connection.query('select distinct p.groupname from ping_group p, user u where p.user_id = u.user_id and p.user_id = ?;', [user_id], function (error, cursor) {
        if(!error) {
          if(cursor[0]) {
          res.json({
            result : true, groupname : cursor[0].groupname
          });
        } else {
          res.json({
            result : true, groupname : NULL
          });
        }
      } else {
        res.sendStatus(503);
      }
      });
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////
router.post('/grouplist/enter', function(req, res) {
  var user_id = req.user.user_id;

  connection.query('select distinct c.card_id, c.memo, c.photo_url, c.internet_url from card c, ping_group p, user u where u.user_id = p.user_id and c.groupname = p.groupname and p.groupname = ? and p.user_id = ?;', [groupname,user_id], function(err, cursor) {
    if(!error) {
      if(cursor[0]) {
        res.json({
          result : true, card_id : cursor[0].card_id, memo : cursor[0].memo, photo_url : cursor[0].photo_url, internet_url : cursor[0].internet_url
        });
      } else {
        res.json({
          result : false
        });
      }
    } else {
      res.sendStatus(503);
    }
  });
});
router.post( '/makegroup', function( req, res ) {
  var groupname = req.body.groupname,
      user_id = req.user.user_id;

    connection.query('INSERT INTO ping_group (groupname, user_id) VALUES (?, ?) ;', [groupname, user_id], function (error) {
        if (!error) {
            res.end("그룹생성");

        } else {
            res.end("에러");
        }
    });
});

router.post( '/update_groupname', function( req, res ) {
  var groupname = req.body.groupname,
      update_groupname =req.body.update_groupname,
      user_id = req.user.user_id;

    connection.query('update ping_group set groupname=? where groupname=? and user_id=?', [update_groupname , groupname, user_id], function (error) {
        if (!error) {
            res.end("그룹이름변경");

        } else {
            res.end("에러");
        }
    });
});

router.post( '/delete_groupname', function( req, res ) {
  var groupname = req.body.groupname,
      user_id = req.user.user_id;

    connection.query('delete from card where user_id=?;',[user_id],function (error) {
        if (!error) {
            connection.query('delete from ping_group where groupname=? and user_id=?;', [groupname, user_id], function (error) {
                if (!error) {
                    res.end("그룹삭제");

                } else {
                    res.end("에러");
                }
            });

        } else {
            res.end("에러~");
        }
    });

});

module.exports = router;
