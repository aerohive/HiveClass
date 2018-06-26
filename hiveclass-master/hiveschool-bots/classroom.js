var Promise = require('bluebird'),
    TeacherBot = require('./lib/teacher-bot').TeacherBot,
    StudentBot = require('./lib/student-bot').StudentBot;

var domain = process.argv[2];
var classroomName = process.argv[3];
var studentsCount = process.argv[4];

var teacherBot = new TeacherBot(domain + '/apps/teacher');
var studentBots = [];

teacherBot.createClassroom(classroomName)
    .then(function(accessCode) {
        for (var i = 0; i < studentsCount; i++) {
            studentBots.push(new StudentBot(domain + '/apps/student'));
        }
        return Promise.all(studentBots.map(function(bot) {
            return bot.enterClassroomWithAccessCode(accessCode);
        }));
    })
    .then(function() {
        var SECS = 1000;
        return Promise.delay(3600 * SECS)
            .then(function() {
                return Promise.all(studentBots.map(function(bot) {
                    return bot.close();
                }));
            })
            .then(function() {
                return teacherBot.close();
            })
            ;
    });
