'use strict'

var express = require('express');
var MessageControler = require('../controllers/message');
var api = express.Router();
var md_authz = require('../middlewares/authenticated');

api.get('/probando-md', md_authz.ensureAuth, MessageControler.probando);
api.post('/message', md_authz.ensureAuth, MessageControler.saveMessage);
api.get('/my-messages/:page?',md_authz.ensureAuth,MessageControler.getReceivedMessages);
api.get('/messages/:page?',md_authz.ensureAuth,MessageControler.getEmmitMessages);
api.get('/unviewed-messages',md_authz.ensureAuth,MessageControler.getUnviewedMessages);
api.get('/set-viewed-messages',md_authz.ensureAuth,MessageControler.setViewedMessages);

module.exports = api;