const env = require('./env');
const PORT = process.env.PORT || 5000;
const express = require('express');
const app = express();
const http = require('http');
const bodyParser = require('body-parser');
const httpServer = http.createServer(app);
const MongoClient = require('mongodb').MongoClient;
const uri = env.uri;
const ObjectId = require('mongodb').ObjectID;
httpServer.listen(PORT);

//aa


app.use(function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    next();
});
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/api/messages/single/:id', function(req, res) {
    find(req.params.id)
        .then(
            result =>  res.send(JSON.stringify(      result )),
            error => res.send(JSON.stringify(      error.message ))
        );
});

app.get('/api/messages/list/:id', function(req, res) {
    findPage(req.params.id)
        .then(
            result =>  res.send(JSON.stringify(      result )),
            error => res.send(JSON.stringify(      error.message ))
        );
});

app.post('/api/send', function(req, res) {
    let validator = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if( !req.body.email || !req.body.message) {
        res.send({error: 'Please fill email and message'});
    }
    else if ( !validator.test(String(req.body.email).toLowerCase()) ) {
        res.send({error: 'Wrong email'});
    } else if ( req.body.message.length > 99 ) {
        res.send({error: 'Text too long'});
    } else {
    postMess(req.body.email,req.body.message)
        .then(
            result =>  res.send(JSON.stringify(      result )),
            error => res.send(JSON.stringify(      error.message ))
        );
    }
});

app.get('*', function(req, res){
    res.send({error: 'Not Found'});
});

function find(id) {
    return new Promise((resolve, reject) => {
        if (id.length !== 24) return resolve({error: 'bad id'});
        const client = new MongoClient(uri, {useNewUrlParser: true});
        client.connect(err => {
            const collection = client.db("chat").collection("messages");
            collection.find(ObjectId(id)).toArray(function (err, result) {
                if (err) throw err, reject(err);
                if (result.length === 0) resolve({error: 'Not Found'});
                resolve(result[0]);
                client.close();
            });
        });
    });
}

function findPage(id) {
    return new Promise((resolve, reject) => {
        const client = new MongoClient(uri, {useNewUrlParser: true});
        client.connect(err => {
            const collection = client.db("chat").collection("messages");
            collection
                .find({})
                .sort( { _id: -1 } )
                .skip(id * 10)
                .limit(10)
                .toArray(function(err, result) {
                    if (err) throw err, reject(err);
                    if (result.length === 0) resolve({error: 'Not Found'});
                    resolve(result);
                    client.close();
                });
        });
    });
}


function postMess(email, message) {
    return new Promise((resolve, reject) => {
        const client = new MongoClient(uri, {useNewUrlParser: true});

        client.connect(err => {
            const collection = client.db("chat").collection("messages");
            let time = new Date(Date.now()).toISOString();
            let user = {email: email, message: message, date_create: time, date_update: time};
            collection
                .insertOne(user, function (err, result) {
                    if (err) throw err, reject(err);
                    resolve(result.ops)
                    client.close();
                });
        });
    });
}




