'use strict'

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');      //Listado de mensajes

var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');
const message = require('../models/message');
const { use } = require('../routes/user');

function probando(req, res) {
    res.status(200).send({ Message: 'Probando controlador de mensajes' });
}

//Comprobaciones y en caso correcto almacenará el mensaje con el contenido, id del receptor y el id del emitter(token)
function saveMessage(req, res) {
    //Acceder variables que llegan desde post
    var params = req.body;

    if (!params.text || !params.receiver) return res.status(200).send({ Message: 'Envía los datos necesarios' });

    var message = new Message();
    message.emitter = req.user.sub;
    message.receiver = params.receiver;
    message.text = params.text;
    message.created_at = moment().unix();
    message.viewed = 'false';

    message.save((err, messageStored) => {
        if (err) return res.status(500).send({ Message: 'Error en la petición' });

        if (!messageStored) return res.status(500).send({ Message: 'Error al enviar el mensaje' });

        return res.status(200).send({ message: messageStored });
    });

}

//Mostrar mensajes recibidos paginados del usuario en el que esté logeado
function getReceivedMessages(req, res) {
    var userId = req.user.sub;
 
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 4;

    Message.find({ receiver: userId }).populate('emitter', 'name surname image nick _id').sort('-created_at').paginate(page, itemsPerPage, (err, messages, total) => {
        if (err) return res.status(500).send({ Message: 'Error en la petición' });

        if (!messages) if (err) return res.status(404).send({ Message: 'No hay mensajes que mostrar' });
        console.log(messages);
        return res.status(200).send({
            total: total,
            pages: Math.ceil(total / itemsPerPage),
            messages

        });
    });

}

//Mensajes enviados
function getEmmitMessages(req, res) {
    var userId = req.user.sub;


    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 4;

    Message.find({ emitter: userId }).populate('emitter receiver', 'name surname image nick _id').sort('-created_at').paginate(page, itemsPerPage, (err, messages, total) => {
        if (err) return res.status(500).send({ Message: 'Error en la petición' });

        if (!messages) if (err) return res.status(404).send({ Message: 'No hay mensajes que mostrar' });

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total / itemsPerPage),
            messages

        });
    });

}
//Obtener mensajes que no han sido vistos
function getUnviewedMessages(req, res) {
    var userId = req.user.sub;

    Message.count({ receiver: userId, viewed: false }).exec((err,count) => {
        if (err) return res.status(500).send({ Message: 'Error en la petición' });

        return res.status(200).send({
            'unviewed':count
        });
    });
}

//Ver mensaje y actualizar todos los datos necesarios
function setViewedMessages(req,res){
    var userId=req.user.sub;

    Message.update({receiver:userId,viewed:false},{viewed:true},{"multi":true},(err,messageUpdated)=>{
        if (err) return res.status(500).send({ Message: 'Error en la petición' });
        
        return res.status(200).send({
            messages:messageUpdated
        });
    });
}

module.exports = {
    probando,
    saveMessage,
    getReceivedMessages,
    getEmmitMessages,
    getUnviewedMessages,
    setViewedMessages       
}