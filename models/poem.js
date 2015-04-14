"use strict";
module.exports = function(sequelize, DataTypes) {
    var Poem = sequelize.define("Poem", {
        title: DataTypes.STRING,
        content: DataTypes.TEXT,
        userId: DataTypes.INTEGER
    }, {
        classMethods: {
            associate: function(models) {
                this.belongsTo(models.User);
            }
        }
    });
    return Poem;
};