/**
 * Created by thibaultzanini on 10/10/14.
 */

var Entity = require('./entity').Entity,
    EntityConfiguration = require('../configuration/entity-configuration').EntityConfiguration;


var UserEntity = exports.UserEntity = function UserEntity (uid, firstName, lastName, gender, role) {

    Entity.call(this);

    Object.defineProperties(this, {

        userID: {
            value: uid,
            writable: true,
            enumerable: true
        },

        firstName: {
            value: firstName,
            writable: true,
            enumerable: true
        },

        lastName: {
            value: lastName,
            writable: true,
            enumerable: true
        },

        role: {
            value: role,
            writable: true,
            enumerable: true
        },

        password: {
            value: null,
            writable: true,
            enumerable: true
        },

        avatar: {
            value: null,
            writable: true,
            enumerable: true
        },

        gender: {
            value: gender || EntityConfiguration.gender.male,
            writable: true,
            enumerable: true
        }

    });

};

