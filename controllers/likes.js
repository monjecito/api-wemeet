'use strict'

// var path=require('path');
// var fs=require('fs');

var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Likes = require('../models/likes');
var Publication = require('../models/publication');
const { find } = require('../models/user');
const publication = require('../models/publication');
function prueba(req, res) {
    res.status(200).send({ message: 'Hola mundo desde el controllador de likes' });
}
function saveLike(req, res) {
    var params = req.body;

    var like = new Likes();
    like.user_liked = req.user.sub;
    like.publication_id = params.publication_id;
    
    //Control de likes duplicados
    Likes.find({
        
        user_liked:like.user_liked,
        publication_id:like.publication_id

    }).exec((err, likes) => {
        if (err)
            return res.status(500).send({
                message: 'Error en la petición de likes'
            });

        if (likes && likes.length >= 1) {
            return res.status(200).send({
                message: 'Esa publicación ya te gusta'
            });
        } else {
    like.save((err, likeStored) => {
        if (err) return res.status(500).send({ message: 'Error al guardar el like' });

        if (!likeStored) return res.status(404).send({ message: 'El like no se ha guardado' });

        return res.status(200).send({
            like: likeStored
        });
    });
}
    });
}

//Eliminará 
function deleteLike(req, res) {
    var id = req.user.sub;
    var id_pub = req.params.id;

    Likes.find({'user_liked': id,'publication_id': id_pub}).remove(err => {
        if (err) return res.status(500).send({ message: 'Error al dejar de gustarte una publicacion' });
        
        return res.status(200).send({ message: 'El like ha sido eliminado' });
    });


}

//CONTABILIZAR ESTADISTICAS LIKES DE UNA PUBLICACION
function getLikes(req, res) {
       var publi_id = req.params.id;
    
    getCountFollow(publi_id).then((value,error) => {
        return res.status(200).send(value);

    });

}
//FUNCION ASINCRONA QUE DEVOLVERA EL CONTADOR DE LIKES
async function getCountFollow(publicacion_id) {
    
    var likes = await Likes.count({ publication_id: publicacion_id })
        .exec()
        .then((count) => {
            return count;
        })
        .catch((err) => { return handleError(err); });

    return { likes:likes }

}

//Publicaciones que me han gustado
function userlikes(req,res){
    var userId=req.user.sub;    

    if (req.params.id && req.params.page) {
        userId = req.params.id;
    }
    var page = 1;

    if (req.params.page) {
        page = req.params.page;
    } else {
        page = req.params.id;
    }

    var itemsPerPage = 4;
    var likes=Likes.find({user_liked:userId}).populate('publication_id').paginate(page, itemsPerPage,(err,pubs ,total) => {
        if (err) return res.status(500).send({ message: 'Error al devolver el seguimiento' });


        return res.status(200).send({
            
            total: total,
            pages: Math.ceil(total / itemsPerPage),
            publicaciones:pubs
        });
 
});

}




module.exports = {
    prueba,
    saveLike,
    deleteLike,
    getLikes,
    userlikes,
}