'use strict'
var mongoose = require('mongoose');
var app = require('./app');
var PORT = process.env.PORT||8080;
const uri = "mongodb+srv://monjecito:deportivogu@we-meet.fdih6.mongodb.net/red-social?retryWrites=true&w=majority";
//CONEXION DATABASE

mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;
mongoose.connect(uri,{useNewUrlParser:true, useUnifiedTopology: true })
    .then(() => {
        console.log('Servidor de la red social corriendo correctamente');

        //CREAR SERVIDOR
        app.listen(PORT,()=>{
            console.log('Servidor corriendo');
        });


    })
    .catch(err => console.log(err));