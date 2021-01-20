'use strict'

var express=require('express');
var LikesController=require('../controllers/likes');
var api=express.Router();
var md_authz=require('../middlewares/authenticated');

api.get('/pruebas-likes',md_authz.ensureAuth,LikesController.prueba);
api.post('/like',md_authz.ensureAuth,LikesController.saveLike);
api.delete('/like/:id',md_authz.ensureAuth,LikesController.deleteLike);
api.get('/likes/:id', md_authz.ensureAuth, LikesController.getLikes);
api.get('/userLikes/:id?/:page?',md_authz.ensureAuth,LikesController.userlikes);
module.exports=api;