'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = Schema({
    text: String,
    viewed: String,
    created_at: String,                                  //ENTIDAD MODELO MENSAJE
    emitter: { type: Schema.ObjectId, ref: 'User' },
    receiver: { type: Schema.ObjectId, ref: 'User' }          //ALMACENAR EL ID DEL MODELO DEL USUARIO
});

module.exports = mongoose.model('Message', MessageSchema);