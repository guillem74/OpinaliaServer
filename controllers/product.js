var mongoose = require('mongoose');
var Product = mongoose.model('Product');
var Rating = mongoose.model('Rating');
var Image = mongoose.model('Image');
var Like = mongoose.model('Like');
var jwt = require('../services/jwt');
var cloudinary = require('cloudinary').v2;
var multer = require('multer');
var path = require('path');
var fs = require('fs');
var Filter = require('bad-words');
var filter = new Filter();
filter.addWords(['gilipollas', 'perra', 'ñordo', 'cacota', 'caca', 'GILIPOLLAS', 'Gilipollas', 'Puta', 'PUTA','puta',
                'anormal','Anormal','Mierda','mierda','Sub']);


//Storage variable, for storin temporal images
var storage = multer.diskStorage({
  // destino del fichero
  destination: function (req, file, cb) {
    cb(null, './temp/')
  },
  // renombrar fichero
  filename: function (req, file, cb) {
    cb(null, req.params.productId + '-'+ Date.now()+ path.extname(file.originalname));
  }
});

exports.uploadImage = function(req, res) {
    var productId=req.params.productId;
    var tokenInfo=req.user;
    var upload = multer({ storage: storage 
    }).array("uploads[]", 12);

    if(tokenInfo.admin){
        upload(req, res, function(err) {
            if(err)
                res.status(500).send({message: `Internal server error: ${err}`})
            else{
                var file=req.files;
                //console.log(file[0].filename);
                cloudinary.uploader.upload(file[0].path, {folder: "opinalia/products"},function(err, result) {
                    if(err)
                        res.status(500).send({message: `Internal server error: ${err}`})
                    else{
                        var newImage = new Image();
                        newImage.src=result.url;
                        newImage.publicId=result.public_id;
                        console.log(result)

                        Product.findOneAndUpdate({_id:productId}, {$addToSet: {images: newImage}},{new: true})
                        .populate({ path: 'ratings.userId' })
                        .exec(function(err, product) {
                            if(err)
                                res.status(500).send({message: `Internal server error: ${err}`})
                            else{
                                console.log(file[0].path)
                                fs.unlink(file[0].path, function(error) {
                                    if (error) {
                                        throw error;
                                    }
                                    res.status(200).json(product)

                                });
                            }
                        })
                    }
                });
            }
        })
    }
}

exports.listAllProducts = function(req, res) {
    Product.find()
    //.populate('ratings.userId', { password:0, admin:false})
    //.select({"ratings":0})/////////////////////////////////////////////////////////
    //.select({'ratings.userId._id':0})
    .exec(function(err, products) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else
            res.status(200).json(products);
    });
};

exports.getNew = function(req, res) {
    var limit = req.params.limit;

    Product.find()
    //.populate({ path: 'ratings.userId' })
    .select({"ratings":0})
    .sort({date:-1})
    .limit(Number(limit))
    .exec(function(err, products) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else
            res.status(200).json(products);
    });
};

exports.findByName = function(req, res) { 
    nameToSearch=req.params.productName;

    Product.find({name:{ "$regex": nameToSearch, "$options": "i" }})
    //.populate({ path: 'ratings.userId' })
    .select({"ratings":0})
    .exec(function(err, products) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else
            res.status(200).json(products);
    });
};

exports.SearchAny = function(req, res){
    word = req.params.word;

    Product.find({$or:[
        {name:{ "$regex": word, "$options": "i" }},
        {company:{ "$regex": word, "$options": "i" }}
        ]})
    //.populate({ path: 'ratings.userId' })
    .select({"ratings":0})
    .exec(function(err, products) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else
            res.status(200).json(products);
    });
};

exports.bestProducts = function(req, res) {
    Product.find()
    .sort({avgRate:-1})
    //.populate({ path: 'ratings.userId' })
    .select({"ratings":0})
    .exec(function(err, products) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else
            res.status(200).json(products);
    });
};

exports.best7Products = function(req, res) {
    Product.find()
    .sort({avgRate:-1})
    .limit(7)
    //.populate({ path: 'ratings.userId' })
    .select({"ratings":0})
    .exec(function(err, products) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else
            res.status(200).json(products);
    });
};


exports.best7ByCategory = function(req, res) {
    Product.find({category:req.params.productCategory})
    .sort({avgRate:-1})
    .limit(7)
    //.populate({ path: 'ratings.userId' })
    .select({"ratings":0})
    .exec(function(err, products) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else
            res.status(200).json(products);
    });
};

exports.bestByCategory = function(req, res) {
    Product.find({category:req.params.productCategory})
    .sort({avgRate:-1})
    //.populate({ path: 'ratings.userId' })
    .select({"ratings":0})
    .exec(function(err, products) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else
            res.status(200).json(products);
    });
};

exports.bestByCompany = function(req, res) {
    Product.find({company:req.params.productCompany})
    .sort({avgRate:-1})
    //.populate({ path: 'ratings.userId' })
    .select({"ratings":0})
    .exec(function(err, products) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else
            res.status(200).json(products);
    });
};

exports.findByCategory = function(req, res) {
    Product.find({category:req.params.productCategory})
    //.populate({ path: 'ratings.userId' })
    .select({"ratings":0})
    .exec(function(err, product) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else
            res.status(200).json(product);
    });
};

exports.findByCompany = function(req, res) {
    Product.find({company:req.params.productCompany})
    //.populate({ path: 'ratings.userId' })
    .select({"ratings":0})
    .exec(function(err, product) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else
            res.status(200).json(product);
    });
};

exports.findById = function(req, res) {
    Product.findOne({_id:req.params.productId})
    .populate('ratings.userId', { password:0, admin:false})
    .exec(function(err, product) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else
            res.status(200).json(product);
    });
};

exports.findInCategory = function(req, res) {
    if (req.params.category == 'Todos' && req.params.text == '0'){
        Product.find()
        //.populate({ path: 'ratings.userId' })
        .select({"ratings":0})
        .exec(function(err, products) {
            if (err)
                res.status(500).send({message: `Internal server error: ${err}`});
            res.status(200).json(products);
        });
    } else if (req.params.category === 'Todos'){
        Product.find({name:req.params.text}, function(err, product) {
            if (product.length === 0){
                Product.find({company:req.params.text})
                //.populate({ path: 'ratings.userId' })
                .select({"ratings":0})
                .exec(function(err, product) {
                    if (product.length === 0) {
                        res.status(404).send({message: `Internal server error: ${err}`});
                    } else {
                        res.status(200).json(product);
                    }
                });
            } else {
                res.status(200).json(product);
            }
        });
    } else if (req.params.text === '0') {
        Product.find({category:req.params.category})
        //.populate({ path: 'ratings.userId' })
        .select({"ratings":0})
        .exec(function(err, product) {
            if (product.length === 0) {
                res.status(404).send({message: `Internal server error: ${err}`});
            } else {
                res.status(200).json(product);
            }
        });
    } else {
        Product.find({name: req.params.text, category: req.params.category})
        //.populate({ path: 'ratings.userId' })
        .select({"ratings":0})
        .exec(function (err, product) {
            if (product.length === 0) {
                Product.find({company: req.params.text, category: req.params.category}, function (err, product) {
                    if (product.length === 0) {
                        res.status(404).send({message: `Internal server error: ${err}`});
                    } else {
                        res.status(200).json(product);
                    }
                });
            } else {
                res.status(200).json(product);
            }
        });
    }
};

exports.findInCompany = function(req, res) {
    if (req.params.company === 'Todas' && req.params.text === '0'){
        Product.find()
        //.populate({ path: 'ratings.userId' })
        .select({"ratings":0})
        .exec(function(err, products) {
            if (err)
                res.status(500).send({message: `Internal server error: ${err}`});
            res.status(200).json(products);
        });
    } else if (req.params.company === 'Todas'){
        Product.find({name:req.params.text}, function(err, product) {
            if (product.length === 0){
                Product.find({company:req.params.text})
                //.populate({ path: 'ratings.userId' })
                .select({"ratings":0})
                .exec(function(err, product) {
                    if (product.length === 0) {
                        res.status(500).send({message: `Internal server error: ${err}`});
                    } else {
                        res.status(200).json(product);
                    }
                });
            } else {
                res.status(200).json(product);
            }
        });
    } else if (req.params.text === '0') {
        Product.find({company:req.params.company})
        //.populate({ path: 'ratings.userId' })
        .select({"ratings":0})
        .exec(function(err, product) {
            if (product.length === 0) {
                res.status(500).send({message: `Internal server error: ${err}`});
            } else {
                res.status(200).json(product);
            }
        });
    } else {
        Product.find({name: req.params.text, company: req.params.company})
        //.populate({ path: 'ratings.userId' })
        .select({"ratings":0})
        .exec(function (err, product) {
            if (product.length === 0) {
                res.status(500).send({message: `Internal server error: ${err}`});
            } else {
                res.status(200).json(product);
            }
        });
    }
};

exports.addProduct= function(req, res) {
    var newProduct = new Product(req.body);
    var tokenInfo=req.user;

    if (tokenInfo.admin){
        newProduct.images.src='http://res.cloudinary.com/grup04ea/image/upload/v1514675870/opinalia/products/ry0damkuxgrmext71l35.png';
        newProduct.images.publicId='opinalia/products/ry0damkuxgrmext71l35.png';
        newProduct.save(function(err, product) {
            if (err)
                res.status(500).send({message: `Internal server error: ${err}`});
            else
                res.status(200).json(product);
        });
    }
    else
        res.status(403).send({message: 'No privileges'});
};


exports.updateProduct = function(req, res) {
    var tokenInfo=req.user;
    var update=req.body;

    for (var f in update) {

        if(!update[f]){
            if(!update.avgRate==0)
                    delete update[f]
        }
    }

    if(tokenInfo.admin){
        Product.findOneAndUpdate({_id:req.params.productId}, update, {new: true})
        .populate('ratings.userId', { password:0, admin:false})
        .exec(function(err, product) {
            if (err)
                res.status(500).send({message: `Internal server error: ${err}`});
            res.status(200).json(product);
        });
    }
    else
        res.status(403).send({message: 'No privileges'});
};

exports.addSpec = function(req, res) {
    var spec=req.body
    var productId=req.params.productId;
    tokenInfo=req.user;
    console.log(spec)

    if (!tokenInfo.admin)
        res.status(403).send({message: 'No privileges'});

    else{
        Product.findOneAndUpdate({_id:productId}, {$addToSet: {specifications: spec}}, {new: true}, function(err, product) {
            if (err)
                res.status(500).send({message: `Internal server error: ${err}`});

            else{
                res.status(200).json(product);
            }
        })
    }
};

exports.addRating = function(req, res) {
    var rating=req.body;
    var productId=req.params.productId;
    userId=req.user.sub;
    rating.userId=userId;

    Product.findOne({_id:req.params.productId, 'ratings.userId':rating.userId})
    .exec(function(err, product) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});

        else if (!product){
            rating.title = filter.clean(rating.title);
            rating.comment = filter.clean(rating.comment);
            Product.findOneAndUpdate({_id:productId}, {$addToSet: {ratings: rating}}, {new: true}, function(err, product) {
                if (err)
                    res.status(500).send({message: `Internal server error: ${err}`});

                else{

                    this.getAvgRate(product, function(prod){
                        delete prod._id;
                        Product.findOneAndUpdate({_id:prod._id}, prod, {new: true})
                        .populate('ratings.userId', { password:0, admin:false})
                        .exec(function(err, product) {
                            if (err)
                                res.status(500).send({message: `Internal server error: ${err}`});
                            else
                                res.status(200).json(product);
                        });
                    });
                }
            })
        }
        else{
            console.log(product)
           res.status(409).send({message: `Already rated`});
            //res.status(200).json(product);
        }
    });
};

exports.deleteRating = function(req, res) {
    var rating=req.body
    var userId=rating.UserId;
    var productId=req.params.productId;
    var tokenInfo=req.user;

    if(userId=tokenInfo.sub || tokenInfo.admin){
        Product.findOneAndUpdate({_id:productId}, {$pull: {ratings: rating}}, {new: true}, function(err, product) {
            if (err)
                res.status(500).send({message: `Internal server error: ${err}`});
            else{
                this.getAvgRate(product, function(prod){
                    Product.findOneAndUpdate({_id:prod._id}, prod, {new: true})
                    .populate('ratings.userId', { password:0, admin:false})
                    .exec(function(err, product) {
                        if (err)
                            res.status(500).send({message: `Internal server error: ${err}`});
                        else
                            res.status(200).json(product);
                    });
                });
            }
        });
    }
    else
        res.status(403).send({message: 'No privileges'});
};

exports.likeRating = function(req,res){
    var productId=req.params.productId;
    var ratingId=req.params.ratingId;
    var userId=req.user.sub;
    var like={};
    like.userId=userId;

    Product.findOne({_id:req.params.productId, 'ratings._id':ratingId},
       {'ratings.$.likes.userId':userId})
    .populate('ratings.userId', { password:0, admin:false})
    .exec(function(err, product) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else{

            var likes=product.ratings[0].likes;
            var dislikes=product.ratings[0].dislikes
            var liked=false;
            var disliked=false;
            var inc=-1;

            for (var i=0; i<likes.length; i++){
                if (likes[i].userId==like.userId){
                    i=likes.length;
                    liked=true;
                }
            }

            if(!liked){
                for (var i=0; i<dislikes.length; i++){
                    if (dislikes[i].userId==like.userId){
                        i=dislikes.length;
                        disliked=true;
                    }
                }

                if(product.ratings[0].numDislike==0 || !disliked){
                    inc=0
                }
            }

            if(!liked){
                Product.findOneAndUpdate({_id:productId,'ratings._id':ratingId},
                    {
                        $addToSet: {'ratings.$.likes': like},
                        $pull: {'ratings.$.dislikes': like},
                        $inc: {
                            'ratings.$.numLike': 1,
                            'ratings.$.numDislike': inc
                        }
                    },
                    {new: true}, function(err, product) {

                        if (err)
                            res.status(500).send({message: `Internal server error: ${err}`});

                        else{

                            res.status(200).send(product);

                        }
                    })
                    //res.status(200).send(product);
            }
           //res.status(409).send({message: `Already reported`});
           else{
            res.status(409).send({message: `Already liked`});
            //res.status(409).send(likes);
            }
        }
    });
}

exports.dislikeRating = function(req,res){
    var productId=req.params.productId;
    var ratingId=req.params.ratingId;
    var userId=req.user.sub;
    var like={};
    like.userId=userId;

    Product.findOne({_id:req.params.productId, 'ratings._id':ratingId},
       {'ratings.$.dislikes.userId':userId})
    .populate('ratings.userId', { password:0, admin:false})
    .exec(function(err, product) {
        console.log(product)
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        //res.status(500).send(product.ratings[0]);
        else{

            var likes=product.ratings[0].likes;
            var dislikes=product.ratings[0].dislikes
            var liked=false;
            var disliked=false;
            var inc=-1;

            for (var i=0; i<dislikes.length; i++){
                if (dislikes[i].userId==like.userId){
                    i=dislikes.length;
                    disliked=true;
                }
            }
            console.log(disliked)
            if(!disliked){

                for (var i=0; i<likes.length; i++){
                    if (likes[i].userId==like.userId){
                        i=likes.length;
                        liked=true;
                    }
                }

                if(product.ratings[0].numLike==0 || !liked){
                    inc=0
                }
            }

            if(!disliked){
                Product.findOneAndUpdate({_id:productId,'ratings._id':ratingId},
                    {
                        $addToSet: {'ratings.$.dislikes': like},
                        $pull: {'ratings.$.likes': like},
                        $inc: {
                            'ratings.$.numLike': inc,
                            'ratings.$.numDislike': 1
                        }
                    },
                    {new: true}, function(err, product) {

                        if (err)
                            res.status(500).send({message: `Internal server error: ${err}`}); 

                        else{           

                            res.status(200).send(product);

                        }
                    })
            }
           //res.status(409).send({message: `Already reported`});
           else{
            res.status(409).send({message: `Already disliked`});
            }
        }
    });
}

exports.reportRating = function(req,res){
    var productId=req.params.productId;
    var ratingId=req.params.ratingId;
    var report=req.body;
    var reportUser=req.user.sub;
    report.userId=reportUser;
    var rating={};
    rating._id=ratingId;
    console.log(rating)

    Product.findOne({_id:req.params.productId, 'ratings._id':ratingId}, 
       {'ratings.$.reports.userId':report.userId})
    .populate('ratings.userId', { password:0, admin:false})
    .exec(function(err, product) {
        //console.log(product)
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        //res.status(500).send(rating);
        else{
            if(product){
                var rating=product.ratings[0];
                if(rating.numReport==4){
                    var rate={};
                    rate._id=ratingId;
                    console.log("hola")
                    Product.findOneAndUpdate({_id:productId}, {$pull: {ratings: rate}}, {new: true}, function(err, product) {
                        if (err)
                            res.status(500).send({message: `Internal server error: ${err}`});
                        else{
                            this.getAvgRate(product, function(prod){
                                Product.findOneAndUpdate({_id:prod._id}, prod, {new: true})
                                .populate('ratings.userId', { password:0, admin:false})
                                .exec(function(err, product) {
                                    if (err)
                                        res.status(500).send({message: `Internal server error: ${err}`});
                                    else
                                     res.status(200).json(product);
                                });
                            });
                        }
                    });
                }
                else{
                    var reports=product.ratings[0].reports;
                    var reported=false;

                    for (var i=0; i<reports.length; i++){
                        if (reports[i].userId==report.userId){
                            i=reports.length;
                            reported=true;
                        }
                    }
                    if(!reported){
                        Product.findOneAndUpdate({_id:productId,'ratings._id':ratingId}, 
                            {$addToSet: {'ratings.$.reports': report},$inc: {'ratings.$.numReport': 1}}, 
                            {new: true}, function(err, product) {

                                if (err)
                                    res.status(500).send({message: `Internal server error: ${err}`}); 

                                else{           
                                    res.status(200).send(product);

                                }
                            })
                    }
                   //res.status(409).send({message: `Already reported`});
                   else{
                    res.status(409).send({message: `Already reported`});
                    }
                }
            }else
                res.status(404).send({message: `Not found`});
        }
    });
}

exports.getRatingsBest = function(req, res) {
    Product.findOne({_id:req.params.productId})
    //.limit(2)
    .populate('ratings.userId', { password:0, admin:false})
    .exec(function(err, product) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        //sortJsonArray(product.ratings, 'rate', 'des')
        product.ratings.sort(function(a, b){return b.rate-a.rate});
        res.status(200).json(product.ratings);
    });
};

exports.getRatingsWorst = function(req, res) {
    Product.findOne({_id:req.params.productId})
    //.limit(7)
    .populate('ratings.userId', { password:0, admin:false})
    .exec(function(err, product) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else{
            //sortJsonArray(product.ratings, 'rate', 'asc')
            product.ratings.sort(function(a, b){return a.rate-b.rate});
            res.status(200).json(product.ratings);
        }
    });
};

exports.getRatingsOld = function(req, res) {
    Product.findOne({_id:req.params.productId})
    //.limit(2)
    .populate('ratings.userId', { password:0, admin:false})
    .exec(function(err, product) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        //sortJsonArray(product.ratings, 'rate', 'des')
        product.ratings.sort(function(a, b){return a.date-b.date});
        res.status(200).json(product.ratings);
    });
};

exports.getRatingsNew = function(req, res) {
    Product.findOne({_id:req.params.productId})
    //.limit(7)
    .populate('ratings.userId', { password:0, admin:false})
    .exec(function(err, product) {
        if (err)
            res.status(500).send({message: `Internal server error: ${err}`});
        else{
            //sortJsonArray(product.ratings, 'rate', 'asc')
            product.ratings.sort(function(a, b){return b.date-a.date});
            res.status(200).json(product.ratings);
        }
    });
};

exports.deleteProduct = function(req, res) {
    var tokenInfo=req.user;

    if(tokenInfo.admin){
        Product.findByIdAndRemove(req.params.productId, function(err, product) {
            if (err)
                res.status(500).send({message: `Internal server error: ${err}`});
            else
                res.status(200).json({ message: 'Product successfully deleted' });
        });
    }
    else 
        res.status(403).send({message: 'No privileges'});
};

//Other functions/////

getAvgRate = function(product, callback){

    var total = 0;
    var ratings=[]
    ratings=product.ratings;

    if(ratings.length>0){
        for(var i = 0; i < ratings.length; i++) {
            total += ratings[i].rate;
        }
        product.avgRate = (total / ratings.length).toFixed(1);
    } 

    else{
        console.log("product", product)
        product.avgRate = 0;
    }
    //console.log("total: "+total)
    //console.log (product)
    //product.avgRate=(product.totalRate/product.numRates).toFixed(1);
    callback(product)
    //res.status(200).json(product);
}

exports.delAllUserRates = function(userId, products, callback){
    var error;
   for(var i = 0; i < products.length; i++) {
        var productId=products[i]._id;
        var ratings=products[i].ratings;

        for(var j = 0; j < ratings.length; j++) {
            var rating;

            if(ratings[j].userId==userId){
                rating=ratings[j];
                j=ratings.length;
            }
        }

        Product.findOneAndUpdate({_id:productId}, {$pull: {ratings: rating}}, {new: true}, function(err, product) {
            if (err){
                //res.status(500).send({message: `Internal server error: ${err}`});
                console.log("error", err)
            }
            else{
                this.getAvgRate(product, function(prod){
                    Product.findOneAndUpdate({_id:prod._id}, prod, {new: true})
                    .populate({ path: 'ratings.userId' })
                    .exec(function(err, product) {
                        if (err)
                            console.log("error", err)
                        /*if (err)
                            res.status(500).send({message: `Internal server error: ${err}`});
                        res.status(200).json(product);*/
                    });
                });
            }
        });
   }

   callback();
}
