'use strict'

var express=require('express');
var bodyParser=require('body-parser');

var app=express();

//CARGAR RUTAS
var user_routes=require('./routes/user');
var follow_routes=require('./routes/follow');
var publication_routes=require('./routes/publication');
var message_routes=require('./routes/message');
var likes_routes=require('./routes/likes');
//CARGAR MIDDLEWARES

app.use(bodyParser.urlencoded({extended:false}));       //CONVERTIR TODOS LOS DATOS EN JSON
app.use(bodyParser.json());

//CORS Y CABECERAS HTTP
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
 
    next();
});

//RUTAS
app.use('/api',user_routes);
app.use('/api',follow_routes);
app.use('/api',publication_routes);
app.use('/api',message_routes);
app.use('/api',likes_routes);

//EXPORTAR
module.exports=app;