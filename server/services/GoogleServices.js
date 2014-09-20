var googleapis = require('../lib/googleapis');
var OAuth2Client = googleapis.OAuth2Client;
var CLIENT_ID = '614118273237-nogtgnp2dm5u9ruisbgq4tu579nq8800.apps.googleusercontent.com';
var CLIENT_SECRET = 'usHCpy7ndmuYy1cF3td7ytBV';
var REDIRECT_URL = 'http://localhost:3003/' + 'google/oauth2callback';

//localhost redirect: 'http://localhost:3003/'
//google redirect: 'http://cat-melvrickgoh.rhcloud.com/'

//For Client Side logging in
var OAuth2 = googleapis.auth.OAuth2;

var SERVICE_ACCOUNT_EMAIL = '614118273237-o9khb1d1dqlj54f36jp5nsvjnehvd7i6@developer.gserviceaccount.com';
var SERVICE_ACCOUNT_KEY_FILE = './server/8372a6920e994e4154836785bc1c3fe5a26e1a11-privatekey.pem';
//var passport = require('passport')
//  , GoogleStrategy = require('passport-google').Strategy;

function GoogleServices(options){
	/*passport.use(new GoogleStrategy({
	    returnURL: 'http://localhost:3003/',// redirect url after being authenticated 'http://www.example.com/auth/google/return',
	    realm: 'http://localhost:3003/'//authentication realm of validity
	  },
	  function(identifier, profile, done) {
	    User.findOrCreate({ openId: identifier }, function(err, user) {
	      done(err, user);
	    });
	  }
	));*/
}

GoogleServices.prototype.constructor = GoogleServices;

GoogleServices.prototype.getOAuthClient = function(){
	return oauth2Client;
}

GoogleServices.prototype.login = function(response){
	// generates a url that allows offline access and asks permissions
	// for Google+ scope.
	var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
	var scopes = [
		'https://www.googleapis.com/auth/plus.login',
	  	'https://www.googleapis.com/auth/plus.me',
	  	'https://www.googleapis.com/auth/plus.profile.emails.read',
	 	'https://www.googleapis.com/auth/calendar',
	 	'https://www.googleapis.com/auth/drive'
	];

	var url = oauth2Client.generateAuthUrl({
	  access_type: 'offline',
	  scope: scopes.join(" ") // space delimited string of scopes
	});

	googleapis
	  .discover('plus', 'v1')
	  //.discover('calendar', 'v3')
  	  .discover('oauth2', 'v2')
  	  .discover('drive','v2')
	  .execute(function(err, client) {
	  		response.writeHead(302, {location: url});
    		response.end();
		});
}

GoogleServices.prototype.loginCallback = function(code,response){
	this.getAccessToken(code,function(tokens){
		response.send(JSON.stringify(tokens));
	});
}

GoogleServices.prototype.getAccessToken =function(code, callback) {
    // request access token
  var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
  oauth2Client.getToken(code, function(err, tokens) {
    //console.log(err);
    // set tokens to the client
    // TODO: tokens should be set by OAuth2 client.
    oauth2Client.setCredentials(tokens);
    callback(oauth2Client);
  });
}

GoogleServices.prototype.getUserProfile = function(code,callback){
  getAccessToken(code,function(oauth2Client,tokens){
  	_executeCommand(oauth2Client,function(client,oauth2Client){
  		_getUserProfile(client,oauth2Client,'me',function(err,results){callback('profile',err,results,tokens,oauth2Client);});
  	});
  });
}

GoogleServices.prototype.getDriveProfile = function(code,callback){
	getAccessToken(code,function(oauth2Client,tokens){
	  	_executeCommand(oauth2Client,function(client,oauth2Client){
	  		_getDriveProfile(client,oauth2Client,'me',function(err,results){callback('drive',err,results,tokens,oauth2Client);});
	  	});
	});
}

GoogleServices.prototype.getUserAndDriveProfile = function(code,callback){
	getAccessToken(code,function(oauth2Client,tokens){
	  	_executeCommand(oauth2Client,function(client,oauth2Client){
	  		//var userName;
	  		_getUserProfile(client,oauth2Client,'me',function(err,results){callback('profile',err,results,tokens,oauth2Client);});
	  			//userEmail = results.name;
	  			
	  		_getDriveProfile(client,oauth2Client,'me',function(err,results){callback('drive',err,results,tokens,oauth2Client);});

	  			
	  			//return the system files 
	  			/*var errCallback = function(errMessage,errObject){
					console.log(errMessage);
				}
				var successCallback = function(files,tokens){
					// compare the drive documents and system documents with their id

					var filesObj = results.items;
					//clear the results list of client drive.
	  				results.items.clear();
					// create a loop for the system drive documents first
					while (files.hasNext()) {
  							var file = files.next();
  							console.log(file);
  							var systemFileTitle = file.title;
  							var systemFileId = file.id;
	  						
	  						//check that this fileId exist within client's drive	  					
	      					//do a loop or check for existing id
	      					/*if (filesObj.getFileById(systemFileId) == null ) {

	      					}
	      					var counter = 0;
	      					for (var i in filesObj){
				      			var fileObj = filesObj[i];
				      			console.log(fileObj.title);
								var fileTitle = fileObj.title;
								if (fileTitle == systemFileTitle) {
									counter+=1;				
								}
							
							}; 		

							if(counter == 0) {
								var copiedFile = copyFile(systemFileId,systemFileTitle);
								results.push(copiedFile);
							}	
					};

					
					// at this level, return spreadsheet that are only the cat's excel sheet. 
	  				callback('drive',err,results,tokens,oauth2Client);
				}
	  			listServiceAccountFiles(successCallback,errorCallback); */  	
		});
	});
}

GoogleServices.prototype.copyServiceDriveFileServiceAuth = function(fileId,newName,user,callback){
	var authClientCallback = function(err, tokens, client, authClient) {
		if (err) {
	    	errorCallback('Error authorizing account in authClient (Service account)',err);
	    	return;
	  	}
	  	// Successfully authorize account
	  	// Make an authorized request to list Drive files.
	  	_copyServiceFile(client,authClient,fileId,newName,callback);
	}
	_serviceAccountExecution(authClientCallback);
}


GoogleServices.prototype.copyServiceDriveFile = function(fileId,newName,user,callback){
	var authClient = user.serviceAuthClient;
	_executeCommand(authClient,function(client,oauth2Client){
		console.log(JSON.stringify(client));
		_copyServiceFile(client,oauth2Client,fileId,newName,callback);
	});
}

function _copyServiceFile(client,authClient,fileId,newName,callback){
	client.drive.files.copy({ 
		fileId : fileId,
		resource: { 
			title: newName
		} 
	}).withAuthClient(authClient).execute(callback);
}

function _getUserProfile(client, authClient, userId, callback){
    client.plus.people.get({ userId: userId }).withAuthClient(authClient).execute(callback);
}

function _getDriveProfile(client, authClient, userId, callback){
	client.drive.files.list().withAuthClient(authClient).execute(callback);
}

function _executeCommand(oauth2Client,callback){
	googleapis
	  .discover('plus', 'v1')
	  //.discover('calendar', 'v3')
  	  .discover('oauth2', 'v2')
  	  .discover('drive','v2')
	  .execute(function(err, client) {
	  		callback(client,oauth2Client);
	   });
}

function getAccessToken(code, callback) {
    var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
    // request access token
  	oauth2Client.getToken(code, function(err, tokens) {
  		if (err) {
  			console.log(err);
	        console.log('An error occured', err);
	        return;
		}
  	    // set tokens to the client
   	 	// TODO: tokens should be set by OAuth2 client.
   	 	oauth2Client.setCredentials(tokens);

   		callback(oauth2Client,tokens);
 	});
}

/**
 * Copy an existing file.
 *
 * @param {String} originFileId ID of the origin file to copy.
 * @param {String} copyTitle Title of the copy.
 */
function copyFile(originFileId, copyTitle) {
  var body = {'title': copyTitle};
  var request = gapi.client.drive.files.copy({
    'fileId': originFileId,
    'resource': body
  });
  request.execute(function(resp) {
    console.log('Copy ID: ' + resp.id);
    return resp;
  });
}

//function compare()

/*
* Application Drive is accessed via this method
* successCallback(filesObject,tokens): JSON response of the files retrieved, Access tokens used for accessing the files
* errorCallback(message,errorObject): Message on the error appearing, err object returned by Google APIs
* where the authclient for svc account is returned, this is the beginning
*/
GoogleServices.prototype.listServiceAccountFiles = function(successCallback,errorCallback){
	var authClientCallback = function(err, tokens, client, authClient) {
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
	  		successCallback(files,tokens,authClient);
		});
	}
	_serviceAccountExecution(authClientCallback);
}

GoogleServices.prototype.getServiceFilesByTitle= function(title,callback){
	var successCallback = function(files,tokens,authClient){
		var filesArray = files.items,
		callbackArray = [];
		for (var i in filesArray){
			var jsonFile = filesArray[i];
			if(jsonFile.title==title){
				callbackArray.push(jsonFile);
			}
		}
		callback(callbackArray);
	}
	var errorCallback = function(msg,err){
		console.log(msg);
	}
	this.listServiceAccountFiles(successCallback,errorCallback);
}

GoogleServices.prototype._consoleLogServiceAccountFiles = function(){
	var successCallback = function(files,tokens,authClient){
		var filesArray = files.items;
		for (var i in filesArray){
			var jsonFile = filesArray[i];
			console.log('ID: ' + jsonFile.id + ', Title: '+ jsonFile.title);
		}
	}
	var errorCallback = function(msg,err){
		console.log(msg);
	}
	this.listServiceAccountFiles(successCallback,errorCallback);
}

GoogleServices.prototype.deleteServiceFile = function(id,successCallback,errorCallback){
	var authClientCallback = function(err, tokens, client, authClient) {
	  if (err) {
	    errorCallback('Error authorizing account in authClient (Service account)',err);
	    return;
	  }
	  //console.log(client.drive);
	  // Successfully authorize account
	  // Make an authorized request to list Drive files.
	  client.drive.files.delete({fileId:id}).withAuthClient(authClient).execute(function(err, success) {
	  		if (err) {
	  			console.log(err);
			    errorCallback('Error accessing files with authClient (GoogleSvcs BACKEND FUNCTION: Service Account)',err);
			    return;
			}
	  		successCallback(err,success);
		});
	}
	_serviceAccountExecution(authClientCallback);
}

GoogleServices.prototype.removeServiceFilePermissions = function(fileid,successCallback,errorCallback){
	var authClientCallback = function(err, tokens, client, authClient) {
	  if (err) {
	    errorCallback('Error authorizing account in authClient (Service account)',err);
	    return;
	  }

	  var retrieveGTempCredentials = function(response){
	  	var permissions = response.items;
	  	for (var i in permissions){
	  		var indPermission = permissions[i];
	  		if (indPermission.domain=='developer.gserviceaccount.com'){
	  			return indPermission;
	  		}
	  	}
	  	return null;
	  }

	  _getServicePermissions(fileid,errorCallback,function(response){
	  	var serviceCredentials = retrieveGTempCredentials(response);
	  	if(serviceCredentials!=null){
	  		// Successfully authorize account
			// Make an authorized request to list Drive files.
		  	client.drive.permissions.delete({fileId:fileid,permissionId:serviceCredentials.id}).withAuthClient(authClient).execute(function(err, success) {
		  		successCallback(err,success);
			});
	  	}else{
	  		errorCallback('No service credentials found',err);
	  	}
	  });
	}
	_serviceAccountExecution(authClientCallback);
}

GoogleServices.prototype.addPermissionsToFile = function(fileID,userID,email,callback){
	var authClientCallback = function(err, tokens, client, authClient) {
	  if (err) {
	    errorCallback('Error authorizing account in authClient (Service account)',err);
	    return;
	  }
	  // Successfully authorize account
	  // Make an authorized request to list Drive files.
	  client.drive.permissions.insert({
	  	fileId:fileID,
	  	resource:{
		    id:userID,
		    value: email,
		    type: 'user',
		    role: 'writer'
	  	}
	  }).withAuthClient(authClient).execute(function(err,response) {
	  		if (err){
	  			callback(err);
	  		}else{
	  			callback(response);
	  		}
		});
	}
	_serviceAccountExecution(authClientCallback);
}

function _getServicePermissions(fileID,errorCallback,successCallback){
	var authClientCallback = function(err, tokens, client, authClient) {
	  if (err) {
	    errorCallback('Error authorizing account in authClient (Service account)',err);
	    return;
	  }
	  // Successfully authorize account
	  // Make an authorized request to list Drive files.
	  client.drive.permissions.list({fileId:fileID}).withAuthClient(authClient).execute(function(err,response) {
	  		if (err){
	  			errorCallback(err);
	  		}else{
	  			successCallback(response);
	  		}
		});
	}
	_serviceAccountExecution(authClientCallback);
}

/*
* Service discovery and request execution
*/
function _serviceAccountExecution(authClientCallback){
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

		  authClient.authorize(function(err,tokens){
		  	authClientCallback(err,tokens,client,authClient);
		  });

		});
}




module.exports = GoogleServices;