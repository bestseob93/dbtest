var express = require('express');
var router = express.Router();

var multer = require('multer');
var mysql = require('mysql');
var s3 = require('multer-storage-s3');

var connection = mysql.createConnection({

});

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

    var token = req.headers.token;

/*** 회원 존재 유무 파악  ***/
    connection.query('select * from user where user.user_id = (select ping_token.user_id from ping_token where access_token = ?)', [token], function(err, cursor) {
        if(!err) {
            if(cursor[0]) {

                var user_id = cursor[0].user_id;
/*** 그룹리스트 출력 ***/
                connection.query('select distinct p.groupname from ping_group p, user u where p.user_id = u.user_id and p.user_id = ?;', [user_id], function(error, cursor) {
                    if (!error) {
                        if (cursor.length > 0) {
                            res.status(200).json(cursor);
                        } else {
                            res.status(201).json({
                                result: true,
                                reason: "그룹 없음"
                            });
                        }
                    } else {
                        res.status(503).json({
                            result: false,
                            reason: "실패"
                        });
                    }
                });

            } else{
                res.status(502).json({
                    result: false,
                    reason: "유저 없음"
                });
            }
        } else{
            res.status(501).json({
                result: false,
                reason: "유저 찾기 쿼리 에러"
            });
        }
    });
});

router.post('/grouplist/latest', function(req, res) {

    var token = req.headers.token,
        groupname = req.body.groupname;

/*** 회원 존재 유무 파악  ***/
    connection.query('select * from user where user.user_id = (select ping_token.user_id from ping_token where access_token = ?)', [token], function(err, cursor) {
        if(!err) {
            if(cursor[0]) {

                var user_id = cursor[0].user_id;
/*** 최신 카드 url 가져오기 ***/

                console.log(groupname);
                connection.query('select card.photo_url from card where card.card_id in (select max(card_id) from card c, user u, ping_group p where p.user_id = u.user_id and c.user_id = u.user_id and p.groupname=c.groupname and u.user_id = ? and p.groupname=? );', [user_id, groupname], function(error, cursor) {
                    console.log(cursor);
                    if (!error) {
                        if (cursor.length > 0) {
                            res.status(200).json({
                                result: true,
                                cursor: cursor[0]
                            }); //url을 띄움

                            /*
                                res.status(200).json(cursor); 무엇으로 할 것인가?
                            */
                        } else {
                            res.status(201).json({
                                result: true,
                                reason: "해당 그룹에 카드 없음"
                                //그룹에 카드가 없으니까  url 안띄움
                            });
                        }
                    } else {
                        res.status(503).json({
                              result: false,
                              reason: "최근 카드 url 가져오기 쿼리 에러"
                        });
                    }
                });

            } else{
            	res.status(502).json({
                      result: false,
                      reason: "유저 없음"
                });
            }
        } else{
            res.status(501).json({
                    result: false,
                    reason: "유저 찾기 쿼리 에러"
            });
        }
    });
});

router.post('/grouplist/enter', function(req, res) {

    var token = req.headers.token,
            groupname = req.body.groupname;

/*** 회원 존재 유무 파악  ***/
    connection.query('select * from user where user.user_id = (select ping_token.user_id from ping_token where access_token = ?)', [token], function(err, cursor) {
        if(!err) {
            if(cursor[0]) {

                var user_id = cursor[0].user_id;
/*** 그룹 들어가 카드 출력 ***/
                connection.query('select distinct c.card_id, c.memo, c.photo_url, c.internet_url from card c, ping_group p, user u where u.user_id = p.user_id and c.user_id = p.user_id and c.groupname = p.groupname and p.groupname = ? and p.user_id = ?;', [groupname, user_id], function(error, cursor) {
                    if (!error) {
                        if (cursor.length > 0) {
                            res.status(200).json(cursor);
                        } else {
                            res.status(201).json({
                                result: false,
                                reason: "그룹에 카드 없음"
                            });
                        }
                    } else {
                        res.status(503).json({
                          result: false,
                          reason: "그룹 들어가기 실패"
                        });
                    }
                });
            } else{
            	res.status(502).json({
                      result: false,
                      reason: "유저 없음"
                });
            }
        } else{
            res.status(501).json({
                    result: false,
                    reason: "유저 찾기 쿼리 에러"
            });
        }
    });
});

router.post('/makegroup', function(req, res) {

    var token = req.headers.token,
        groupname = req.body.groupname;

/*** 회원 존재 유무 파악  ***/
    connection.query('select * from user where user.user_id = (select ping_token.user_id from ping_token where access_token = ?)', [token], function(err, cursor) {
        if(!err) {
            if(cursor[0]) {

                var user_id = cursor[0].user_id;
/*** 그룹 생성 ***/
                connection.query('INSERT INTO ping_group (groupname, user_id) VALUES (?, ?) ;', [groupname, user_id], function(error) {
                    if (!error) {
                        res.status(200).json({
                            result: true,
                            reason: "그룹생성완료"
                        });

                    } else {
                        res.status(503).json({
                            result: false,
                            reason: "그룹 생성 쿼리 에러"
                        });
                    }
                });
            } else{
            	res.status(502).json({
                      result: false,
                      reason: "유저 없음"
                });
            }
        } else{
            res.status(501).json({
                    result: false,
                    reason: "유저 찾기 쿼리 에러"
            });
        }
    });
});

router.post('/update_groupname', function(req, res) {

    var token = req.headers.token,
        groupname = req.body.groupname,
        update_groupname = req.body.update_groupname;

/*** 회원 존재 유무 파악  ***/
    connection.query('select * from user where user.user_id = (select ping_token.user_id from ping_token where access_token = ?)', [token], function(err, cursor) {
        if(!err) {
            if(cursor[0]) {

                var user_id = cursor[0].user_id;
/*** 그룹이름변경 ***/
                connection.query('update ping_group set groupname=? where groupname=? and user_id=?', [update_groupname, groupname, user_id], function(error, cursor) {
                    if (!error) {
                            res.status(200).json({
                                result: true,
                                reason: "그룹이름변경"
                            });
                    } else {
                        res.status(503).json({
                            result: false,
                            reason: "그룹이름변경 쿼리 에러"
                        });
                    }
                });
            } else{
            	res.status(502).json({
                      result: false,
                      reason: "유저 없음"
                });
            }
        } else{
            res.status(501).json({
                    result: false,
                    reason: "유저 찾기 쿼리 에러"
            });
        }
    });
});

router.post('/delete_groupname', function(req, res) {

    var token = req.headers.token,
        groupname = req.body.groupname;

/*** 회원 존재 유무 파악  ***/
    connection.query('select * from user where user.user_id = (select ping_token.user_id from ping_token where access_token = ?)', [token], function(err, cursor) {
        if(!err) {
            if(cursor[0]) {

                var user_id = cursor[0].user_id;
/*** 카드 삭제  ***/
                connection.query('delete from card where groupname=? and user_id=?;', [groupname, user_id], function(error) {
                    if (!error) {
/*** 그룹 삭제  ***/
                        connection.query('delete from ping_group where groupname=? and user_id=?;', [groupname, user_id], function(error) {
                            if (!error) {
                                res.status(200).json({
                                    result: true,
                                    reason: "그룹삭제 및 그룹 내 카드 삭제 성공"
                                });

                            } else {
                                res.status(504).json({
                                    result: false,
                                    reason: "카드는 삭제했으나 그룹삭제실패 (쿼리에러)"
                                });
                            }
                        });

                    } else {
                        res.status(503).json({
                            result: false,
                            reason: "그룹삭제시 카드먼저 삭제 실패 (쿼리에러)"
                        });
                    }
                });
            } else{
            	res.status(502).json({
                      result: false,
                      reason: "유저 없음"
                });
            }
        } else{
            res.status(501).json({
                    result: false,
                    reason: "유저 찾기 쿼리 에러"
            });
        }
    });
});

module.exports = router;
