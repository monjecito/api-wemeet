'use strict'
var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');
var Likes = require('../models/likes');
var jwt = require('../services/jwt');
const follow = require('../models/follow');
const publication = require('../models/publication');
const user = require('../models/user');
const { domainToASCII } = require('url');

//METODOS DE PRUEBA
function home(req, res) {
    res.status(200).send({
        message: 'Hola mundo desde NODEJS',

    });
}

function pruebas(req, res) {
    console.log(req.body);
    res.status(200).send({

        message: 'Acción de pruebas en el servidor de NodeJS',

    });
}

//REGISTRO
function saveUser(req, res) {
    var params = req.body;
    var user = new User();
    if (params.name && params.surname &&
        params.nick && params.email && params.password) {

        user.name = params.name;
        user.surname = params.surname;                              //ASIGNAR VALORES AL OBJETO DEL MODELO USUARIO
        user.nick = params.nick;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;

        //CONTROLAR USUARIOS DUPLICADOS

        User.find({
            $or: [
                { email: user.email.toLowerCase() },
                { nick: user.nick.toLowerCase() }
            ]
        }).exec((err, users) => {
            if (err)
                return res.status(500).send({
                    message: 'Error en la petición de usuarios'
                });

            if (users && users.length >= 1) {
                return res.status(200).send({
                    message: 'El usuario que intentas registrar ya existe!!'
                });
            } else {
                bcrypt.hash(params.password, null, null, (err, hash) => {
                    user.password = hash;

                    user.save((err, userStored) => {
                        if (err) res.status(500).send({ message: 'Error al guardar el usuario' });

                        if (userStored) {
                            res.status(200).send({
                                user: userStored
                            });
                        } else {
                            res.status(404).send({
                                message: 'No se ha registrado el usuario'
                            });
                        }
                    });

                });
            }
        });

        //CIFRADO PASSWORD Y GUARDO DATOS


    } else {
        res.status(200).send({
            message: 'Envia todos los campos necesarios!!',

        });
    }

}

//LOGIN
function loginUser(req, res) {
    var params = req.body;

    var email = params.email;
    var password = params.password;

    User.findOne({ email: email }, (err, user) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });

        if (user) {
            bcrypt.compare(password, user.password, (err, check) => {
                if (check) {

                    if (params.gettoken) {
                        //Generar y devolver el token
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });
                    } else {
                        //DEVOLVER DATOS DEL USUARIO
                        user.password = undefined;
                        return res.status(200).send({ user })
                    }


                } else {
                    return res.status(404).send({ message: 'El usuario no se ha podido identificar' });
                }
            });
        } else {
            return res.status(404).send({ message: 'El usuario no se ha podido identificar!!' });
        }
    });

}

//CONSEGUIR DATOS DE UN USUARIO

function getUser(req, res) {
    var userId = req.params.id;

    User.findById(userId, (err, user) => {
        if (!user) return res.status(404).send({ message: "User Not Found." });
        if (err) return res.status(500).send({ message: "Request Error." });

        followThisUser(req.user.sub, userId).then((value) => {
            return res.status(200).send({
                user,
                following: value.following,
                followed: value.followed
            });
        });
    });
}

async function followThisUser(identity_user_id, user_id) {
    var following = await Follow.findOne({ user: identity_user_id, followed: user_id }).exec()
        .then((following) => {
            return following;
        })
        .catch((err) => {
            return handleError(err);
        });
    var followed = await Follow.findOne({ user: user_id, followed: identity_user_id }).exec()
        .then((followed) => {
            return followed;
        })
        .catch((err) => {
            return handleError(err);
        });

    return {
        following: following,
        followed: followed
    };
}

//DEVOLVER UNA LISTA DE USUARIOS PAGINADOS

function getUsers(req, res) {
    var user_id = req.user.sub;

    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 5;

    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
        if (err) return res.status(500).send({ message: "Error en la peticion", err });
        if (!users) return res.status(404).send({ message: "No hay Usuarios" });

        followUserIds(user_id).then((response) => {
            return res.status(200).send({ 
                message: "Resultados",
                 users,
                  users_following: response.following,
                   users_followed: response.followed,
                    total,
                     pages: Math.ceil(total / itemsPerPage) });
        });
    });
}
//FUNCION ASINCRONA PARA MOSTRAR IDS SEGUIMIENTO ENTRE USUARIOS

async function followUserIds(user_id) {

    var following = await Follow.find({ 'user': user_id }).select({ '_id': 0, '__v': 0, 'user': 0 }).exec()
        .then((follows) => {
            return follows;
        })
        .catch((err) => {
            return handleError(err);
        });
    var followed = await Follow.find({ followed: user_id }).select({ '_id': 0, '__v': 0, 'followed': 0 }).exec()
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
    var followed_clean = [];

    followed.forEach((follow) => {
        followed_clean.push(follow.user);
    });
    //console.log(following_clean);
    return { following: following_clean, followed: followed_clean }

}

//CONTABILIZAR SEGUIDORES Y SEGUIDOS MEDIANTE EL USO DE LA ASINCRONIA
function getCounters(req, res) {
    var userId = req.user.sub;
    if (req.params.id) {
        userId = req.params.id;
    }
    getCountFollow(userId).then((value) => {
        return res.status(200).send(value);

    });

}

//FUNCION ASINCRONA QUE DEVOLVERA CONTADORES DE LAS ESTADISTICAS DE LOS USUARIOS
async function getCountFollow(user_id) {
    var following = await Follow.countDocuments({ user: user_id })
        .exec()
        .then((count) => {
            console.log(count);
            return count;
        })
        .catch((err) => { return handleError(err); });

    var followed = await Follow.countDocuments({ followed: user_id })
        .exec()
        .then((count) => {
            return count;
        })
        .catch((err) => { return handleError(err); });


    var publications = await Publication.count({ user: user_id })
        .exec()
        .then((count) => {
            return count;
        })
        .catch((err) => { return handleError(err); });

        var likes = await Likes.count({ user_liked:user_id })
        .exec()
        .then((count) => {
            return count;
        })
        .catch((err) => { return handleError(err); });
    return { following: following, followed: followed, publication: publications, like:likes }

}

//EDICION DATOS DE USUARIO
function updateUser(req, res) {
    var userId = req.params.id;
    var update = req.body;

    //Borrar propiedad password
    delete update.password;

    //Si el ID que llega es distinto al del usuario
    if (userId != req.user.sub) {
        return res.status(500).send({ message: 'No tienes permiso para actualizar los datos del usuario' });
    }

    //Evitar actualización de duplicados
    User.findOne({ 
        $or: [
            { email: update.email.toLowerCase() },
            { nick: update.nick.toLowerCase() }         
        ]
    }).exec((err, users) => {
       
       
            if (users && user._id != userId) return res.status(404).send({ message: 'Los datos ya están en uso' });
                                
        //Si no coinciden los datos buscará ese objeto mediante su ID para su posterior actualización.

        //Devolver datos actualizados
        User.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdated) => {
            if (err) return res.status(500).send({ message: 'Error en la petición' });

            if (!userUpdated) return res.status(404).send({ message: 'No se ha podido actualizar el usuario' });

            return res.status(200).send({user: userUpdated});
        });
    });
}

//SUBIR AVATAR DEL USUARIO

function uploadImage(req, res) {
    var userId = req.params.id;

    if (req.files) {
        var file_path = req.files.image.path;
        console.log(file_path);
        var file_split = file_path.split('\\');
        console.log(file_split);

        var file_name = file_split[2];
        console.log(file_name);

        var ext_split = file_name.split('\.');
        console.log(ext_split);

        var file_ext = ext_split[1];
        console.log(file_ext);

        if (userId != req.user.sub) {
            return removeFilesOfUploads(res, file_path, 'No tienes permiso para actualizar los datos del usuario');
        }

        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif') {
            //Actualizar documento usuario logeado

            User.findByIdAndUpdate(userId, { image: file_name }, { new: true }, (err, userUpdated) => {
                if (err) return res.status(500).send({ message: 'Error en la petición' });

                if (!userUpdated) return res.status(404).send({ message: 'No se ha podido actualizar el usuario' });

                return res.status(200).send({
                    user: userUpdated
                });
            });
        } else {
            return removeFilesOfUploads(res, file_path, 'Extensión no válida');
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
    var path_file = './uploads/users/' + image_file;

    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({ message: 'No existe la imagen' });
        }

    });
}
module.exports = {
    home,
    pruebas,                //EXPORTAR FUNCIONES FUERA DEL FICHERO
    saveUser,
    loginUser,
    getUser,
    getUsers,
    getCounters,
    updateUser,
    uploadImage,
    getImageFile,

}