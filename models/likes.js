'use strict'
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LikesSchema = Schema({
    publication_id: { type: Schema.ObjectId, ref: 'Publication' },
    user_liked: {type:Schema.ObjectId,ref:'User'}
});

module.exports = mongoose.model('Likes', LikesSchema);       //EXPORTAR PARA SU USO