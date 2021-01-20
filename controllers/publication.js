'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');
var Likes = require('../models/likes');
var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');
const publication = require('../models/publication');

function probando(req, res) {
    res.status(200).send({ message: 'Polla frita controlador de las publicaciones' });
}

function savePublication(req, res) {
    var params = req.body;



    if (!params.text) return res.status(200).send({ message: 'Debes enviar un texto!!' });

    var publication = new Publication();
    publication.text = params.text;
    publication.file = 'null';
    publication.user = req.user.sub;
    publication.created_at = moment().unix();

    publication.save((err, publicationStored) => {
        if (err) return res.status(500).send({ message: 'Error al guardar la publicacion' });

        if (!publicationStored) return res.status(404).send({ message: 'La publicación no ha sido guardada' });

        return res.status(200).send({ publication: publicationStored });
    });
}

//BUSCAR TODOS LOS USUARIOS A LOS QUE SEGUIMOS DENTRO DE UN ARRAY Y COMPROBAR EL CONJUNTO DE SUS PUBLICACIONES SI ES QUE TIENEN.
function getPublications(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Follow.find({ user: req.user.sub }).populate('followed').exec((err, follows) => {
        if (err) return res.status(500).send({ message: 'Error al devolver el seguimiento' });

        var follows_clean = [];

        follows.forEach((follow) => {
            follows_clean.push(follow.followed);
        });
        //Mostrar nuestras propias publicaciones
        follows_clean.push(req.user.sub);

        Publication.find({ user: { "$in": follows_clean } }).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {     //Buscar coincidencias dentro del array y mostrar sus documentos
            if (err) return res.status(500).send({ message: 'Error al devolver publicaciones' });
            if (!publications) return res.status(404).send({ message: 'No hay publicaciones' });
           
            userLikes(req.user.sub).then((response) => {
            return res.status(200).send({
                total_items: total,
                pages: Math.ceil(total / itemsPerPage),
                page: page,
                items_per_page: itemsPerPage,
                publications,
                likes:response.mylikes
            });
        });
        });
    });
}
function getPublicationsLiked(req, res) {
    var userId = req.params.id;

    var page = 1;

    if (req.params.page) {
        page = req.params.page;
    }

    var itemsPerPage = 20;
    var pubs_clean = [];
    userLikes(userId).then((response) => {
            pubs_clean=response.mylikes;
            Publication.find({  _id: pubs_clean }).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {     //Buscar coincidencias dentro del array y mostrar sus documentos
                if (err) return res.status(500).send({ message: 'Error al devolver publicaciones' });
                if (!publications) return res.status(404).send({ message: 'No hay publicaciones' });
               
                userLikes(req.user.sub).then((response) => {
                return res.status(200).send({
                    total_items: total,
                    pages: Math.ceil(total / itemsPerPage),
                    page: page,
                    items_per_page: itemsPerPage,
                    publications,
                    likes:pubs_clean,
                    mylikes:response.mylikes
                });
            });
            });
        });

       
}

async function userLikes(user_id) {

   var alllikes=await Likes.find({'user_liked':user_id}).select({ '_id': 0, '__v': 0,'user_liked':0}).exec()
        .then((likes) => {
            return likes;
        })
        .catch((err) => {
            return handleError(err);
        });

        var todosloslikes=[];
        alllikes.forEach((alllikes)=>{
            todosloslikes.push(alllikes.publication_id);
        });

    //console.log(following_clean);
    return { mylikes:todosloslikes }
    
}
function getUsersLiked(req, res) {
    var publication_id = req.params.id;

    var page = 1;

    if (req.params.page) {
        page = req.params.page;
    }

    var itemsPerPage = 4;
    var pubs_clean = [];
    userLiked(publication_id,req.user.sub).then((response) => {
            pubs_clean=response.usersliked;
            User.find({  _id: pubs_clean }).populate('followed').paginate(page, itemsPerPage, (err, users, total) => {     //Buscar coincidencias dentro del array y mostrar sus documentos
                if (err) return res.status(500).send({ message: 'Error al devolver publicaciones' });
                if (!users) return res.status(404).send({ message: 'No hay publicaciones' });
                return res.status(200).send({
                    total_items: total,
                    pages: Math.ceil(total / itemsPerPage),
                    page: page,
                    items_per_page: itemsPerPage,
                    likes:pubs_clean,
                    users,
                    follows:response.following
                });
            });
            });
}

async function userLiked(publication_id,user_id) {

   var alllikes=await Likes.find({'publication_id':publication_id}).select({ '_id': 0, '__v': 0,'publication_id':0}).exec()
        .then((likes) => {
            return likes;
        })
        .catch((err) => {
            return handleError(err);
        });

        var todosloslikes=[];
        alllikes.forEach((alllikes)=>{
            todosloslikes.push(alllikes.user_liked);
        });

        var following = await Follow.find({ 'user': user_id }).select({ '_id': 0, '__v': 0, 'user': 0 }).exec()
        .then((follows) => {
            return follows;
        })
        .catch((err) => {
            return handleError(err);
        });
        var following_clean = [];

    following.forEach((follow) => {
        following_clean.push(follow.followed);
    });

    //console.log(following_clean);
    return { usersliked:todosloslikes,following: following_clean }
    
}


//Devolver todas las publicaciones de un usuario
function getPublicationsUser(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var user = req.user.sub;

    if (req.params.user) {
        user = req.params.user;
    }
    var itemsPerPage = 4;

    //Mostrar nuestras propias publicaciones
    Publication.find({ user: user }).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {     //Buscar coincidencias dentro del array y mostrar sus documentos
        if (err) return res.status(500).send({ message: 'Error al devolver publicaciones' });
        if (!publications) return res.status(404).send({ message: 'No hay publicaciones' });

        userLikes(req.user.sub).then((response) => {
        return res.status(200).send({
            total_items: total,
            pages: Math.ceil(total / itemsPerPage),
            page: page,
            items_per_page: itemsPerPage,
            publications,
            likes:response.mylikes
        });
    });
    });
}
//Obtener una sola publicación
function getPublication(req, res) {
    var publicationId = req.params.id;

    Publication.findById(publicationId, (err, publication) => {
        if (err) return res.status(500).send({ message: 'Error al devolver publicaciones' });

        if (!publication) return res.status(404).send({ message: 'No existe la publicación' });
        Likes.find({'publication_id':publicationId}).select({ '_id': 0, '__v': 0}).exec((err,likes)=>{
            if (err) return res.status(500).send({ message: 'Error al devolver los likes' });
                if(!likes) return res.status(404).send({ message: 'No hay likes' });

                var todosloslikes=[];
                likes.forEach((alllikes)=>{
                    todosloslikes.push(alllikes);
                });

        
        return res.status(200).send({ publication,todosloslikes });
    });
    });
}

function deletePublication(req, res) {
    var publicationId = req.params.id;
    var publication_id = req.params.publication_id;
    Publication.find({ 'user': req.user.sub, '_id': publicationId }).remove(err => {
        if (err) return res.status(500).send({ message: 'Error al borrar publicaciones' });
        
       
        Likes.find({ 'publication_id': publication_id}).remove(err => {
        if (err) return res.status(500).send({ message: 'Error al dejar de gustarte una publicacion' });
    
        return res.status(200).send({ message: 'La publicacion y los likes like ha sido eliminado' }); 
         
           
        });
    });
    
    

}
function uploadImage(req, res) {
    var publicationId = req.params.id;

    if (req.files) {
        var file_path = req.files.image.path;

        var file_split = file_path.split('\\');


        var file_name = file_split[2];


        var ext_split = file_name.split('\.');


        var file_ext = ext_split[1];



        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif') {

            Publication.findOne({ 'user': req.user.sub, '_id': publicationId }).exec((err, publication) => {
                console.log(publication);
                if (publication) {
                    //Actualizar documento de la publicacion
                    Publication.findByIdAndUpdate(publicationId, { file: file_name }, { new: true }, (err, publicationUpdated) => {
                        if (err) return res.status(500).send({ message: 'Error en la petición' });

                        if (!publicationUpdated) return res.status(404).send({ message: 'No se ha podido actualizar el usuario' });

                        return res.status(200).send({ publication: publicationUpdated });
                    });
                } else {
                    return removeFilesOfUploads(res, file_path, 'No tienes permiso para actualizar esta publicación');
                }
            });

        } else {
            return removeFilesOfUploads(res, file_path, 'Extensión no valida');
        }

    } else {
        return res.status(200).send({
            message: 'No se han subido imagenes'
        });
    }
}
//ELIMINAR IMAGENES
function removeFilesOfUploads(res, file_path, message) {
    fs.unlink(file_path, (err) => {
        return res.status(200).send({ message: message });
    });
}
function getImageFile(req, res) {
    var image_file = req.params.imageFile;
    var path_file = './uploads/publications/' + image_file;

    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({ message: 'No existe la imagen' });
        }

    });
}


module.exports = {
    probando,
    savePublication,
    getPublications,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile,
    getPublicationsUser,
    getPublicationsLiked,
    getUsersLiked
}