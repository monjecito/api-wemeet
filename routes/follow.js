'use strict'

var express=require('express');
var FollowControler=require('../controllers/follow');
var api=express.Router();
var md_authz=require('../middlewares/authenticated');

api.post('/follow',md_authz.ensureAuth,FollowControler.saveFollow);
api.delete('/follow/:id',md_authz.ensureAuth,FollowControler.deleteFollow);
api.get('/following/:id?/:page?',md_authz.ensureAuth,FollowControler.getFollowingUsers);
api.get('/followed/:id?/:page?',md_authz.ensureAuth,FollowControler.getFollowedUsers);
api.get('/get-my-follows/:followed?',md_authz.ensureAuth,FollowControler.getMyFollows);

module.exports=api;