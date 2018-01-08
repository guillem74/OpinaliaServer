var mongoose = require('mongoose');
var User = mongoose.model('User');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var cloudinary = require('cloudinary').v2;
var multer = require('multer');
var path = require('path');
var fs = require('fs');
var nodemailer = require("nodemailer");


//Storage variable, for storin temporal images
var storage = multer.diskStorage({
  // destino del fichero
  destination: function (req, file, cb) {
    cb(null, './temp/')
  },
  // renombrar fichero
  filename: function (req, file, cb) {
    cb(null, req.params.userId + '-'+ Date.now()+ path.extname(file.originalname));
  }
});

//load smtp user
var smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    secure: false,
    tls: {
        rejectUnauthorized: false
    },
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

exports.listAllUsers = function(req, res) {
    var tokenInfo=req.user;

    if(tokenInfo.admin){
        User.find({}, function(err, users) {
            if (err)
                res.status(500).send({message: `Internal server error: ${err}`});
            else
                res.status(200).json(users);
        });
    }

    else
        res.status(403).json({message: 'No privileges'});

};

exports.uploadImage = function(req, res) {
    var tokenInfo=req.user;
    var userId=req.params.userId;
    var upload = multer({ storage: storage
    }).array("uploads[]", 12);

    if(userId != tokenInfo.sub && !tokenInfo.admin){
        res.status(403).send({message: 'No privileges'});
    }
    else{
        upload(req, res, function(err) {
            if(err)
                res.status(500).send({message: `Internal server error: ${err}`})
            else{
                var file=req.files;
                //console.log(file[0].filename);
                cloudinary.uploader.upload(file[0].path, {folder: "opinalia/users"},function(err, result) {
                    if(err)
                        res.status(500).send({message: `Internal server error: ${err}`})
                    else{
                        var update = {};
                        update.profileImage=result.url;
                        update.imagePublicId=result.public_id;
                        console.log(result);

                        Product.findOneAndUpdate({_id:userId}, update,{new: true})
                        .exec(function(err, user) {
                            if(err)
                                res.status(500).send({message: `Internal server error: ${err}`})
                            else{
                                console.log(file[0].path)
                                fs.unlink(file[0].path, function(error) {
                                    if (error) {
                                        throw error;
                                    }
                                    res.status(200).json(user)

                                });
                            }
                        })
                    }
                });
            }
        })
    }
};

exports.findByEmail = function(req, res) {
    User.find({email:req.params.email}, function(err, user) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else
            res.status(200).json(user);
    });
};

exports.findByName = function(req, res) {
    User.find({name:req.params.name}, function(err, user) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else
            res.status(200).json(user);
    });
};

exports.registerUser = function(req, res) {
    bcrypt.hash(req.body.password, null, null, function (err, hash) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else{
            var newUser = new User(req.body);
            newUser.password = hash;

            delete newUser.admin;
            newUser.profileImage="http://res.cloudinary.com/grup04ea/image/upload/v1515145634/opinalia/users/default.png";
            newUser.imagePublicId="opinalia/users/default.png";

            newUser.save(function (err, user) {
                if (err)
                    res.status(500).send({message: `Internal server error: ${err}`});
                else{
                    user.token=jwt.createToken(user);
                    res.status(200).json(user);
                }
            });
        }
    });
};

exports.loginUser=function(req,res){
    var params = req.body;
    var email = params.email;
    var password = params.password;

    User.findOne({email: email}, function(err, user) {
        if(err){
            res.status(500).send({message: 'Internal server error'});
        }else{
            if(user){
                bcrypt.compare(password,user.password, function(err, check){
                    if(check) {
                        user.token=jwt.createToken(user);
                        res.status(200).json(user);

                    }else{
                        res.status(401).send({message: 'Incorrect credentials'});
                    }
                })
            }else{
                res.status(404).send({message: 'User not found'});
            }
        }
    });
};

exports.loginUserFB=function(req,res){
    var params = req.body;
    var email = params.email;

    User.findOne({email: email}, function(err, user) {
        if(err){
            res.status(500).send({message: 'Internal server error'});
        }else{
            if(user){
                console.log(user);
                user.token=jwt.createToken(user);
                res.status(200).json(user);

            }else{
                var newUser = new User(req.body);
                console.log(newUser);
                newUser.save(function (err, user) {
                    if (err) {
                        console.log('error');
                        res.status(500).send({message: `Internal server error: ${err}`});
                    }
                    else{
                        user.token=jwt.createToken(user);
                        res.status(200).json(user);
                    }
                });
            }
        }
    });

};

exports.updateUser = function(req, res) {
    var userId = req.params.userId;
    var update = req.body;
    var tokenInfo=req.user;

    if(userId != tokenInfo.sub && !tokenInfo.admin){
        res.status(403).send({message: 'No privileges'});
    }
    else{
        if(!tokenInfo.admin)
            delete update.admin;

        delete update.profileImage;
        delete update.imagePublicId;

        if (req.body.password)
            bcrypt.hash(req.body.password, null, null, function (err, hash) {
                if (err)
                    res.status(500).send({message: `Internal server error: ${err}`});
                else{
                    var update = req.body;
                    update.password=hash;

                    User.findByIdAndUpdate(userId, update, {new: true}, function(err, user) {
                        if (err)
                            res.status(500).send({message: `Internal server error: ${err}`});
                        else
                            res.status(200).json(user);
                    });

                }
            });

        else{
            var update = req.body;

            User.findByIdAndUpdate(userId, update, {new: true}, function(err, user) {
                if (err)
                    res.status(500).send({message: `Internal server error: ${err}`});
                else
                    res.status(200).json(user);
            });

        }
    }
};

exports.deleteUser = function(req, res) {
    var userId = req.params.userId;
    var tokenInfo=req.user;


   if (userId != tokenInfo.sub && !tokenInfo.admin){
        res.status(403).send({message: 'No privileges'});
    }
    
    User.findByIdAndRemove(userId, function(err, user) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else
            res.status(200).json({ message: 'User successfully deleted' });
    });
    

};

exports.postContact = function(req, res) {
    req.assert('name', 'Name cannot be blank').notEmpty();
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('message', 'Message cannot be blank').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        res.status(400).send({message: errors});
    }else {
        var from = req.body.email;
        var name = req.body.name;
        var body = req.body.message;
        var to = 'ea.aleixguillemgurkeemikel@gmail.com';
        var subject = 'Contact Form | Opinalia (' + name + ')';

        var mailOptions = {
            to: to,
            from: from,
            subject: subject,
            text: body
        };

        smtpTransport.sendMail(mailOptions, function (err, response) {
            if (err) {
                res.status(500).send({message: `Internal server error: ${err}`});
            } else {
                res.status(200).json({message: "Message sent: " + response.message});
            }
        });
    }
};

