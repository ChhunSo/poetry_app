"use strict";
var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10);

module.exports = function(sequelize, DataTypes) {
    var User = sequelize.define("User", {
        email: {
            type: DataTypes.STRING,
            unique: true,
            validate: {
                len: [6, 30],
            }
        },
        password_digest: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: true,
            }
        }
    }, {
        instanceMethods: {
            checkPassword: function(password) {
                return bcrypt.compareSync(password, this.password_digest);
            }
        },
        classMethods: {
            encryptPassword: function(password) {
                var hash = bcrypt.hashSync(password, salt);
                return hash;
                // associations can be defined here
            },
            createSecure: function(email, password) {
                if (password.length < 6) {
                    throw new Error("Password is too short")
                }
                return this.create({
                    email: email,
                    password_digest: this.encryptPassword(password)
                });
            },
            authenticate: function(email, password) {
                return this.find({
                        where: {
                            email: email
                        }
                    })
                    .then(function(user) {
                        if (user === null) {
                            throw new Error("Username non-existent");
                        } else if (user.checkPassword(password)) {
                            return user;
                        } else {
                            return false;
                        }
                    });
            },
            associate: function(models) {
                this.hasMany(models.Poem);
            }

        }
    });
    return User;
};