var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.send('ChatterBox');
});

// function 1: page loads
router.get('/load', function(req, res) {
    var db = req.db;
    var user_table = db.get('userList');
    var message_table = db.get('messageList');
    // check if id in session
    if (req.session.userId) {
        // find user in userList
        user_table.findOne({
            '_id': req.session.userId
        }, function(user_doc_err, user_doc) {
            if (user_doc_err !== null) {
                res.send({
                    msg: user_doc_err
                });
            } else if (user_doc === null) {
                res.send({
                    msg: 'User not found'
                });
            } else {
                var friend_list = user_doc.friends;
                // find friends in userList
                user_table.find({
                    'name': {
                        $in: friend_list.map(friend => friend.name)
                    }
                }, function(friend_docs_err, friend_docs) {
                    if (friend_docs_err !== null) {
                        res.send({
                            msg: friend_docs_err
                        });
                    } else if (friend_docs.length === 0) {
                        res.send({
                            msg: 'Friend not found'
                        });
                    } else {
                        var id_map = {};
                        var res_friend_info = new Array();
                        for (var i = 0; i < friend_docs.length; ++i) {
                            res_friend_info[i] = {
                                'name': friend_docs[i].name,
                                '_id': friend_docs[i]._id,
                                'unread': 0
                            }
                            id_map[friend_docs[i]._id.toString()] = {
                                'name': friend_docs[i].name,
                                'idx': i,
                            }
                        }
                        // find friend -> user chats in messageList
                        message_table.find({
                            'receiverId': req.session.userId.toString()
                        }, function(message_docs_err, message_docs) {
                            if (message_docs_err === null) {
                                for (var i = 0; i < message_docs.length; ++i) {
                                    // count unread messages
                                    var friend_id_map = id_map[message_docs[i].senderId];
                                    var lastMsgId = friend_list.find(friend => friend.name === friend_id_map.name).lastMsgId;
                                    if (lastMsgId === 0 || message_docs[i]._id.toString() > lastMsgId) {
                                        res_friend_info[friend_id_map.idx].unread += 1;
                                    }
                                }
                                // return info of user
                                res.send({
                                    'name': user_doc.name,
                                    'icon': user_doc.icon,
                                    'friends': res_friend_info
                                });
                            }
                        });
                    }
                });
            }
        });
    } else {
        res.send({
            msg: ''
        });
    }
});

// function 2: log in
router.post('/login', function(req, res) {
    var db = req.db;
    var user_table = db.get('userList');
    var message_table = db.get('messageList');
    var username = req.body.username;
    var password = req.body.password;
    var filter = {
        'name': username,
        'password': password
    };
    // login user and try taking the user online
    user_table.findOneAndUpdate(filter, {
        $set: {
            'status': 'online'
        }
    }, function(user_doc_err, user_doc) {
        if (user_doc_err !== null) {
            res.send({
                msg: user_doc_err
            });
        } else if (user_doc === null) {
            res.send({
                msg: 'Login failure'
            });
        } else {
            // set session
            req.session.userId = user_doc._id;

            var friend_list = user_doc.friends;
            // find friends in userList}
            user_table.find({
                'name': {
                    $in: friend_list.map(friend => friend.name)
                }
            }, function(friend_docs_err, friend_docs) {
                if (friend_docs_err !== null) {
                    res.send({
                        msg: friend_docs_err
                    });
                } else if (friend_docs.length === 0) {
                    res.send({
                        msg: 'Friend not found'
                    });
                } else {
                    var id_map = {};
                    var res_friend_info = new Array();
                    for (var i = 0; i < friend_docs.length; ++i) {
                        res_friend_info[i] = {
                            'name': friend_docs[i].name,
                            '_id': friend_docs[i]._id,
                            'unread': 0
                        }
                        id_map[friend_docs[i]._id.toString()] = {
                            'name': friend_docs[i].name,
                            'idx': i,
                        }
                    }
                    // find friend -> user chats in messageList
                    message_table.find({
                        'receiverId': req.session.userId.toString()
                    }, function(message_docs_err, message_docs) {
                        if (message_docs_err === null) {
                            for (var i = 0; i < message_docs.length; ++i) {
                                // count unread messages
                                var friend_id_map = id_map[message_docs[i].senderId];
                                var lastMsgId = friend_list.find(friend => friend.name === friend_id_map.name).lastMsgId;
                                if (lastMsgId === 0 || message_docs[i]._id.toString() > lastMsgId) {
                                    res_friend_info[friend_id_map.idx].unread += 1;
                                }
                            }
                            // return info of user
                            res.send({
                                'name': user_doc.name,
                                'icon': user_doc.icon,
                                'friends': res_friend_info
                            });
                        }
                    });
                }
            });
        }
    });
});

// function 3: log out
router.get('/logout', function(req, res) {
    var db = req.db;
    var user_table = db.get('userList');
    var userID = req.session.userId
    req.session.userId = null
    // find user in userList
    user_table.findOneAndUpdate({
        '_id': userID
    }, {
        $set: {
            'status': 'offline'
        }
    }, function(user_doc_err, user_doc) {
        if (user_doc_err !== null) {
            res.send({
                msg: user_doc_err
            });
        } else if (user_doc === null) {
            res.send({
                msg: 'User not found'
            });
        } else {
            // take user offline
            res.send({
                msg: ''
            });
        }
    });
});

// function 4: get user ifo
router.get('/getuserinfo', function(req, res) {
    var db = req.db;
    var user_table = db.get('userList');
    // find user in userList
    user_table.findOne({
        '_id': req.session.userId
    }, function(user_doc_err, user_doc) {
        if (user_doc_err !== null) {
            res.send({
                msg: user_doc_err
            });
        } else if (user_doc === null) {
            res.send({
                msg: 'User not found'
            });
        } else {
            // return user info
            res.send({
                'mobileNumber': user_doc.mobileNumber,
                'homeNumber': user_doc.homeNumber,
                'address': user_doc.address
            });
        }
    });
});

// function 5: save user info
router.put('/saveuserinfo', function(req, res) {
    var db = req.db;
    var user_table = db.get('userList');
    // find user in userList
    user_table.findOneAndUpdate({
        '_id': req.session.userId
    }, {
        $set: {
            'mobileNumber': req.body.mobileNumber,
            'homeNumber': req.body.homeNumber,
            'address': req.body.address,
        }
    }, function(user_doc_err, user_doc) {
        if (user_doc_err !== null) {
            res.send({
                msg: user_doc_err
            });
        } else if (user_doc === null) {
            res.send({
                msg: 'User not found'
            });
        } else {
            res.send({
                msg: ''
            });
        }
    });
});

// function 6: get conversation of a specified friend
router.get('/getconversation/:friendid', function(req, res) {
    var db = req.db;
    var user_table = db.get('userList');
    var message_table = db.get('messageList');
    // find user in userList
    user_table.findOne({
        '_id': req.params.friendid
    }, function(friend_doc_err, friend_doc) {
        if (friend_doc_err !== null) {
            res.send({
                msg: friend_doc_err
            });
        } else if (friend_doc === null) {
            res.send({
                msg: 'User not found'
            });
        } else {
            // retrieve message
            // find friend -> user chats in messageList
            var msg_from_friend_filter = {
                'senderId': req.params.friendid,
                'receiverId': req.session.userId
            };
            var lastMsgId = 0;
            var msg_from_friend = new Array();
            message_table.find(msg_from_friend_filter, function(msg_from_friend_docs_err, msg_from_friend_docs) {
                if (msg_from_friend_docs_err !== null) {
                    res.send({
                        msg: msg_from_friend_docs_err
                    });
                } else {
                    for (var i = 0; i < msg_from_friend_docs.length; ++i) {
                        if (lastMsgId === 0 || msg_from_friend_docs[i]._id.toString() > lastMsgId) {
                            lastMsgId = msg_from_friend_docs[i]._id.toString();
                        }
                    }

                    // update lastMsgId of friend -> user
                    user_table.update({
                        '_id': req.session.userId,
                        'friends.name': friend_doc.name
                    }, {
                        $set: {
                            'friends.$.lastMsgId': lastMsgId
                        }
                    });

                    // find user -> friend chats in messageList
                    var msg_to_friend_filter = {
                        'senderId': req.session.userId,
                        'receiverId': req.params.friendid
                    };
                    message_table.find(msg_to_friend_filter, function(msg_to_friend_docs_err, msg_to_friend_docs) {
                        if (msg_to_friend_docs_err !== null) {
                            res.send({
                                msg: msg_to_friend_docs_err
                            });
                        } else {
                            // return all info
                            res.send({
                                'icon': friend_doc.icon,
                                'status': friend_doc.status,
                                'messages': msg_from_friend_docs.concat(msg_to_friend_docs).sort(
                                    function(a, b) {
                                        return a._id.toString() < b._id.toString() ? -1 : 1;
                                    }
                                )
                            });
                        }
                    });
                }
            });
        }
    });
});

// function 7: send a message to the specified friend
router.post('/postmessage/:friendid', function(req, res) {
    var db = req.db;
    var message_table = db.get('messageList');
    var message = {
        'senderId': req.session.userId,
        'receiverId': req.params.friendid,
        'message': req.body.message,
        'date': req.body.date,
        'time': req.body.time
    };
    message_table.insert(message, function(insert_err, insert_result) {
        res.send(
            (insert_err === null) ? {
                insertedId: message._id
            } : {
                msg: insert_err
            }
        );
    });
});

// function 8: delete a specified message
router.delete('/deletemessage/:msgid', function(req, res) {
    var db = req.db;
    var user_table = db.get('userList');
    var message_table = db.get('messageList');
    // delete the message
    message_table.remove({
        '_id': req.params.msgid
    }, function(remove_err, remove_result) {
        if (remove_err !== null) {
            res.send({
                msg: remove_err
            });
        } else {
            // find user in userList
            user_table.findOne({
                '_id': req.session.userId
            }, function(user_doc_err, user_doc) {
                if (user_doc_err !== null) {
                    res.send({
                        msg: user_doc_err
                    });
                } else if (user_doc === null) {
                    res.send({
                        msg: 'User not found'
                    });
                } else {
                    var friend_list = user_doc.friends;
                    // find friends in userList
                    user_table.find({
                        'name': {
                            $in: friend_list.map(friend => friend.name)
                        }
                    }, function(friend_docs_error, friend_docs) {
                        if (friend_docs_error !== null) {
                            res.send({
                                msg: friend_docs_error
                            });
                        } else {
                            var friend_ids = [];
                            // first find the friend(s) whose lastMsgId is the deleted messages
                            for (var i = 0; i < friend_docs.length; ++i) {
                                var friend_lastMsgId = friend_docs[i].friends.find(friend => friend.name === user_doc.name).lastMsgId;
                                if (friend_lastMsgId === req.params.msgid) {
                                    friend_ids.push(friend_docs[i]._id)
                                }
                            }

                            // find messages of user -> target friends
                            var msg_to_friend_filter = {
                                'senderId': req.session.userId,
                                'receiverId': {
                                    $in: friend_ids.map(id => id.toString())
                                }
                            };
                            message_table.find(msg_to_friend_filter, function(msg_to_friend_docs_err, msg_to_friend_docs) {

                                // store new lastMsgIds of target friends
                                var new_lastMsgIds = friend_ids.map(id => 0);
                                for (var i = 0; i < msg_to_friend_docs.length; ++i) {
                                    var idx = friend_ids.findIndex(id => id.toString() === msg_to_friend_docs[i].receiverId.toString());
                                    if (new_lastMsgIds[idx] === 0 ||
                                        msg_to_friend_docs[i]._id.toString() > new_lastMsgIds[idx]) {
                                        new_lastMsgIds[idx] = msg_to_friend_docs[i]._id.toString();
                                    }
                                }

                                // update lastMsgIds of target friends
                                // return after callback is not necessary here
                                for (var i = 0; i < friend_ids.length; ++i) {
                                    user_table.update({
                                        '_id': friend_ids[i],
                                        'friends.name': user_doc.name
                                    }, {
                                        $set: {
                                            'friends.$.lastMsgId': new_lastMsgIds[i]
                                        }
                                    });
                                }

                                res.send({
                                    msg: ''
                                });

                            });
                        }
                    });
                }
            });
        }
    });
});

// function 9: get new messages sent by a specified friend
router.get('/getnewmessages/:friendid', function(req, res) {
    var db = req.db;
    var user_table = db.get('userList');
    var message_table = db.get('messageList');
    // get user info
    user_table.findOne({
        '_id': req.session.userId
    }, function(user_doc_err, user_doc) {
        if (user_doc_err !== null) {
            res.send({
                msg: user_doc_err
            });
        } else if (user_doc === null) {
            res.send({
                msg: 'User not found'
            });
        } else {
            var friend_name = '';
            // find friend id -> name
            // and get user last chat id with this friend
            user_table.findOne({
                '_id': req.params.friendid
            }, function(friend_doc_err, friend_doc) {
                if (friend_doc_err !== null) {
                    res.send({
                        msg: friend_doc_err
                    });
                } else if (friend_doc === null) {
                    res.send({
                        msg: 'Friend not found'
                    });
                } else {
                    friend_name = friend_doc.name;
                    var lastMsgId = user_doc.friends.find(friend => friend.name === friend_name).lastMsgId;
                    // find friend -> user chats in messageList
                    var message_filter = {
                        'senderId': req.params.friendid,
                        'receiverId': req.session.userId
                    };
                    var new_msg = new Array();
                    var new_lastMsgId = 0;
                    message_table.find(message_filter, function(message_docs_err, message_docs) {
                        if (message_docs_err !== null) {
                            res.send({
                                msg: message_docs_err
                            });
                        } else {
                            for (var i = 0; i < message_docs.length; ++i) {
                                if (lastMsgId === 0 || message_docs[i]._id.toString() > lastMsgId) {
                                    new_msg.push(message_docs[i])
                                    if (new_lastMsgId === 0 || message_docs[i]._id.toString() > new_lastMsgId) {
                                        new_lastMsgId = message_docs[i]._id.toString();
                                    }
                                }
                            }
                            // update lastMsgId of friend -> user
                            if (new_lastMsgId !== 0) {
                                user_table.update({
                                    '_id': req.session.userId,
                                    'friends.name': friend_name
                                }, {
                                    $set: {
                                        'friends.$.lastMsgId': new_lastMsgId
                                    }
                                });
                            }

                            // return status, all received message ids, and new received messages
                            res.send({
                                'status': friend_doc.status,
                                'ids': message_docs.map(message => message._id),
                                'messages': new_msg.sort(function(a, b) {
                                    return a._id.toString() < b._id.toString() ? -1 : 1;
                                })
                            });
                        }
                    });
                }
            });
        }
    });
});

// function 10: get new message count of a specified friend
router.get('/getnewmsgnum/:friendid', function(req, res) {
    var db = req.db;
    var user_table = db.get('userList');
    var message_table = db.get('messageList');
    // get user info
    user_table.findOne({
        '_id': req.session.userId
    }, function(user_doc_err, user_doc) {
        if (user_doc_err !== null) {
            res.send({
                msg: user_doc_err
            });
        } else if (user_doc === null) {
            res.send({
                msg: 'User not found'
            });
        } else {
            var friend_name = '';
            var lastMsgId = 0;
            // find friend id -> name
            // and get user last chat id with this friend
            user_table.findOne({
                '_id': req.params.friendid
            }, function(friend_doc_err, friend_doc) {
                if (friend_doc_err !== null) {
                    res.send({
                        msg: friend_doc_err
                    });
                } else if (friend_doc === null) {
                    res.send({
                        msg: 'Friend not found'
                    });
                } else {
                    friend_name = friend_doc.name;
                    for (var i = 0; i < user_doc.friends.length; ++i) {
                        if (user_doc.friends[i].name === friend_name) {
                            lastMsgId = user_doc.friends[i].lastMsgId;
                            break;
                        }
                    }
                    // find friend -> user chats in messageList
                    var message_filter = {
                        'senderId': req.params.friendid,
                        'receiverId': req.session.userId
                    };
                    var new_msg_cnt = 0;
                    message_table.find(message_filter, function(message_docs_err, message_docs) {
                        if (message_docs_err !== null) {
                            res.send({
                                msg: message_docs_err
                            });
                        } else {
                            for (var i = 0; i < message_docs.length; ++i) {
                                if (lastMsgId === 0 || message_docs[i]._id.toString() > lastMsgId) {
                                    new_msg_cnt++;
                                }
                            }
                            // return new message count
                            res.send({
                                'count': new_msg_cnt
                            });
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;
