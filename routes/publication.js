'use strict'

var express=require('express');
var PublicationController=require('../controllers/publication');
var api=express.Router();
var md_authz=require('../middlewares/authenticated');

var multipart=require('connect-multiparty');
var md_upload=multipart({uploadDir:'./uploads/publications'});

api.get('/probando-pub',md_authz.ensureAuth,PublicationController.probando);
api.post('/publication',md_authz.ensureAuth,PublicationController.savePublication);
api.get('/publications/:page?',md_authz.ensureAuth,PublicationController.getPublications);
api.get('/publications-user/:user/:page?',md_authz.ensureAuth,PublicationController.getPublicationsUser);
api.get('/publication/:id',md_authz.ensureAuth,PublicationController.getPublication);
api.delete('/publication/:id',md_authz.ensureAuth,PublicationController.deletePublication);
api.post('/upload-image-pub/:id',[md_authz.ensureAuth,md_upload],PublicationController.uploadImage);
api.get('/get-image-pub/:imageFile',PublicationController.getImageFile);
api.get('/publications-liked/:id/:page?',md_authz.ensureAuth,PublicationController.getPublicationsLiked);
api.get('/usersLiked/:id',md_authz.ensureAuth,PublicationController.getUsersLiked);
module.exports=api;