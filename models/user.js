'use strict'
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema({
    name: String,
    surname: String,
    nick: String,                   //CREACION DE UNA ENTIDAD DE USUARIO
    email: String,
    password: String,
    role: String,
    image: String
});

module.exports=mongoose.model('User',UserSchema);       //EXPORTAR PARA SU USO