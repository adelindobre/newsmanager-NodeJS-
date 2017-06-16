var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cons = require('consolidate');
// var formidable = require('formidable');
// var util = require('util');

var routes = require('./routes');
var users = require('./routes/user');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', cons.swig);
app.set('view engine', 'html');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

app.get('/users', users.list);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var Datastore = require('nedb'),
	db = new Datastore();

db.loadDatabase(function(err){
	console.log(err);	
});

var Transstore  = require('nedb'),
	tdb = new Transstore();

tdb.loadDatabase(function(err){
	console.log(err);
});

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

var returnJSONResults = function(baseName, queryName) {
     var XMLPath = "G:\\IOC\\tema2\\newsmanager\\cifre_difuzare.xml";
     var rawJSON = loadXMLDoc(XMLPath);
    function loadXMLDoc(filePath) {
        var fs = require('fs');
        var xml2js = require('xml2js');
        var json;
        try {
            var fileData = fs.readFileSync(filePath, 'ascii');

            var parser = new xml2js.Parser();
            parser.parseString(fileData.substring(0, fileData.length), function (err, result) {
            json = JSON.stringify(result);
            var obj = JSON.parse(json);
            for(var key in obj){
           		if(obj.hasOwnProperty(key)){
       				var newobj = obj[key];
       				var k = 0;
       				for(var key2 in newobj){
						if(newobj.hasOwnProperty(key2)){
							k++;
							if(k == 2){
								var pub = newobj[key2][0]['publicatie'];
								var len = pub.length;
								//console.log(pub[0]['nume'][0]);
								for(var i = 0; i < len; i++){
									var elem = {  
									    publicatie: pub[i]['nume'][0],
									    categorie: pub[i]['categorie'][0],
									    periodicitate: pub[i]['periodicitate'][0],
									    tip: pub[i]['tip'][0],
									    arie: pub[i]['arie'][0],
									    tiraj_brut: pub[i]['cifre'][0]['tiraj_brut'],
									    total_vanzari: pub[i]['cifre'][0]['total_vanzari'],
									    total_difuzat: pub[i]['cifre'][0]['total_difuzat'],
										pret: randomIntFromInterval(2.00, 20.00)
									};
									db.insert(elem, function(err,doc){
										//console.log('Inserted', doc.name, 'with ID', doc._id);
										//console.log(doc);
									});	
								}								
							}
						}
       				}
           		}
           	}
        });
        //console.log("File '" + filePath + "/ was successfully read.\n");
        return json;
    } catch (ex) {console.log(ex)}
 }
}();

app.get('/', function(req, res){
	//Test query db
	var arr = [];
	db.find({ publicatie: { $exists: true } }, function(err, docs) {
		docs.forEach(function(d){
			console.log(d);
			arr.push(d);
		});
		//console.log(docs);
		res.render('index', { arrval: docs});
	});	
});

app.get('/buy', function(req, res){
	res.render('buy', {});
});

var numeSolicitant;
var prenumeSolicitant;
var numePublicatie;
var categorie;
var cantitate;
var tip;
var addOn;
var pret;

app.post("/getPrice", function(req, res) {
	//console.log(req.body.nume);
	numeSolicitant = req.body.nume;
	prenumeSolicitant = req.body.prenume;
	numePublicatie = req.body.publicatie;
	categorie = req.body.categorie;
	cantitate = req.body.cantitate;
	addOn = "";
	if(req.body.carte == "on")
		addOn += "Carte ";
	if(req.body.cd == "on")
		addOn += "CD ";

	db.findOne({publicatie: req.body.publicatie}, function(err, doc){
		//console.log("Found newspaper: " + doc);
		var pretTotal;
		for(var key in doc){
			if(key == "pret"){
				pretTotal = doc[key] * parseInt(req.body.cantitate);
				pret = pretTotal;
			}
		}
		console.log("Vanzari = " + doc['total_vanzari'][0]);
		var vanzari = parseInt(doc['total_vanzari'][0]);
		if(vanzari < 10000)
			res.render('buy', {esuat: true, price : 0});
		else
			res.render('buy', {esuat: false, price: pretTotal});
	})
});

app.get("/register", function(req, res){
	var elem = {
		nume: numeSolicitant,
		prenume: prenumeSolicitant,
		publicatie: numePublicatie,
		categorie: categorie,
		cantitate: cantitate,
		aditional: addOn,
		pret: pret
	};
	tdb.insert(elem, function(err,doc){
		console.log(doc);
	});
	res.render('buy', {});
});

app.get("/trans", function(req,res){
	
	tdb.find({ publicatie: { $exists: true } }, function(err, docs) {
		docs.forEach(function(d){
			console.log(d);
		});
		//console.log(docs);
		res.render('transactions', { arrval: docs});
	});
});

module.exports = app;
