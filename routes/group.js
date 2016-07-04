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

router.post( '/makegroup', function( req, res ) {
  var groupname = req.body.groupname,
      user_id = req.body.user_id;

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
      user_id = req.body.user_id;

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
      user_id = req.body.user_id;

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
