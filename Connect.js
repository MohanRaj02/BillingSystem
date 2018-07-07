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
  res.send(`SuccessFully Added`)
})

app.listen(8000, () => {
  console.log('Server started!');
});
