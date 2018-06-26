/**
 * Created by thibaultzanini on 10/10/14.
 */

var UserEntity = require('./user').UserEntity,
    EntityConfiguration = require('../configuration/entity-configuration').EntityConfiguration;


var TeacherEntity = exports.TeacherEntity = function TeacherEntity (uid, firstName, lastName, gender) {

    UserEntity.call(this, uid, firstName, lastName, gender, EntityConfiguration.role.teacher);

    Object.defineProperties(this, {

        classes: {
            value: [],
            writable: true,
            enumerable: true
        }

    });

};
