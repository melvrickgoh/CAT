/*
 * GET home page.
 */

var BootstrapManager = require('./dao/BootstrapManager'),
User = require('./entity/user'),
File = require('./entity/file'),
UserController = require('./controller/UserController'),
GoogleServices = require('./services/GoogleServices'),
express = require('express'),
main_router = express.Router();
//svc acct pw: notasecret
var readline = require('readline');

var googleapis = require('./lib/googleapis');
var OAuth2Client = googleapis.OAuth2Client;
var CLIENT_ID = '614118273237-nogtgnp2dm5u9ruisbgq4tu579nq8800.apps.googleusercontent.com';
var CLIENT_SECRET = 'usHCpy7ndmuYy1cF3td7ytBV';
var REDIRECT_URL = 'http://localhost:3003/oauth2callback';

/*var passport = require('passport')
  , GoogleStrategy = require('passport-google').Strategy;

  passport.use(new GoogleStrategy({
	    returnURL: 'http://localhost:3003/',// redirect url after being authenticated 'http://www.example.com/auth/google/return',
	    realm: 'http://localhost:3003/'//authentication realm of validity
	  },
	  function(identifier, profile, done) {
	    User.findOrCreate({ openId: identifier }, function(err, user) {
	      done(err, user);
	    });
	  }
	));*/

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/*
*	Helper Downloads
*/
var prettyjson = require('prettyjson');

/*
* APP Classes
*/

var bootstrapper = new BootstrapManager(),
uController = new UserController();

main_router.route('/')
	.all(function(req,res){
		res.send('welcome to head');
	});

main_router.route('/login')
	.all(function(req,res){
		res.render('login.ejs');
	});

main_router.route('/mydrive')
	.all(function(req,res){
		res.render('mydrive.ejs');
	});

// Google will redirect the user to this URL after authentication.  Finish
// the process by verifying the assertion.  If valid, the user will be
// logged in.  Otherwise, authentication has failed.
/*main_router.route('/auth/google/return')
	.all(function(req,res){
		passport.authenticate('google', { successRedirect: '/',failureRedirect: '/login' });
	});*/

main_router.route('/home')
	.all(function(req,res){

		gSvcs = new GoogleServices();

		var errCallback = function(errMessage,errObject){
			console.log(errMessage);
			res.send(errObject);
		}
		var successCallback = function(files,tokens){
			res.send(JSON.stringify(files) + ' ' + JSON.stringify(tokens));
		}
		gSvcs.listServiceAccountFiles(successCallback,errCallback);

	
	});

main_router.route('/login-google')
	.all(function(req,res){
		//res.send('welcome to monkey');

		// load google plus v1 API resources and methods
		gSvcs = new GoogleServices();
		gSvcs.login(res);
	});

// Redirect the user to Google for authentication.  When complete, Google
// will redirect the user back to the application at
main_router.route('/google/oauth2callback')
	.all(function(req,res){
		var code = req.query.code;
  		gSvcs = new GoogleServices();

  		//var authClient = gSvcs.getOAuthClient();

  		//gSvcs.getUserProfile(authClient,tokens.id_token,);

  		/*authClient.getToken(code, function(err, tokens){
		    res.send(JSON.stringify(tokens));
		});*/
		var returnCounter = 0;
		var loggedInUser = new User({}),
		files = [];

		gSvcs.getUserAndDriveProfile(code,function(resultType,err,results,tokens,oauth2Client) {
	      if (err) {
	        console.log('An error occured', err);
	        return;
	      }else{
	      	switch(resultType){
	      		case 'profile':
	      			loggedInUser.id = results.id,
			      	loggedInUser.etag = results.etag,
			      	loggedInUser.gender = results.gender,
			      	loggedInUser.googleURL = results.url,
			      	loggedInUser.displayName = results.displayName,
			      	loggedInUser.name = results.name,
			      	loggedInUser.image = results.image,
			      	loggedInUser.email = results.emails[0].value? results.emails[0].value : 'no email',
			      	loggedInUser.lastVisit = new Date();

			      	tokens.refresh_token? loggedInUser.refreshToken = tokens.refresh_token : '';
	    			oauth2Client? loggedInUser.authClient = oauth2Client : '';

	      			break;
	      		case 'drive':
	      			var filesObj = results.items;
	      			for (var i in filesObj){
	      				var fileObj = filesObj[i];
	      				files.push(new File({
	      					type : fileObj.kind,
							id : fileObj.id,
							etag : fileObj.etag,
							selfLink : fileObj.selfLink,
							alternateLink : fileObj.alternateLink,
							embedLink : fileObj.embedLink,
							iconLink : fileObj.iconLink,
							title : fileObj.title,
							mimeType : fileObj.mimeType,
							createdDate : fileObj.createdDate,
							modifiedDate : fileObj.modifiedDate,
							modifiedByMeDate : fileObj.modifiedByMeDate,
							lastViewedByMeDate : fileObj.lastViewedByMeDate,
							parents : fileObj.parents,
							exportLinks : fileObj.exportLinks,
							userPermission : fileObj.userPermission,
							ownerNames : fileObj.ownerNames,
							owners : fileObj.owners,
							lastModifyingUserName : fileObj.lastModifyingUserName,
							lastModifyingUser : fileObj.lastModifyingUser,
							editable : fileObj.editable,
							copyable : fileObj.copyable,
							shared : fileObj.shared
	      				}));
	      			}
	      			break;
	      		default:
	      			break;
	      	}
	      	returnCounter++;

	      	if (returnCounter == 2){//assign to the user the files at the end of the second callback
	      		loggedInUser.files = files;
	      		req.session.user = loggedInUser; //set the session to that of this user
	      		res.render('mydrive.ejs',{
	      			user:loggedInUser,
	      			files:files
	      		});
	      	}
	      }
	      
	    });
	});

exports.index = main_router;

function _hello(req, res){
	var mel = new User({
		username:"Mel",
		email:"omg",
		lastAttemptedLesson:"hello"
	});
	mel.logAttributes();
	res.render('index.ejs');
};

function _restrict(req, res, next) {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
  if (req.session.user) {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
    next();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
  } else {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
    req.session.error = 'Access denied!';                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
    res.redirect('/login');                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
  }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
}