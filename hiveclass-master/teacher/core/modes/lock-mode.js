/**
 * @module lock-mode
 */
var AbstractMode = require('./abstract-mode').AbstractMode,
    Promise = require('montage/core/promise').Promise;
/**
 * @class LockMode
 * @extends AbstractMode
 */
exports.LockMode = AbstractMode.specialize(/** @lends LockMode# */ {
    name: {
        value: 'lock'
    },

    _from: {
        value: [
            'followme',
            'focus',
            'presenter'
        ]
    },

    _multiple: {
        value: true
    },

    _errorMessages: {
        value: {
            focus: 'Before locking a student, you must remove focused resources from the classroom.'
        }
    },

    _lockedStudents: {
        value: []
    },

    _studentService: {
        value: null
    },

    constructor: {
        value: function(studentService) {
            this._studentService = studentService;
        }
    },

    _start: {
        value: function(student) {
            this._studentService.lock(student);
            this._lockedStudents.push(student);
        }
    },

    _stop: {
        value: function(student) {
            var students = student ? [student] : this._lockedStudents;
            for (var i = students.length-1; i >= 0; i--) {
                student = students[i];
                this._studentService.unlock(student);
                this._lockedStudents.splice(this._lockedStudents.indexOf(student), 1);
            }
        }
    }
});
