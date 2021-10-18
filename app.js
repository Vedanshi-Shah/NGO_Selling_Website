const express = require("express");
const bodyParser = require("body-parser");
const multer = require('multer');
const fs=require("fs");
require('dotenv').config();
const mongoose=require("mongoose");
const app = express();
const cloudinary=require('cloudinary').v2;
mongoose.connect("mongodb://localhost:27017/ProductsDB", {useNewUrlParser: true});
app.set('view engine', 'ejs');
// app.use(fileupload({
//   useTempFiles: true
// }));
if (!fs.existsSync("./uploads")) {
    fs.mkdirSync("./uploads");
}
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

var upload = multer({ storage: storage });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
const productSchema={
  prod_name: String,
  sell_name: String,
  prod_img: String,
  cost: Number,
  des: String,
  contact_numb: String,
  email_id: String,
  prod_id: String
};
const Product=mongoose.model('product',productSchema);

app.use(express.static(__dirname+"/public"));
app.use("/uploads", express.static("uploads"));
cloudinary.config({
  cloud_name: process.env.CNAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SEC,
  secure: true
});

// async function uploadToCloudinary(locaFilePath) {
//
//     // locaFilePath: path of image which was just
//     // uploaded to "uploads" folder
//
//     var mainFolderName = "main";
//     // filePathOnCloudinary: path of image we want
//     // to set when it is uploaded to cloudinary
//     var filePathOnCloudinary =
//         mainFolderName + "/" + locaFilePath;
//
//     return cloudinary.uploader.upload(locaFilePath, { public_id: filePathOnCloudinary }).then((result) => {
//
//             // Image has been successfully uploaded on
//             // cloudinary So we dont need local image
//             // file anymore
//             // Remove file from local uploads folder
//             fs.unlinkSync(locaFilePath);
//
//             return {
//                 message: "Success",
//                 url: result.url,
//             };
//         })
//         .catch((error) => {
//
//             // Remove file from local uploads folder
//             fs.unlinkSync(locaFilePath);
//             return { message: "Fail" };
//         });
// };

app.get("/",function(req,res){
  res.render("index");

});

app.get("/admin_login",function(req,res){
  res.render("admin_login");
});

app.post("/logindetails",function(req,res){
  if(req.body.loginusername===process.env.USER_NAME && req.body.loginpassword===process.env.PASSWORD){
    res.redirect("/admin_action");
  }
  else{
    res.redirect("/admin_login");
  }

});

app.get("/admin_action",function(req,res){
  res.render("admin_action");
});

app.get("/addproduct",function(req,res){
  res.render("add_product");
});

app.post("/product_details",upload.single("product_image"),async (req, res, next) =>{
  var localFilePath = req.file.path;
  // var result = await uploadToCloudinary(locaFilePath);
  // const file=req.files.product_image;
  var iurl;
  cloudinary.uploader.upload(localFilePath,
    function(error, result) {
      if(!error){
        // iurl=result.url;
        const prod=new Product({
          prod_name: req.body.product_name,
          sell_name: req.body.seller_name,
          prod_img: result.url,
          cost: req.body.cost,
          des: req.body.description,
          contact_numb: req.body.contact_numb,
          email_id: req.body.contact_email,
          prod_id: req.body.product_id
        });
        prod.save();
      }
    });
  // console.log(result);
  // prod_name: String,
  // sell_name: String,
  // prod_img: String,
  // cost: Number,
  // des: String,
  // contact_numb: Number,
  // email_id: String,
  // prod_id: String


  // console.log(req.body);
  return res.redirect("/");
});

app.get("/removeproduct",function(req,res){
  res.render("remove_product");
});

app.post("/product_delete",function(req,res){
  var pname=req.body.product_name;
  var pid=req.body.product_id;
  Product.find({prod_name:req.body.product_name,prod_id:req.body.product_id},function(err,found){
      if(found.length!==0){
        Product.findByIdAndRemove(found[0]._id,function(err){
          if(err){
            console.log(err);
          }
        });
      }
    });
  res.redirect("/");
});

app.get("/marketplace",function(req,res){
  Product.find({},function(err,foundProducts){
    if(foundProducts.length===0){
      res.render("no_products");
    }
    else{
      res.render("marketplace",{display_prod: foundProducts});
    }
    // console.log(foundProducts);
  });
});

app.post("/detailed_prod",function(req,res){
  var id=req.body.viewed_prod;
  Product.findById(id, function (err, docs) {
    if (err){
        console.log(err);
    }
    else{
        // console.log("Result : ", docs);
        res.render("product_detail",{Product_Name: docs.prod_name,image_url: docs.prod_img,Seller_Name: docs.sell_name,cost: docs.cost, contact_numb: docs.contact_numb, email_contact: docs.email_id, Desc: docs.des});
    }
  // console.log(req.body.viewed_prod);
});
});
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
