var http = require('http');
var pg = require('pg.js');

var conString = "pg://tinrklywlxfrri:hk39mjf6cN-_rbsXRXWYjhD0Wc@ec2-107-21-223-147.compute-1.amazonaws.com:5432/d9vled6ah1g453";

var server = http.createServer(function(req, res) {

  var client = new pg.Client({
    user: "tinrklywlxfrri",
    password: "hk39mjf6cN-_rbsXRXWYjhD0Wc",
    database: "d9vled6ah1g453",
    port: 5432,
    host: "ec2-107-21-223-147.compute-1.amazonaws.com",
    ssl: true
  }); 
  client.connect();

  try{
    client.query(queryObject,callback);
  }catch(err){
    //errCallback(err); 
    console.log(err);
  }

  // get a pg client from the connection pool
  pg.connect(conString, function(err, client, done) {
    console.log(Object.keys(pg.pools.all)); //["{}"]
    console.log(pg.pools.getOrCreate(conString));
    var handleError = function(err) {
      console.log(err);
      // no error occurred, continue with the request
      if(!err) return false;

      // An error occurred, remove the client from the connection pool.
      // A truthy value passed to done will remove the connection from the pool
      // instead of simply returning it to be reused.
      // In this case, if we have successfully received a client (truthy)
      // then it will be removed from the pool.
      done(client);
      res.writeHead(500, {'content-type': 'text/plain'});
      res.end('An error occurred');
      return true;
    };

    // record the visit
    client.query('INSERT INTO visit (date) VALUES ($1)', [new Date()], function(err, result) {

      // handle an error from the query
      if(handleError(err)) return;

      // get the total number of visits today (including the current visit)
      client.query('SELECT COUNT(date) AS count FROM visit', function(err, result) {

        // handle an error from the query
        if(handleError(err)) return;

        // return the client to the connection pool for other requests to reuse
        done();
        res.writeHead(200, {'content-type': 'text/plain'});
        res.end('You are visitor number ' + result.rows[0].count);
      });
    });
  });
})

server.listen(3001)