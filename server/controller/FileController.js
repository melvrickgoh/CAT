var File = require('../entity/file'),
CourseDAO = require('../dao/CourseDAO'),
courseDAO;

function FileController(options){
	if (options){
		courseDAO = new CourseDAO({pgURL:options.pgURL});
	}
	this.files = undefined;
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
	courseDAO.checkExerciseExistsURL(exerciseTitle,function(exists){
		if (!exists){
			file.urlPattern = urlPattern;
			courseDAO.insertNewExercises([file],function(isSuccess,result){
				//console.log(isSuccess);
				//console.log(result);
			});
		}
	});
	return urlPattern
}

module.exports = FileController;