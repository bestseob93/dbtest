var express = require('express');
var router = express.Router();

var multer = require('multer');
var mysql = require('mysql');
var s3 = require('multer-storage-s3');



router.get('/', function(req, res) {
    res.render('group', function(error, content) {
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

router.post('/grouplist', function(req, res) {
    var user_id = req.body.user_id;

    connection.query('select distinct p.groupname from ping_group p, user u where p.user_id = u.user_id and p.user_id = ?;', [user_id], function(error, cursor) {
        if (!error) {
            if (cursor.length > 0) {
                res.json(cursor);
            } else {
                res.json({
                    result: true,
                    reason: "그룹 리스트 보기 실패"
                });
            }
        } else {
            res.status(503).json({
                result: false,
                reason: "실패"
            })
        }
    });
});
router.post('/grouplist/latest', function(req, res) {
    var user_id = req.body.user_id,
        groupname = req.body.groupname;

    connection.query('select card.photo_url from card where card.card_id in (select max(card_id) from card c, user u, ping_group p where p.user_id = u.user_id and c.user_id = u.user_id and p.groupname=c.groupname and u.user_id = ? and p.groupname=? );', [user_id, groupname], function(error, cursor) {
        if (!error) {
            if (cursor.length > 0) {
                console.log(cursor[0]);
                res.json({
                    result: true,
                    cursor: cursor[0]
                }); //url을 띄움
            } else {
                console.log("hihi");
                res.json({
                    result: true,
                    reason: "해당 그룹에 카드 없음" //그룹에 카드가 없으니까  url 안띄움
                });
            }
        } else {
            res.sendStatus(503);
        }
    });
});



router.post('/grouplist/enter', function(req, res) {
    var groupname = req.body.groupname,
        user_id = req.body.user_id;

    connection.query('select distinct c.card_id, c.memo, c.photo_url, c.internet_url from card c, ping_group p, user u where u.user_id = p.user_id and c.user_id = p.user_id and c.groupname = p.groupname and p.groupname = ? and p.user_id = ?;', [groupname, user_id], function(error, cursor) {
        if (!error) {
            if (cursor.length > 0) {
                res.json(cursor);
            } else {
                res.json({
                    result: false,
                    reason: "그룹 들어가기 실패"
                });
            }
        } else {
            res.sendStatus(503);
        }
    });
});

router.post('/makegroup', function(req, res) {
    var groupname = req.body.groupname,
        user_id = req.body.user_id;

    connection.query('INSERT INTO ping_group (groupname, user_id) VALUES (?, ?) ;', [groupname, user_id], function(error) {
        if (!error) {
            res.json({
                result: true,
                reason: "그룹생성완료"
            });

        } else {
            res.json({
                result: false,
                reason: "그룹생성실패"
            });
        }
    });
});

router.post('/update_groupname', function(req, res) {
    var groupname = req.body.groupname,
        update_groupname = req.body.update_groupname,
        user_id = req.body.user_id;

    connection.query('update ping_group set groupname=? where groupname=? and user_id=?', [update_groupname, groupname, user_id], function(error, cursor) {
        if (!error) {
                res.json({
                    result: true,
                    reason: "그룹이름변경"
                });
        } else {
            res.json({
                result: false,
                reason: "그룹이름변경실패"
            });
        }
    });
});

router.post('/delete_groupname', function(req, res) {
    var groupname = req.body.groupname,
        user_id = req.body.user_id;

    connection.query('delete from card where groupname=? and user_id=?;', [groupname, user_id], function(error) {
        if (!error) {
            connection.query('delete from ping_group where groupname=? and user_id=?;', [groupname, user_id], function(error) {
                if (!error) {
                    res.json({
                        result: true,
                        reason: "그룹삭제 및 그룹 내 카드 삭제 성공"
                    });

                } else {
                    res.json({
                        result: false,
                        reason: "카드는 삭제했으나 그룹삭제실패"
                    });
                }
            });

        } else {
            res.json({
                result: false,
                reason: "그룹삭제시 카드먼저 삭제 실패"
            });
        }
    });

});

module.exports = router;
