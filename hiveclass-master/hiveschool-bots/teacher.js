var TeacherBot = require('./lib/teacher-bot').TeacherBot;

var teacherBot = new TeacherBot(process.argv[3] || 'http://localhost:8080/apps/teacher');
teacherBot.createClassroom(process.argv[2])
    .then(function(accessCode) {
        console.log('Created classroom with access code:', accessCode);
    })
    .thenCatch(function(err) {
        console.log('Unable to create classroom');
    });
