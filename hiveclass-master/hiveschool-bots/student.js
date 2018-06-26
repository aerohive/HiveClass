var Promise = require('bluebird'),
    StudentBot = require('./lib/student-bot').StudentBot;

var studentBot = new StudentBot(process.argv[3] || 'http://localhost:8080/apps/student');
studentBot.enterClassroomWithAccessCode(process.argv[2])
    .then(function(classroom) {
        console.log('Entered in classroom', classroom);
    })
    .then(function() {
        var SECS = 1000;
        return Promise.delay(3600 * SECS)
            .then(function() {
                studentBot.close();
            });
    })
    .thenCatch(function(err) {
        console.log('Unable to enter classroom', err);
    })
    ;
