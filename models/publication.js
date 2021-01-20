'use strict'
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PublicationSchema = Schema({
    text: String,
    file: String,
    created_at: String,                                 //CREANDO MODELO ENTIDAD PUBLICACION
    user: { type: Schema.ObjectId, ref: 'User' },           //ALMACENA EL ID DE LA ENTIDAD USER

});

module.exports = mongoose.model('Publication', PublicationSchema);       //EXPORTAR PARA SU USO