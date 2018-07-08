const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const mysql = require('mysql');

const app = express();

app.use(express.static('public'));
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

  var sql = 'INSERT INTO product_details(Product_id,Product_Name,Quantity,Price,Gst)VALUES(?,?,?,?,?)'
  con.query(sql,[pid,pname,qt,price,gst],function(err,result){
             console.log(err);
  });

  res.set('Content-Type', 'text/plain')
  res.send(`Added`)
})

app.post('/newuser',function(req,res){
  const body = JSON.stringify(req.body);

  const un = req.body.un;
  const em = req.body.em;
  const pswd = req.body.pswd;
  const ph = req.body.ph;

  var sql = 'insert into Users(Username,Email,Password,Phone)VALUES(?,?,?,?)'
  con.query(sql,[un,em,pswd,ph],function(err,result){
             if(err){
               console.log(err);
              res.send(`failed`);
            }
            else {
              res.set('Content-Type', 'text/plain');
              res.send(`success`);
            }
  });

})

app.post('/get',function(req,res){
  con.query("Select * from product_details",function(error,rows,result){
    if(error)
      throw error;
    else {
      res.set('Content-Type', 'text/plain');
      res.send(rows);
      //console.log(rows);
    }
  });
})

app.post('/user',function(req,res){
  const body = JSON.stringify(req.body);

  const email = req.body.email;
  const password = req.body.password;

  console.log(email);
  console.log(password);
  var sql = 'select Userid,Email,Password from Users where Email = ? and Password =?';
  con.query(sql,[email,password],function(err,result,fields){

      if(result.length==1){
        //req.session.id = email;
        console.log(result[0].Userid);
        //console.log(req.session.id);
        console.log(result);
        res.set('400').send(String(result[0].Userid));
      }
      else{
        res.send(`Check Email/Password`);
      }
  });
  res.set('Content-Type', 'text/plain');
})

app.get('/viewbill', function(req, res){

  const bno = req.query.bno;
  const uid = req.query.uid;

  var sql = "SELECT product_details.Product_id AS pid, product_details.Product_Name AS name, product_details.Price AS price, product_details.Gst AS gst, billhistory.Quantity AS quantity, billhistory.Date AS date, billhistory.Bill_no AS bnum FROM billhistory INNER JOIN product_details ON product_details.Product_id = billhistory.Product_Id WHERE billhistory.Bill_no = ? AND billhistory.User_Id = ?";
  con.query(sql, [bno, uid], function(err, result){
    console.log(uid + ' ' + bno);
      if(result.length > 0) {
        generatePDF(result[0], res);
      }
      else {
        res.send('Invalid Bill');
      }
  });
});

app.post('/save', function(req, res){

  const Userid = req.body.uid;
  const pid = req.body.pid;
  const quantity = req.body.quantity;

  var sql = "SELECT * FROM product_details WHERE Product_id = ?";
  con.query(sql, [pid], function(err,result){
    console.log(result[0].Quantity+' '+quantity);
      if(result[0].Quantity < quantity) {
        var json = {};
        json['status'] = 'failed';
        json['message'] = 'Stock Available ' + result[0].Quantity;
        res.send(JSON.stringify(json));
      }
      else {
        insertBill(Userid, pid, quantity, result[0].Price, res);
        //res.send(JSON.stringify(json));
      }

  });

});

app.post('/Bill',function(req,res){
    const body = JSON.stringify(req.body);
    const Userid = req.body.uid;
    console.log(body);
    var sql = "SELECT Bill_no,Date from billhistory WHERE User_Id =?";
    con.query(sql,[Userid],function(err,rows,result){
        if(err)
          console.log(err);
        else{
          res.set('Content-Type', 'text/plain');
          res.send(rows);
        }
    })
});

app.listen(8000, () => {
  console.log('Server started!');
});

function insertBill(uid, pid, quantity, price, response) {

  var dateTime = require('node-datetime');
  var dt = dateTime.create();
  var formatted = dt.format('Y-m-d H:M:S');

  var bno = dt.format('dmYHMS') + String(pid);
  var amount = price * quantity;

  var sql = "INSERT INTO billhistory (User_Id,Product_Id,Bill_no,Quantity,Date,Amount) VALUES (?, ?, ?, ?, ?, ?)"

  con.query(sql, [uid, pid, bno, quantity, formatted, amount], function(err, rows, result) {
      if(err) {
          console.log(err);
      }
      else {
        con.query('UPDATE product_details SET Quantity = Quantity - ? WHERE Product_id = ?', [quantity, pid], function(err, result){
          if(err){
            console.log(err);
          }
          else {
            var json = {};
            json['status'] = 'success';
            json['message'] = bno;
            response.send(JSON.stringify(json));
          }
        });
      }
  });

}

var fs = require('fs');

function generatePDF(data, response) {

    data.total = Number((data.price * data.quantity) * (data.gst / 100)) + Number(data.price * data.quantity);

    var pdf = require('dynamic-html-pdf');
    var html = fs.readFileSync('Public/Billing.html', 'utf8');

    var options = {
        format: "A4",
        orientation: "portrait",
        border: "10mm"
    };

    var document = {
        type: 'buffer',     // 'file' or 'buffer'
        template: html,
        context: {
            data: data
        },
        path: "./output.pdf"    // it is not required if type is buffer
    };

    pdf.create(document, options)
        .then(res => {
            response.setHeader('Content-Type', 'application/pdf');
            //response.setHeader('Content-Disposition', 'attachment; filename=quote.pdf');
            response.set(400).send(res);
            //console.log(res)
        })
        .catch(error => {
            console.error(error)
        });
}
