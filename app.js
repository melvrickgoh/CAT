/**
 * Library dependencies.
 */

var express = require('express'),
http = require('http'),
path = require('path'),
favicons = require('connect-favicons'),
//serveIndex = require('serve-index'),
morgan = require('morgan'),
bodyParser = require('body-parser'),
methodOverride = require('method-override'),
cookie = require('cookie'),
cookieParser = require('cookie-parser'),
pg = require('pg.js'),
session = require('express-session'),
pgSession = require('connect-pg-simple')(session),
flash = require('connect-flash'),//allowing the flashing 

errorHandler = require('errorhandler'),
pgDAO = require('./server/dao/index'),
bootstrap = require('./server/dao/BootstrapManager');

/**
 * Internal dependencies.
 */
var router = require('./server');

var app = express();

// all environments
app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 3003);
app.set('ipaddress', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");
// config
app.set('views', __dirname + '/client');
app.set('view engine', 'ejs');
app.engine('.html', require('ejs').renderFile);

/*
* Middleware Config
*/
app.use(favicons(__dirname + '/client/img/icons'));
//directory exposure to the public
//app.use(serveIndex(path.join(__dirname, '/client'), { icons:true }));
//app.use(serveIndex('/dropbox', '/Users/Melvrick/Dropbox'));
//logger. dev shows logs on req not resp
app.use(morgan({format:'dev',immediate:true}));
//setting input types of incoming details
app.use(bodyParser.urlencoded({
  extended:true //allows us to parse urlencoded data with qs library (false==querystring library)
}));
app.use(bodyParser.json());
// use HTTP verbs such as PUT or DELETE in places where the client doesn't support it
app.use(methodOverride());

// Use cookies
app.use(cookieParser());
//Session variable
app.use(session({
  store: new pgSession({
    pg : pg,
    conString : 'postgres://adminedaruff:3nEF-3YgNmnW@127.0.0.1:5432/cat'
  }),
  secret: process.env.FOO_COOKIE_SECRET || 'usHCpy7ndmuYy1cF3td7ytBV',//HMAC implementation for certifying modifications to the session's values
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));
//flash middleware for helping to route data between requests through the flash object
app.use(flash());
/*var sess = {
  secret: 'keyboard cat',
  cookie: {}//below action for dev and production sets secure cookies to true
}
app.use(session(sess));*/
/*app.use(function(req, res, next){                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
  var err = req.session.error                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
    , msg = req.session.success;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
  delete req.session.error;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
  delete req.session.success;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
  res.locals.message = '';                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
  next();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
});*/

app.use(require('stylus').middleware(__dirname + '/client'));
app.use(express.static(path.join(__dirname, 'client/')));
 
// development only
if ('development' == app.get('env')) {
  app.use(errorHandler({ dumpExceptions: true, showStack: true }));
}else if (app.get('env') == 'production'){
  app.set('trust proxy', 1) // trust first proxy, sitting behind a load balancer i.e. Nginx
  sess.cookie.secure = true // serve secure cookies
}

//general ROUTER
app.use('/', router.index);

// Redirect the user to Google for authentication.  When complete, Google
// will redirect the user back to the application at
//     /auth/google/return
//app.get('/auth/google', passport.authenticate('google'));

// Google will redirect the user to this URL after authentication.  Finish
// the process by verifying the assertion.  If valid, the user will be
// logged in.  Otherwise, authentication has failed.
//app.get('/auth/google/return', 
//  passport.authenticate('google', { successRedirect: '/',
//                                    failureRedirect: '/login' }));

// Run server
http.createServer(app).listen(app.get('port'), app.get('ipaddress'),function(){
  var dao = new pgDAO();
  dao.initialize();

  console.log('Express server listening on port ' + app.get('port'));
});