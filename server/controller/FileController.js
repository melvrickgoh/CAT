var File = require('../entity/file'),
CourseDAO = require('../dao/CourseDAO'),
UserFileDAO = require('../dao/UserFileDAO'),
courseDAO,
ufDAO;

function FileController(options){
	courseDAO = new CourseDAO();
	ufDAO = new UserFileDAO();
	this.files = undefined;
}

FileController.prototype.getCourseDAO = function(){
	return courseDAO;
}

FileController.prototype.loadInFiles = function(jsonFileList,callback){
	//Process and loadfiles into memory
	var filesArray = jsonFileList.items,
	lastIteration = false,
	asyncOngoing = false,
	lessons = {},
	endFunction = function(lessons){
		if (lastIteration && !asyncOngoing){
			this.files = lessons;
			callback(this.files);//note that sometimes there may be errors if backend can't keep up
		}
	};
	for (var i in filesArray){
		var file = filesArray[i];
		var validatedFileRes = this.validateFileTitle(file.title);
		if (validatedFileRes.result){
			file.lesson = parseInt(validatedFileRes.lesson);
			file.exercise = parseInt(validatedFileRes.exercise);
			file.exerciseTitle = validatedFileRes.title;
			file.urlPattern = this.validateURLPattern(file);

			//getting lesson details from pgDB
			asyncOngoing = true;
			var lessonDetails = courseDAO.getLesson(validatedFileRes.lesson);
			console.log("getting lesson meta");
			console.log(lessonDetails);
			file.lessonDetails = lessonDetails;
			/*var lessonDetails = courseDAO.getLesson(validatedFileRes.lesson,exComponent[file.exercise],function(componentObject,isSuccess,result){
				var lessonDetails = result[0];
				componentObject.lessonTopic = lessonDetails.topic;
				componentObject.lessonObjective = lessonDetails.objective;

				asyncOngoing = false;
				if (lastIteration){
					//how do u know when's the last iteration?
					endFunction(lessons);
				}

			});//pull from our DB*/
			var exComponent = lessons[file.lesson];
			if (exComponent){
				exComponent[file.exercise] = new File(file);
			}else{ //create new ex component if it does not exist in the structure
				lessons[file.lesson] = {};
				exComponent = lessons[file.lesson];
				exComponent[file.exercise] = new File(file);
			}
		}
	}
	asyncOngoing = false;
	lastIteration = true;
	endFunction(lessons);
}

FileController.prototype.bootstrapAdminFiles = function(filesMeta){
	courseDAO.insertNewAdminExercises(filesMeta,function(isSuccess,result){
		console.log(isSuccess);
		console.log(result);
	});
}

FileController.prototype.validateFileTitle = function(title){
	//var catPattern = new RegExp(/^(CAT\sLesson\s)([0-9]{1,2})(\sEx\s)([0-9]{1,2})(:.*)$/);
	var catPattern = new RegExp(/^(CAT\sLesson\s)([0-9]+)(\sEx\s)([0-9]+)(:\s)(.*)$/);
	var result = catPattern.exec(title);
	if (result == null){
		return {result:false};
	}else{
		//perform categorization structuring
		return {result:true,lesson:result[2],exercise:result[4],title:result[6]};
	}
}

FileController.prototype.validateURLPattern = function(file){
	var exerciseTitle = file.exerciseTitle,
	urlPattern = exerciseTitle.replace(/\s+/g, '');

	file.urlPattern = urlPattern;
	courseDAO.insertNewExercises([file],function(isSuccess,result){
		console.log(isSuccess);
		console.log(result);
	});

	return urlPattern
}

FileController.prototype.updateUserFileDB = function(record,callback){
	ufDAO.insertNewRecord(record,callback);
}

FileController.prototype.removeAdminFileFromCirculation = function(fileid,successCallback,errorCallback){
	courseDAO.removeAdminExercise(fileid,function(isSuccess,result){
		if(isSuccess){
			//successfully deleted
			if (result >= 1){
				successCallback('No error','File successfully removed from the database');
			}else{
				errorCallback('File not found in database',result);
			}
		}else{
			errorCallback('Error occurred in accessing pg database',result);
		}
	});
}

FileController.prototype.addAdminFileToCirculation = function(options,callback){
	courseDAO.insertNewAdminExercises([options],callback);
}

FileController.prototype.updateAdminFile = function(adminExerciseInfo,callback){
	courseDAO.checkAdminExerciseExistsLessonID(adminExerciseInfo.lesson+'.'+adminExerciseInfo.exercise,function(isSuccess,results){
		if(isSuccess){//means there's already an existing lessonid, you cannot replace it
			callback(false,'This lesson-exercise combination has just been taken. Pick another!');
		}else{
			courseDAO.updateAdminExercise(adminExerciseInfo,function(isSuccess,results){
				callback(isSuccess,results);
			});
		}
	});
}

module.exports = FileController;