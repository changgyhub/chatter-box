var app = angular.module('chatterbox', []);

// add directive ng-enter
app.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind('keydown keypress', function(event) {
            if (event.which === 13) {
                scope.$apply(function() {
                    scope.$eval(attrs.ngEnter);
                });
                event.preventDefault();
            }
        });
    };
});

// main controller
app.controller('chatterbox', ['$scope', '$http', '$interval', '$timeout', function($scope, $http, $interval, $timeout) {
    // manage display state
    $scope.state = {
        login: false,
        main: false,
        info: false,
        chat: false,
        delete: false
    };
    $scope.user = {};
    $scope.login = {};
    $scope.friend = {};
    $scope.friends = [];

    // function 1: page loads
    angular.element(document).ready(function() {
        // AJAX call to load
        $http({
            method: 'GET',
            url: '/load'
        }).then(function(response) {
            if ('msg' in response.data) { // failure
                // display figure 1
                $scope.state.login = true;
            } else { //success
                // store _id of each friend for future usage
                $scope.friends = response.data.friends;
                // save user name and icon
                $scope.user.name = response.data.name;
                $scope.user.icon = '/' + response.data.icon;
                // display figure 2
                $scope.state.main = true;
            }
        });
    });

    // function 2: log in
    $scope.sign_in = function($event) {
        $event.preventDefault();
        // check if both the username and password input textboxes are non-empty
        if ($scope.login.username && $scope.login.password) { // non-empty
            // AJAX call to login
            $http({
                method: 'POST',
                data: {
                    'username': $scope.login.username,
                    'password': $scope.login.password
                },
                url: '/login',
                dataType: 'JSON'
            }).then(function(response) {
                // check login
                if ('msg' in response.data) { // failure
                    $scope.login.error = 'Login failure';
                } else { // success
                    $scope.login.error = '';
                    // store _id of each friend for future usage
                    $scope.friends = response.data.friends;
                    // save user name and icon
                    $scope.user.name = response.data.name;
                    $scope.user.icon = '/' + response.data.icon;
                    // display figure 2
                    $scope.state.login = false;
                    $scope.state.main = true;
                }
            });
        } else { // empty username or password
            alert('You must enter username and password');
        }
    };

    // function 3: log out
    $scope.log_out = function($event) {
        $event.preventDefault();
        // AJAX call to logout
        $http({
            method: 'GET',
            url: '/logout'
        }).then(function(response) {
            if (response.data.msg === '') { // success
                $scope.user = {};
                $scope.login = {};
                $scope.friend = {};
                $scope.friends = [];
                // display figure 1
                $scope.state.main = false;
                $scope.state.chat = false;
                $scope.state.info = false;
                $scope.state.login = true;
            }
        });
    };

    // function 4: show user info
    $scope.show_user_info = function($event) {
        $event.preventDefault();
        // AJAX call to get user info
        $http({
            method: 'GET',
            url: '/getuserinfo'
        }).then(function(response) {
            if (!('msg' in response.data)) { // success
                // save user info
                $scope.user.mobile_number = response.data.mobileNumber;
                $scope.user.home_number = response.data.homeNumber;
                $scope.user.address = response.data.address;
                // display figure 3
                $scope.state.chat = false;
                $scope.state.info = true;
                $scope.friend = {};
            }
        });
    }

    // function 5: save user info
    $scope.save_user_info = function($event) {
        $event.preventDefault();
        // AJAX call to get user info
        $http({
            method: 'PUT',
            data: {
                'mobileNumber': $scope.user.mobile_number,
                'homeNumber': $scope.user.home_number,
                'address': $scope.user.address
            },
            url: '/saveuserinfo',
            dataType: 'JSON'
        }).then(function(response) {
            if (response.data.msg !== '') { // failure
                $scope.user.info_update_error = response.data.msg;
            } else { // success
                $scope.user.info_update_error = '';
            }
        });
    }

    // function 6: load a conversation
    $scope.load_conversation = function($event, $index) {
        // do nothing if already in
        if (Object.keys($scope.friend).length !== 0 && $scope.friend._id === $scope.friends[$index]._id)
            return;
        $event.preventDefault();
        // AJAX call to get conversation
        $http({
            method: 'GET',
            url: '/getconversation/' + $scope.friends[$index]._id
        }).then(function(response) {
            if (!('msg' in response.data)) { // success
                // store friend and conversation info
                $scope.friends[$index].unread = 0;
                $scope.friend._id = $scope.friends[$index]._id;
                $scope.friend.icon = response.data.icon;
                $scope.friend.name = $scope.friends[$index].name + ' (' + response.data.status + ')';
                // load messages
                $scope.messages = new Array();
                while (response.data.messages.length > 0) {
                    var current_date = response.data.messages[0].date;
                    var daily_messages = response.data.messages.filter(message => message.date === current_date)
                    for (var i = 0; i < daily_messages.length; ++i) {
                        if (daily_messages[i].senderId === $scope.friends[$index]._id.toString()) { // from friend
                            daily_messages[i].target = 'from';
                        } else { // to friend
                            daily_messages[i].target = 'to';
                        }
                    }
                    $scope.messages.push({
                        'date': current_date,
                        'messages': daily_messages
                    });
                    response.data.messages.splice(0, daily_messages.length);
                }
                // display figure 3
                $scope.state.info = false;
                $scope.state.chat = true;
                // move scroller to the end
                $timeout(function() {
                    var scroller = document.getElementById("autoscroll");
                    scroller.scrollTop = scroller.scrollHeight;
                }, 0, false);
            }
        });
    };

    // function 7: post a new message
    $scope.post_message = function($event) {
        // do nothing if no input characters
        if ($scope.msg_to_send == null || $scope.msg_to_send.length === 0) return;
        // AJAX call to post a new message
        var current_datetime = new Date();
        var current_date = current_datetime.toDateString();
        var current_time = current_datetime.toTimeString().split(' ')[0];
        $http({
            method: 'POST',
            data: {
                'message': $scope.msg_to_send,
                'date': current_date,
                'time': current_time,
            },
            url: '/postmessage/' + $scope.friend._id,
            dataType: 'JSON'
        }).then(function(response) {
            if ('insertedId' in response.data) { // success
                // check if there were messages today
                if ($scope.messages.length === 0 || $scope.messages[$scope.messages.length - 1].date !== current_date) {
                    $scope.messages.push({
                        'date': current_date,
                        'messages': [{
                            '_id': response.data.insertedId,
                            'target': 'to',
                            'time': current_time,
                            'message': $scope.msg_to_send
                        }]
                    });
                } else {
                    $scope.messages[$scope.messages.length - 1].messages.push({
                        '_id': response.data.insertedId,
                        'target': 'to',
                        'time': current_time,
                        'message': $scope.msg_to_send
                    });
                }
                $scope.msg_to_send = '';
                // move scroller to the end
                $timeout(function() {
                    var scroller = document.getElementById("autoscroll");
                    scroller.scrollTop = scroller.scrollHeight;
                }, 0, false);
            }
        });
    }

    // function 8: delete a message
    $scope.show_delete_box = function($event, message_id, message_date_index, message_time_index) {
        $event.preventDefault();
        $scope.popup_left = Math.min($event.pageX + 1, window.innerWidth - 200);
        $scope.popup_top = Math.min($event.pageY + 1, window.innerHeight - 100);
        $scope.msg_to_delete = {
            '_id': message_id,
            'date_index': message_date_index,
            'time_index': message_time_index
        };
        $scope.state.delete = true;
    }

    $scope.hide_delete_box = function($event) {
        $event.preventDefault();
        $scope.msg_to_delete = null;
        $scope.state.delete = false;
    }

    $scope.delete_message = function($event) {
        $event.preventDefault();
        // AJAX call to delete message
        $http({
            method: 'DELETE',
            url: '/deletemessage/' + $scope.msg_to_delete._id
        }).then(function(response) {
            if (response.data.msg === '') { // success
                // delete this message from buffer
                if ($scope.messages[$scope.msg_to_delete.date_index].messages.length === 1) {
                    $scope.messages.splice($scope.msg_to_delete.date_index, 1);
                } else {
                    $scope.messages[$scope.msg_to_delete.date_index].messages.splice($scope.msg_to_delete.time_index, 1);
                }
                $scope.msg_to_delete = null;
                $scope.state.delete = false;
            }
        });
    }

    // function 9: retrive new messages for friend in chat periodically
    stop_retreive_msg = $interval(function() {
        // check if a friend is loaded
        if (Object.keys($scope.friend).length === 0) return;
        // AJAX call to get new messages
        $http({
            method: 'GET',
            url: '/getnewmessages/' + $scope.friend._id
        }).then(function(response) {
            if (!('msg' in response.data)) { // success
                // 1. update friend status
                $scope.friend.name = $scope.friend.name.split(' ')[0] + ' (' + response.data.status + ')';

                // 2. load new messages
                var has_new_msg = (response.data.messages.length > 0);
                while (response.data.messages.length > 0) {
                    var current_date = response.data.messages[0].date;
                    var daily_messages = response.data.messages.filter(message => message.date === current_date)
                    for (var i = 0; i < daily_messages.length; ++i) {
                        daily_messages[i].target = 'from';
                    }
                    // add to message storage
                    // check if there were messages today
                    if ($scope.messages.length === 0 || $scope.messages[$scope.messages.length - 1].date !== current_date) {
                        $scope.messages.push({
                            'date': current_date,
                            'messages': daily_messages
                        });
                    } else {
                        $scope.messages[$scope.messages.length - 1].messages.push.apply(
                            $scope.messages[$scope.messages.length - 1].messages,
                            daily_messages
                        );
                    }
                    response.data.messages.splice(0, daily_messages.length);
                }

                // 3. delete deleted messages
                //  backward for loop to avoid problems of deleting indexed item
                for (var i = $scope.messages.length - 1; i >= 0; --i) {
                    for (var j = $scope.messages[i].messages.length - 1; j >= 0; --j) {
                        if ($scope.messages[i].messages[j].target === 'from' &&
                            response.data.ids.find(id => id === $scope.messages[i].messages[j]._id) === undefined) {
                            $scope.messages[i].messages.splice(j, 1);
                        }
                    }
                    if ($scope.messages[i].messages.length === 0) {
                        $scope.messages.splice(i, 1);
                    }
                }

                // move scroller to the end
                if (has_new_msg) {
                    $timeout(function() {
                        var scroller = document.getElementById("autoscroll");
                        scroller.scrollTop = scroller.scrollHeight;
                    }, 0, false);
                }
            }
        });
    }, 1000);

    // function 10: retrive new message counts for other friends periodically
    stop_retreive_msg_cnt = $interval(function() {
        for (var i = 0; i < $scope.friends.length; ++i) {
            update_message_count(i);
        }
    }, 1000);

    function update_message_count(i) {
        // jump current friend
        if ($scope.friend._id === $scope.friends[i]._id) return;
        // AJAX call to get new message count
        $http({
            method: 'GET',
            url: '/getnewmsgnum/' + $scope.friends[i]._id
        }).then(function(response) {
            if (!('msg' in response.data)) { // success
                $scope.friends[i].unread = response.data.count;
            }
        });
    }

}]);
