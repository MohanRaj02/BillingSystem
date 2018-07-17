//import packages
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const mysql = require('mysql');

const app = express();

var corsOptions = {
  origin: 'http://example.com',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(express.static('public'));
app.use(cors(corsOptions))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const con = mysql.createConnection({
  host:"localhost",user:"root",password:"",database:"billingsystem"
});
con.connect(function(error){
  if(!!error)
    console.log(error);
  else {
    console.log("Connected");
  }
});

app.post('/add', function (req, res) {
  //const name = req.body.name; //data sent from name parameter;
  const body = JSON.stringify(req.body);

  const pid=req.body.pid;
  const pname=req.body.pname;
  const price = req.body.price;
  const qt = req.body.qua;
  const gst = req.body.gst;

  var sql = 'insert into product_details(Product_id,Product_Name,Quantity,Price,Gst)VALUES(?,?,?,?,?)'
  con.query(sql,[pid,pname,qt,price,gst],function(err,result){
             console.log(err);
  });

  res.set('Content-Type', 'text/plain')
  res.send(`Added`)
})

app.post('/newuser',function(req,res){
  const body = JSON.stringify(req.body);

  const un=req.body.un;
  const em=req.body.em;
  const pswd = req.body.pswd;
  const ph = req.body.ph;


  var sql = 'insert into Users(Username,Email,Password,Phone)VALUES(?,?,?,?)'
  con.query(sql,[un,em,pswd,ph],function(err,result){
             if(err)
              res.send(`failed`);
            else {
              res.set('Content-Type', 'text/plain')
              res.send(`success`);
            }
  });

})

app.post('/get',function(req,res){
  con.query("Select * from product_details",function(error,rows,result){
    if(error)
      throw error;
    else {
      //res.send(rows);
      console.log(rows);
    }
  });
})

app.post('/user',function(req,res){
  const body = JSON.stringify(req.body);

  const email = req.body.email;
  const password = req.body.password;
  console.log(email);
  console.log(password);
  var sql = 'select Email,Password from Users where Email = ? and Password =?';
  con.query(sql,[email,password],function(err,result,fields){

      if(result.length==1){
        console.log(result);
        res.send(`loggedin`);
      }
      else{
        res.send(`Check Email/Password`);
      }
  });
  res.set('Content-Type', 'text/plain');
})
app.listen(8000, () => {
  console.log('Server started!');
});
