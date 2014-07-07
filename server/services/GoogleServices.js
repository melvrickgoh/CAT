var googleapis = require('../lib/googleapis');
var OAuth2Client = googleapis.OAuth2Client;
var CLIENT_ID = '614118273237-nogtgnp2dm5u9ruisbgq4tu579nq8800.apps.googleusercontent.com';
var CLIENT_SECRET = 'usHCpy7ndmuYy1cF3td7ytBV';
var REDIRECT_URL = 'http://localhost:3003/oauth2callback';

//For Client Side logging in
var OAuth2 = googleapis.auth.OAuth2;
var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

var SERVICE_ACCOUNT_EMAIL = '614118273237-o9khb1d1dqlj54f36jp5nsvjnehvd7i6@developer.gserviceaccount.com';
var SERVICE_ACCOUNT_KEY_FILE = './server/8372a6920e994e4154836785bc1c3fe5a26e1a11-privatekey.pem';

var passport = require('passport')
  , GoogleStrategy = require('passport-google').Strategy;

function GoogleServices(options){
	passport.use(new GoogleStrategy({
	    returnURL: 'http://localhost:3003/',// redirect url after being authenticated 'http://www.example.com/auth/google/return',
	    realm: 'http://localhost:3003/'//authentication realm of validity
	  },
	  function(identifier, profile, done) {
	    User.findOrCreate({ openId: identifier }, function(err, user) {
	      done(err, user);
	    });
	  }
	));
}

GoogleServices.prototype.constructor = GoogleServices;

GoogleServices.prototype.getOAuthClient = function(){
	return oauth2Client;
}

GoogleServices.prototype.login = function(response){
	// generates a url that allows offline access and asks permissions
	// for Google+ scope.
	var scopes = [
	  'https://www.googleapis.com/auth/plus.me',
	  'https://www.googleapis.com/auth/calendar',
	  'https://www.googleapis.com/auth/drive'
	];

	var url = oauth2Client.generateAuthUrl({
	  access_type: 'offline',
	  scope: scopes.join(" ") // space delimited string of scopes
	});

	googleapis
	  .discover('plus', 'v1')
	  .discover('calendar', 'v3')
  	  .discover('oauth2', 'v2')
  	  .discover('drive','v2')
	  .execute(function(err, client) {
	  		response.writeHead(302, {location: url});
    		response.end();
	  	  //console.log(client);
		  // retrieve an access token
		 // getAccessToken(oauth2Client, url, function() {
		    // retrieve user profile
		    /*getUserProfile(client, oauth2Client, 'me', function(err, profile) {
		      if (err) {
		        console.log('An error occured', err);
		        return;
		      }
		      console.log(profile.displayName, ':', profile.tagline);
		    });*/
		  //});

		});
}

GoogleServices.prototype.loginCallback = function(code,response){
	getAccessToken(code,function(tokens){
		console.log(tokens);
		response.send(JSON.stringify(tokens));
	})
}

function getAccessToken(code, callback) {
    // request access token
    console.log(code);
  oauth2Client.getToken(code, function(err, tokens) {
    console.log(err);
    // set tokens to the client
    // TODO: tokens should be set by OAuth2 client.
    oauth2Client.setCredentials(tokens);
    callback();
  });
}

function getUserProfile(client, authClient, userId, callback) {
  client
    .plus.people.get({ userId: userId })
    .withAuthClient(authClient)
    .execute(callback);
}

/*
* Application Drive is accessed via this method
* successCallback(filesObject,tokens): JSON response of the files retrieved, Access tokens used for accessing the files
* errorCallback(message,errorObject): Message on the error appearing, err object returned by Google APIs
*/
GoogleServices.prototype.listServiceAccountFiles = function(successCallback,errorCallback){
	googleapis
	  	.discover('drive', 'v2')
	  	.execute(function(err, client) {

		  var authClient = new googleapis.auth.JWT(
		    SERVICE_ACCOUNT_EMAIL,
		    SERVICE_ACCOUNT_KEY_FILE,
		    // Contents of private_key.pem if you want to load the pem file yourself
		    // (do not use the path parameter above if using this param)
		    '',
		    ['https://www.googleapis.com/auth/drive'],
		    // User to impersonate (leave empty if no impersonation needed)
		    '');

		  authClient.authorize(function(err, tokens) {
			  if (err) {
			    errorCallback('Error authorizing account in authClient (Service account)',err);
			    return;
			  }

			  // Successfully authorize account
			  // Make an authorized request to list Drive files.
			  client.drive.files.list().withAuthClient(authClient).execute(function(err, files) {
			  		if (err) {
					    errorCallback('Error accessing files with authClient (Service Account)',err);
					    return;
					}

			  		successCallback(files,tokens);
				});
			});

		});
}

module.exports = GoogleServices;