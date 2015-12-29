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
multiparty = require('multiparty'),
Busboy = require('busboy'),
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
fController = new FileController(),
gSvcs = new GoogleServices();

main_router.route('/')
	.all(function(req,res){
		res.redirect("/login");
	});

main_router.route('/login')
	.all(function(req,res){
		res.render('login.ejs');
	});

main_router.route('/testhome')
	.all(function(req,res){
		res.render('home.ejs');
	});	
main_router.route('/plain')
	.all(function(req,res){
		res.render('plain.ejs');
	});


main_router.route('/404')
	.all(function(req,res){
		res.render('error.ejs',{
			code:'404',
			message:'Sorry, we are not sure what you looking for.'
		});
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
				uController.checkUserAdmin(user,function(isSuccess){
					if (username == 'liverpool' && password == 'liverpool' && isSuccess){
						user.svcAdmin = true;
						res.redirect('/service');
					}else{
						req.flash('servicelogin','Invalid login!');
						req.flash('serviceloginusername',username);
						res.redirect('/serviceadmin');
					}
				});
		},'serviceadmin');
	});

main_router.route('/service/students')
	.all(function(req,res){
		_restrict(req,res,function(user){
			_restrictServiceAdmin(req,res,function(user){
				var errCallback = function(errMessage,errObject){
					res.render('error.ejs',{
						code:'500',
						message:'Service Error:'+errMessage
					});
				}
				var renderCallback = function(results){
					res.render('administrator-userdashboard.ejs',results);
				}
				try{
					uController.getAllUsers(function(isSuccess,results){
						if(isSuccess){
							uController.getAllStudentRecords(function(srSuccess,srResults){
								if (srSuccess){
									results.studentRecords = srResults;
									renderCallback(results);
								}else{
									renderCallback({admins:[],users:[],assistants:[],studentRecords:[]});
								}
							});
						}else{
							renderCallback({admins:[],users:[],assistants:[],studentRecords:[]});
						}
					});
				}catch(err){
					errCallback('Error happened while retrieving users from database');
				}
			},'service');
		},'service');
	});

main_router.route('/service')
	.all(function(req,res){
		_restrict(req,res,function(user){
			_restrictServiceAdmin(req,res,function(user){
				//gSvcs = new GoogleServices();
				var errCallback = function(errMessage,errObject){
					res.render('error.ejs',{
						code:'500',
						message:'Service Error:'+errMessage
					});
				}
				var successCallback = function(files,tokens,authClient){
					var courseDAO = fController.getCourseDAO();
					courseDAO.getAllAdminExercises(function(isSuccess,results){
						var adminFiles = [], nonAdminFiles = [];
						if(isSuccess){
							var extractAdminIDs = function(array){
								var resultArr = {},resultIDs = [];
								for (var k = 0; k<array.length; k++){
									var dbResult = array[k],
									lessonID = dbResult.lessonid.split('.');
									resultIDs.push(dbResult.masterid);
									resultArr[dbResult.masterid]={lesson:lessonID[0],exercise:lessonID[1],title:dbResult.name,url:dbResult.url};
								}
								return {ids:resultIDs,array:resultArr};
							},
							adminInfo = extractAdminIDs(results);
							var filesToReturn = files.items;
							for(var i =0; i<filesToReturn.length; i++){
								var file = filesToReturn[i];
								if (adminInfo.ids.indexOf(file.id)>-1){
									file.administratorFile = true;
									var dbInfo = adminInfo.array[file.id];
									file.lesson = dbInfo.lesson;
									file.exercise = dbInfo.exercise;
									file.exerciseTitle = dbInfo.title;
									file.exerciseURL = dbInfo.url;
									adminFiles.push(file);
								}else{
									file.administratorFile = false;
									nonAdminFiles.push(file);
								}
							}
							res.render('administrator-dashboard.ejs',{files:files.items, adminInfo:adminInfo, adminFiles:adminFiles, nonAdminFiles:nonAdminFiles});
						}
					});
					/*
					-----PREVIOUSLY USED TO BOOTSTRAP ADMIN FILES DB-----
					var serviceFiles = files.items;
					var adminFiles = [];
					for (var i = 0; i<serviceFiles.length; i++){
						var serviceItem = serviceFiles[i];
						var fileValidation = fController.validateFileTitle(serviceItem.title);

						if (fileValidation.result){
							serviceItem.exerciseTitle = fileValidation.title;
							adminFiles.push({
								lesson:fileValidation.lesson,
								exercise:fileValidation.exercise,
								exerciseTitle:fileValidation.title,
								alternateLink:serviceItem.alternateLink,
								lessonid:fileValidation.lesson,
								id:serviceItem.id,
								urlPattern:fController.validateURLPattern(serviceItem)
							});
						}
					}
					console.log(adminFiles);
					fController.bootstrapAdminFiles(adminFiles);
					*/
				}
				gSvcs.listServiceAccountFiles(successCallback,errCallback);
			},'service');
		},'service');
	});

main_router.route('/service/ws/lessons')
	.all(function(req,res){
		_restrict(req,res,function(user){
			_restrictServiceAdmin(req,res,function(user){
				
			},'serviceWS');
		},'serviceWS');
	});

main_router.route('/service/ws/students')
	.all(function(req,res){
		_restrict(req,res,function(user){
			_restrictServiceAdmin(req,res,function(user){
				var busboy = new Busboy({ headers: req.headers });
			    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
			      console.log('File [' + fieldname + ']: filename: ' + filename);
			      file.on('data', function(data) {
			        console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
			      });
			      file.on('end', function() {
			        console.log('File [' + fieldname + '] Finished');
			      });
			    });
			    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
			      console.log('Field [' + fieldname + ']: value: ' + inspect(val));
			    });
			    busboy.on('finish', function() {
			      console.log('Done parsing form!');
			      res.writeHead(303, { Connection: 'close', Location: '/' });
			      res.end();
			    });
			},'serviceWS');
		},'serviceWS');
	});

main_router.route('/service/ws/users')
	.all(function(req,res){
		_restrict(req,res,function(user){
			_restrictServiceAdmin(req,res,function(user){
				if(req.query.userid){
					var userID = req.query.userid,
					role = req.query.role;
					uController.changeUserRole(userID,role,function(isSuccess){
						res.json(isSuccess);
					});
				}else{
					console.log(req);
					console.log(req.form);
				}
			},'serviceWS');
		},'serviceWS');
	});

main_router.route('/service/ws/admin')
	.all(function(req,res){
		_restrict(req,res,function(user){
			_restrictServiceAdmin(req,res,function(user){
				//gSvcs = new GoogleServices();
				if (req.query.remove){
					var fileID = req.query.remove;
					var errCallback = function(errMessage,errObject){
						res.json({error:true,message:errMessage});
					}

					var successCallback = function(err,success){
						res.json({error:false,message:success});
					}
					fController.removeAdminFileFromCirculation(fileID,successCallback,errCallback);
					//remove service file from circulation
				}else if(req.query.add){
					var fileID = req.query.add,
					fileName = req.query.name,
					fileURL = req.query.url,
					lesson = parseInt(req.query.lesson),
					exercise = parseInt(req.query.exercise),
					link = req.query.link;

					fController.addAdminFileToCirculation({
						lesson : lesson+'.'+exercise,
						exerciseTitle : fileName,
						urlPattern : fileURL,
						alternateLink : link,
						id : fileID
					},function(isSuccess,results){
						if(isSuccess){
							res.json({success:true,message:'Insertion successful'});
						}else{
							res.json({success:false,message:'Insertion failed'});
						}
					});
				}else if (req.query.update){
					var fileID = req.query.update,
					lesson = req.query.lesson,
					exercise = req.query.exercise;

					fController.updateAdminFile({
						id:fileID,
						lesson:lesson,
						exercise:exercise
					},function(isSuccess,result){
						if(isSuccess){
							res.json({success:true,message:result});
						}else{//2 reasons for failure. LessonID taken by another user (since frontend caters to your session). Unable to update the row itself (maybe row no longer exists etc)
							res.json({success:false,message:result});
						}
					});
				}else{
					res.json({error:true,message:'Invalid Web Service Call'});
				}
			},'serviceWS');
		},'serviceWS');
	});

main_router.route('/service/ws/files')
	.all(function(req,res){
		_restrict(req,res,function(user){
			_restrictServiceAdmin(req,res,function(user){
				//gSvcs = new GoogleServices();
				if (req.query.delete){
					var fileID = req.query.delete;
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
					
				}else if (req.query.bulk){
					var postedResults = req.body,
					errors = [],
					successes = [],
					counter = 0;
					var superCallback = function(){
						console.log('super return called');
						res.json({success:true,errors:errors,successes:successes});
					}
					for (var i = 0; i<postedResults.length; i++){
						var filemeta = postedResults[i],
						fileid = filemeta.fileid;
						console.log(filemeta);

						switch(filemeta.permission){
							case 'owner':
								gSvcs.deleteServiceFile(fileid,function(err,success){
									counter++;
									console.log('owner success > ' + counter);
									console.log(success);
									successes.push(success.file);
									if (counter == postedResults.length){
										superCallback();
									}
								},function(message,err){
									counter++;
									console.log('owner error > ' + counter);
									if (counter == postedResults.length){
										superCallback();
									}
								});
								break;
							case 'editor':
								gSvcs.removeServiceFilePermissions(fileid,function(err,success){
									counter++;
									console.log('editor success > ' + counter);
									console.log(success);
									successes.push(success.file);
									if (counter == postedResults.length){
										superCallback();
									}
								},function(message,err){
									counter++;
									console.log(message,err);
									console.log('editor error > ' + counter);
									if (counter == postedResults.length){
										superCallback();
									}
								});
								break;
							default:
						}
						
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

			//gSvcs = new GoogleServices();

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

						if (exerciseURLPattern.indexOf(lessonname)>-1){
							return {lesson:lesson,exercise:exercise};
						}
                	}
				}
				return null;
			},
			captureAndRenderExercises = function(systemFiles){
				var wantedFile = captureFile(systemFiles,lessonname);
				//console.log(wantedFile);
				if (wantedFile==null){
					res.render('error.ejs',{
						code:'500',
						message:'System Error: File not Found'
					});
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

					gSvcs.copyServiceDriveFileServiceAuth(exercise.id,exercise.title + ' ('+user.emailUsername+')',user,function(err,fileResponse,fileAndHTTPResponse){
						if (!err){
							gSvcs.updateFileMetadata(fileResponse.id,exercise.title+' (' + user.emailUsername + ')',function(err,response){
								var fileResponse = response;
								if (err){
									res.json({
										success:false,
										err:'Failure to update the file title',
										code:3
									})
								}else{
									gSvcs.addPermissionsToFile(fileResponse.id,user.id,user.email,function(err,response){
										if(err){
											res.json({
												success:false,
												err:'Failure to add the user to file',
												code:4
											});
										}else{
											fileResponse.success = true,
											fileResponse.role = response.role,
											fileResponse.type = response.type;
											fController.updateUserFileDB({
												userid:user.id,
												fileid:fileResponse.id,
												fileurl:fileResponse.alternateLink
											},function(err,result){
												if(err){
													res.json({
														success:false,
														err:'Failure to insert into the user database',
														code:5
													});
												}else{
													res.json(fileResponse);
												}
											});
										}
									});
								}
							});
						}else{
							res.json({
								success:false,
								err:'Failure to copy file',
								code:2
							});
						}
					});
				}else{
					//errorneous
					res.json({
						success:false,
						err:'Failure to find file',
						code:1
					})
				}

			}else{
				//display call
				if (user.systemFiles){
					var systemFiles = user.systemFiles;
					console.log('look for system files');
					captureAndRenderExercises(systemFiles);
				}else{
					var errCallback = function(errMessage,errObject){
						res.render('error.ejs',{
							code:'500',
							message:'Service Error:'+errMessage
						});
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
				console.log('Looking for file');
				console.log(user.id);
				console.log(userID);
				console.log(lessonname);
			}
		},'lessons/ws/create');
	});

main_router.route('/lessons')
	.all(function(req,res){
		_restrict(req,res,function(user){
			//gSvcs = new GoogleServices();
			//var data = req.flash('user');
			var errCallback = function(errMessage,errObject){
				res.render('error.ejs',{
					code:'500',
					message:'Service Error:'+errMessage
				});
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

		//gSvcs = new GoogleServices();

		var errCallback = function(errMessage,errObject){
			console.log('list svc account files errors');
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
		//gSvcs = new GoogleServices();
		gSvcs.login(res);
	});

// Redirect the user to Google for authentication.  When complete, Google
// will redirect the user back to the application at
main_router.route('/google/oauth2callback')
	.all(function(req,res){
		var code = req.query.code;
  		//gSvcs = new GoogleServices();

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
	      		console.log("redirect path > " + targetRedirect);

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
	      			case 'service':
	      				console.log('service main page called');
	      				req.flash('target_locale',undefined);//reset given that you've logged in already
	      				res.redirect('/service');
	      				break;
	      			case 'serviceadmin':
	      				console.log('service admin page called');
	      				req.flash('target_locale',undefined);//reset given that you've logged in already
	      				res.redirect('/serviceadmin');
	      				break;
	      			case 'lessons/ws/create':
	      				//attempted access ws in an unauthorized manner
	      				res.render('error.ejs',{
							code:'404a',
							message:'Service Error:File resource not found'
						});
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