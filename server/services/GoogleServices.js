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

function GoogleServices(options){}

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
	var self = this;
	getAccessToken(code,function(oauth2Client,tokens){
	  	_executeCommand(oauth2Client,function(client,oauth2Client){
	  		var userName = "";
	  		var userEmail = "";
	  		_getUserProfile(client,oauth2Client,'me',function(err,results){
	  			userName = results.displayName;

	  			console.log(userName);
	  			callback('profile',err,results,tokens,oauth2Client);

	  		});
	  			
	  			
	  		_getDriveProfile(client,oauth2Client,'me',function(err,results){callback('drive',err,results,tokens,oauth2Client)});

	  			
	  			//return the system files 
	  			/*var errCallback = function(errMessage,errObject){
					console.log(errMessage);
					console.log(errObject);
					
				}
				var successCallback = function(files,tokens){
					// compare the drive documents and system documents with their id

					var filesObj = results.items;
					console.log('File items length >>> '+ filesObj.length);

					var systemFiles = files.items;
					console.log('Service files length >>> ' + systemFiles.length);
					//clear the results list of client drive.

	  				var newUserFiles = [];
					// create a loop for the system drive documents first
					for (j=0; j<systemFiles.length; j++) {
  							
  							console.log(j);
  							var f = systemFiles[j];
  							var systemFileTitle = f.title;
  							console.log('system files name >>>' +systemFileTitle);
  							var systemFileId = f.id;
  							var keyTitle = userName + '_' + systemFileTitle;
	  						
	  						//check that this fileId exist within client's drive	  					
	      					//do a loop or check for existing id
	      					/*if (filesObj.getFileById(systemFileId) == null ) {

	      					}
	      					var counter = 0;
	      					for (var i in filesObj){
				      			var fileObj = filesObj[i];
				      			console.log("client file >>>" + fileObj.title);
								var fileTitle = fileObj.title;
								if (fileTitle == keyTitle) {
									counter+=1;	
									newUserFiles.push(fileObj);			
								}
							
							}; 		

							console.log('counter >>>' +counter);
								
							if(counter == 0) {
								console.log('enter here');

								var successCopyCallback = function(err,file) {
									console.log(err);
									console.log('copied file name >>>' + file.title);

									var updateCallback = function(err,file) {
										console.log(err);
										console.log('new file title >>>' + file.title);
										newUserFiles.push(file);
									}

									self.updateServiceDriveFileServiceAuth(file.id,keyTitle,updateCallback);
									

								}
								self.copyServiceDriveFileServiceAuth(systemFileId,systemFileTitle,successCopyCallback);
								
							}	

					};

					
						results.items = newUserFiles;	
						// at this level, return spreadsheet that are only the cat's excel sheet. 
		  				callback('drive',err,results,tokens,oauth2Client);
		  			
				}
				self.listServiceAccountFiles(successCallback,errCallback); 
		});*/
	});
});
}

GoogleServices.prototype.copyServiceDriveFileServiceAuth = function(fileId,newName,callback){
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

GoogleServices.prototype.updateServiceDriveFileServiceAuth = function(fileId,newTitle,callback){
	var authClientCallback = function(err, tokens, client, authClient) {
		if (err) {
	    	errorCallback('Error authorizing account in authClient (Service account)',err);
	    	return;
	  	}
	  	console.log(client.drive.files);
	  	// Successfully authorize account
	  	// Make an authorized request to list Drive files.
	  	_updateServiceFile(client,authClient,fileId,newTitle,callback);
	}
	_serviceAccountExecution(authClientCallback);
}

GoogleServices.prototype.updateServiceDriveFile = function(fileId,newTitle,user,callback){
	var authClient = user.serviceAuthClient;
	_executeCommand(authClient,function(client,oauth2Client){
		console.log(JSON.stringify(client));
		_copyServiceFile(client,oauth2Client,fileId,newTitle,callback);
	});
}

function _updateServiceFile(client,authClient,fileId,newTitle,callback){
	client.drive.files.update({ 
		fileId : fileId,
		resource: { 
			title: newTitle
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

	  var retrieveGTempCredentials = function(response){
	  	var permissions = response.items;
	  	if (permissions.length>1){
	  		var svcPermission, secondaryPermission;
	  		for (var i in permissions){
		  		var indPermission = permissions[i];
		  		console.log(indPermission);
		  		if (indPermission.domain=='developer.gserviceaccount.com'){
		  			svcPermission = indPermission;
		  		}else{
		  			secondaryPermission = indPermission;
		  		}
		  	}
	  		return {type:'multiple',service:svcPermission,secondary:secondaryPermission}
	  	}else{
	  		return {type:'single',permission:permissions[0]}
	  	}
	  }

	  _getServicePermissions(id,errorCallback,function(response){
	  	var serviceResults = retrieveGTempCredentials(response);
	  	if (serviceResults.type == 'single'){
	  		var serviceCredentials = serviceResults.permission;
	  		_deleteServiceFile(id,function(err,response){
	  			errorCallback('Could not remove permissions',err);
	  		},function(err,response){
	  			if (!response){
	  				response = {file:id}
	  			}else{
	  				response.file = id;
	  			}
	  			successCallback(err,response);
	  		});
	  	}else{
	  		var serviceCredentials = serviceResults.service,
	  		secondaryCredentials = serviceResults.secondary;
	  		console.log('multi file permissions');
	  		if (serviceCredentials.role == 'owner'){
	  			//upgrade secondary n remove urself
	  			_upgradeOtherUserToOwner(id,secondaryCredentials.id,function(err,success){
	  				if (success){
			  			success.file = id;
	  					successCallback(err,success);
	  				}else{
	  					console.log(err);
	  					errorCallback('Could not handle upgrading other user error',err);
	  				}
	  			});
	  		}else{
	  			_removeServiceFilePermission(id,serviceCredentials.id,function(err,response){
	  				console.log(err);
		  			errorCallback('Could not remove permissions',err);
		  		},function(err,response){
		  			if (!response){
		  				response = {file:id}
		  			}else{
		  				response.file = id;
		  			}
		  			successCallback(err,response);
		  		});
	  		}
	  	}
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
			console.log('remove service file access to file');
			_removeServiceFilePermission(fileid,serviceCredentials.id,errorCallback,successCallback);
		  	//client.drive.permissions.delete({fileId:fileid,permissionId:serviceCredentials.id}).withAuthClient(authClient).execute(function(err, success) {
		  		//successCallback(err,success);
			//});
	  	}else{
	  		errorCallback('No service credentials found',err);
	  	}
	  });
	}
	_serviceAccountExecution(authClientCallback);
}

function _removeServiceFilePermission(fileid,permissionid,errorCallback,successCallback){
	var authClientCallback = function(err, tokens, client, authClient) {
	  if (err) {
	    errorCallback('Error authorizing account in authClient (Service account)',err);
	    return;
	  }
	  // Successfully authorize account
	  // Make an authorized request to list Drive files.
	  client.drive.permissions.delete({fileId:fileid,permissionId:permissionid}).withAuthClient(authClient).execute(function(err,response) {
	  		if (err){
	  			errorCallback(err,response);
	  		}else{
	  			successCallback(err,response);
	  		}
		});
	}
	_serviceAccountExecution(authClientCallback);
}

function _deleteServiceFile(fileid,errorCallback,successCallback){
	var authClientCallback = function(err, tokens, client, authClient) {
	  if (err) {
	    errorCallback('Error authorizing account in authClient (Service account)',err);
	    return;
	  }
	  // Successfully authorize account
	  // Make an authorized request to list Drive files.
	  client.drive.files.delete({fileId:fileid}).withAuthClient(authClient).execute(function(err,response) {
	  		if (err){
	  			errorCallback(err,response);
	  		}else{
	  			successCallback(err,response);
	  		}
		});
	}
	_serviceAccountExecution(authClientCallback);
}

function _upgradeOtherUserToOwner(fileid,permissionid,callback){
	var authClientCallback = function(err, tokens, client, authClient) {
	  if (err) {
	    errorCallback('Error authorizing account in authClient (Service account)',err);
	    return;
	  }
	  // Successfully authorize account
	  // Make an authorized request to upgeade Drive files permission.
	  client.drive.permissions.update({
	  		fileId:fileid,
	  		permissionId:permissionid,
	  		transferOwnership:true
	  	},{
	  		role:'owner'
	  	}).withAuthClient(authClient).execute(function(err, success) {
	  		callback(err,success);
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
	  	emailMessage: 'It does not do to dwell on dreams and forget to live, remember that. ~ Dumbledore'
	  },{
		id:userID,
		value: email,
		type: 'user',
		role: 'writer'
	  }
	  ).withAuthClient(authClient).execute(function(err,response) {
	  		callback(err,response);
		});
	}
	_serviceAccountExecution(authClientCallback);
}

GoogleServices.prototype.updateFileMetadata = function(fileID,title,callback){
	var authClientCallback = function(err, tokens, client, authClient) {
	  if (err) {
	    callback(err);
	    return;
	  }
	  // Make an authorized request to patch file title.
	  client.drive.files.patch({
	  	fileId:fileID,
	  },{
		title:title
	  }
	  ).withAuthClient(authClient).execute(function(err,response) {
	  		callback(err,response);
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