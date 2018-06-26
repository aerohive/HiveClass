/**
 * Created by thibaultzanini on 10/10/14.
 */

var UserEntity = require('./user').UserEntity,
    EntityConfiguration = require('../configuration/entity-configuration').EntityConfiguration;


var StudentEntity = exports.StudentEntity = function StudentEntity (uid, firstName, lastName, gender) {

    UserEntity.call(this, uid, firstName, lastName, gender, EntityConfiguration.role.student);

    Object.defineProperties(this, {
        urls: {
            value: [],
            writable: true,
            enumerable: true
        }
    });

};
