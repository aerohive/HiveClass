/**
 * Created by thibaultzanini on 10/10/14.
 */

var Entity = require('./entity').Entity;


var ClassEntity = exports.ClassEntity = function ClassEntity (name, teacher, code) {
    Entity.call(this);

    Object.defineProperties(this, {

        name: {
            value: name,
            writable: true,
            enumerable: true
        },

        teacher: {
            value: teacher.id || teacher, //todo check
            writable: true,
            enumerable: true
        },

        lessons: {
            value: [],
            writable: false,
            enumerable: true
        },

        locked: {
            value: false,
            writable: false,
            enumerable: true
        },

        accessCode: {
            value: code,
            writable: true,
            enumerable: true
        }

    });

};
