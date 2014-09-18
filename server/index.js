/*
 * GET home page.
 */

var BootstrapManager = require('./dao/BootstrapManager'),
User = require('./entity/user'),
File = require('./entity/file'),
UserController = require('./controller/UserController'),
FileController = require('./controller/FileController'),
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
uController = new UserController(),
fController = new FileController({});

main_router.route('/')
	.all(function(req,res){
		res.send('welcome to head');
	});

main_router.route('/login')
	.all(function(req,res){
		console.log('/login receiving request: ' + req);
		res.render('view/login.ejs');
	});

main_router.route('/plain')
	.all(function(req,res){
		console.log('/plain request: ' + req);
		res.render('plain.ejs');
	});

main_router.route('/serviceadmin')
	.all(function(req,res){
		_restrict(req,res,function(user){
			var errorLogin = req.flash('servicelogin'),
			errorUsername = req.flash('serviceloginusername');
			req.flash('servicelogin',undefined);
			req.flash('serviceloginusername',undefined);
			res.render('administrator.ejs',{
				error:errorLogin,
				errorUsername:errorUsername
			});
		},'serviceadmin');
	});

main_router.route('/serviceadmin/login')
	.all(function(req,res){
		_restrict(req,res,function(user){
			
				var username = req.query.username,
				password = req.query.password;

				if (username == 'liverpool' && password == 'liverpool'){
					console.log('login success');
					user.svcAdmin = true;
					res.redirect('/service');
				}else{
					console.log('login failure');
					req.flash('servicelogin','Invalid login!');
					req.flash('serviceloginusername',username);
					res.redirect('/serviceadmin');
				}
			
		},'serviceadmin');
	});

main_router.route('/service')
	.all(function(req,res){
		_restrict(req,res,function(user){
			_restrictServiceAdmin(req,res,function(user){
				gSvcs = new GoogleServices();
				var errCallback = function(errMessage,errObject){
					console.log(errMessage);
					res.render('error.ejs',errMessage);
				}
				var successCallback = function(files,tokens,authClient){
					res.render('administrator-dashboard.ejs',{files:files.items, googleDelete:gSvcs.deleteServiceFile});
				}
				gSvcs.listServiceAccountFiles(successCallback,errCallback);
			},'service');
		},'service');
	});

main_router.route('/service/ws/files')
	.all(function(req,res){
		_restrict(req,res,function(user){
			_restrictServiceAdmin(req,res,function(user){
				if (req.query.delete){
					var fileID = req.query.delete;
					gSvcs = new GoogleServices();
					var errCallback = function(errMessage,errObject){
						res.json({error:true,message:errMessage});
					}

					var successCallback = function(err,success){
						res.json({error:false,message:success});
					}
					gSvcs.deleteServiceFile(fileID,successCallback,errCallback);
				}else if (req.query.permission){
					var fileID = req.query.permission;
					var permissionType = req.query.permissionType;
					gSvcs = new GoogleServices();
					var errCallback = function(errMessage,errObject){
						res.json({error:true,message:errMessage});
					}

					var successCallback = function(err,success){
						res.json({error:false,message:success});
					}
					switch(permissionType){
						case 'owner':
							gSvcs.deleteServiceFile(fileID,successCallback,errCallback);
							break;
						case 'editor':
							gSvcs.removeServiceFilePermissions(fileID,successCallback,errCallback);
							break;
						default:
					}
					
				}else{
					res.json({error:true,message:'Invalid Web Service Call'});
				}
				
			},'serviceWS');
		},'serviceWS');
	});

//profile route for something like /lawshengxun/profile or /kyong/profile
main_router.route('/:user_id/profile')
	.all(function(req,res){
		var user_id = req.params.user_id;
		//do something with the custom user id and their profile
		_restrict(req,res,function(user){
			//var data = req.flash('user');
			res.render('profile.ejs',user);
		},'profile');
	});

main_router.route('/mydrive')
	.all(function(req,res){
		_restrict(req,res,function(user){
			//var data = req.flash('user');
			console.log(user.authClient);

			res.render('mydrive.ejs',user);
		},'mydrive');
	});

main_router.route('/lessons/:lessonname/:user_id/:create?')
	.all(function(req,res){
		_restrict(req,res,function(user){
			var userID = req.params.user_id,
			lessonname = req.params.lessonname,
			isCreate = req.params.create;

			gSvcs = new GoogleServices();

			var validateExerciseTitle = function(exerciseTitle){
          		return exerciseTitle.replace(/\s+/g, '');
        	},
			captureFile = function(sysFiles,fileurl){
				var lessonKeys = Object.keys(sysFiles);
				for (var i = 0; i<lessonKeys.length; i++){
					var lessonKey = lessonKeys[i],
					lesson = sysFiles[lessonKey],
					exerciseKeys = Object.keys(lesson);

                	for (var j = 0; j<exerciseKeys.length; j++){
                		var exerciseKey = exerciseKeys[j],
                		exercise = lesson[exerciseKey],
						exerciseTitle = exercise.exerciseTitle,
						exerciseURLPattern = validateExerciseTitle(exerciseTitle);

						if (exerciseURLPattern==lessonname){
							return {lesson:lesson,exercise:exercise};
						}
                	}
				}
				return null;
			},
			captureAndRenderExercises = function(systemFiles){
				var wantedFile = captureFile(systemFiles,lessonname);
				if (wantedFile==null){
					res.render('error.ejs','404 file not found');
				}else{
					user.targettedExercise = wantedFile.exercise;
					user.targettedLesson = wantedFile.lesson;
				}
				res.render('exercise.ejs',user);
			};

			if (isCreate && isCreate=='create'){
				//creation WS call
				var systemFiles = user.systemFiles,
				userFiles = user.files;

				var wantedFile = captureFile(systemFiles,lessonname);
				if (wantedFile != null){
					var exercise = wantedFile.exercise;
					console.log('filecreation');

					gSvcs.copyServiceDriveFileServiceAuth(exercise.id,exercise.title + ' ('+user.emailUsername+')',user,function(err,fileResponse,fileAndHTTPResponse){
						gSvcs._consoleLogServiceAccountFiles();
						//console.log(err);
						//console.log(fileResponse);
						//console.log(fileAndHTTPResponse);
					});
				}else{
					//errorneous
				}

			}else{
				//display call
				if (user.systemFiles){
					var systemFiles = user.systemFiles;
					captureAndRenderExercises(systemFiles);
				}else{
					var errCallback = function(errMessage,errObject){
						console.log(errMessage);
						res.render('error.ejs',errMessage);
					}
					var successCallback = function(files,tokens,authClient){
						user.serviceAuthClient =authClient;
						fController.loadInFiles(files,function(processedFiles){
							user.systemFiles = processedFiles;
							captureAndRenderExercises(processedFiles);
						});
					}
					gSvcs.listServiceAccountFiles(successCallback,errCallback);
				}
				console.log(user.id);
				console.log(userID);
				console.log(lessonname);
			}
		},'exercise');
	});

main_router.route('/lessons')
	.all(function(req,res){
		_restrict(req,res,function(user){
			gSvcs = new GoogleServices();
			//var data = req.flash('user');
			var errCallback = function(errMessage,errObject){
				console.log(errMessage);
				res.render('error.ejs',errMessage);
				//res.send(errObject);
			}
			var successCallback = function(files,tokens,authClient){
				user.serviceAuthClient = authClient;
				fController.loadInFiles(files,function(processedFiles){
					user.systemFiles = processedFiles;
					res.render('lessons.ejs',{files:processedFiles,user:user});
				});
				
				//res.send(JSON.stringify(files) + ' ' + JSON.stringify(tokens));
			}
			gSvcs.listServiceAccountFiles(successCallback,errCallback);
		},'lessons');
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
			      	loggedInUser.emailUsername = _extractEmailUsername(results.emails[0].value),
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
	      		req.flash('user',loggedInUser);
	      		var targetRedirect = req.flash('target_locale')[0];//use only the first element as the result
	      		console.log(targetRedirect);

	      		//update user database on user details
	      		uController.processLogin(loggedInUser,function(action,isSuccess,result){
	      			//action performed
	      			switch(action){
	      				case 'Update User':
	      					console.log(result);
	      					break;
	      				case 'Insert User':
	      					console.log(result);
	      					break;
	      				default:
	      			}
	      		});

	      		switch(targetRedirect){
	      			case 'mydrive':
	      				console.log('my drive called');
	      				/*console.log({
			      			user:loggedInUser,
			      			files:files
			      		});*/
						req.flash('target_locale',undefined);//reset given that user has alr logged in
	      				res.redirect('/mydrive');
	      				break;
	      			case 'lessons':
	      				console.log('lessons called');
	      				req.flash('target_locale',undefined);//reset given that you've logged in already
	      				res.redirect('/lessons');
	      				break;
	      			default:
	      				console.log('default flow called');
	      				res.redirect('/home');
	      		}
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

function _extractEmailUsername(str){
	var nameMatch = str.match(/^([^@]*)@/),
	name = nameMatch ? nameMatch[1] : null;
	if (str.indexOf('@gtempaccount.com')!=-1){
		var tempUsername = name.split('@gtempaccount.com')[0];
		var subTempUsername = tempUsername.split('%')[0];
		return subTempUsername;
	}
	return name;
}

function _restrict(req, res, next, targetLocale) {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
  if (req.session.user) {
    next(req.session.user);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
  } else {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
    req.session.error = 'Access denied!';
    req.flash('target_locale',targetLocale);
    console.log(targetLocale);
    res.redirect('/login-google');                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
  }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
}

function _restrictServiceAdmin(req, res, next, targetServiceLocale){
	var redirectServiceLogin = function (){
		req.session.error = 'Access denied!';
	    req.flash('target_service_locale',targetServiceLocale);
	    res.redirect('/serviceadmin');     
	}
	if (req.session.user) {
		if (req.session.user.svcAdmin == true){
			next(req.session.user);
		}else{
			redirectServiceLogin();
		}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
  	} else {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
  		redirectServiceLogin();
  	}
}