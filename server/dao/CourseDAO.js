var pgDAO = require('./index');
var dao = new pgDAO({pgURL:(process.env.OPENSHIFT_POSTGRESQL_DB_URL||"postgres://adminedaruff:3nEF-3YgNmnW@127.0.0.1:5432/cat")});
function CourseDAO(options){
	this.TABLENAME = 'course',
	this.EXERCISE_TABLE_NAME = 'exercises',
	this.ADMIN_EXERCISE = 'adminexercise',
	this.lessonMeta = {};

	if (options){
		dao = new pgDAO({pgURL:options.pgURL});
	}

	this.loadLessonDetails();//load in lesson meta for future reference
	/*this.createExerciseTable(function(isSuccess,result){
		console.log(isSuccess);
		console.log(result);
	});//create the exercise table if it doesnt exist*/
}

CourseDAO.prototype.createCourseTable = function(callback){
	var courseDetails = {
		name:this.TABLENAME,
		pk:{
			isGenerated:false,
			name:'lessonid',
			type:'VARCHAR(10)'
		},
		attributes:[
			{
				name:'topic',
				type:'VARCHAR(200)',
				isCompulsory:false
			},{
				name:'objective',
				type:'VARCHAR(1500)',
				isCompulsory:true
			}//delimited by a <xx> tag
		]
	};

	dao.createTable(courseDetails,function(isSuccess,result){
		setTimeout(function(){
			dao.checkTableExists(courseDetails.name,function(isSuccess,result){
				console.log('Course table creation is > ' + isSuccess);
				callback(isSuccess,result);
	      	});
		},2000);
	});
}

CourseDAO.prototype.createExerciseTable = function(callback){
	var exerciseTableDetails = {
		name:this.EXERCISE_TABLE_NAME,
		pk:{
			isGenerated:true,
			name:'id',
			type:'INTEGER'
		},
		attributes:[
			{
				name:'lessonid',
				type:'VARCHAR(10)',
				isCompulsory:true
			},{
				name:'name',
				type:'VARCHAR(200)',
				isCompulsory:true
			},{
				name:'url',
				type:'VARCHAR(200)',
				isCompulsory:true
			},{
				name:'link',
				type:'VARCHAR(400)',
				isCompulsory:true
			},{
				name:'masterid',
				type:'VARCHAR(100)',
				isCompulsory:true
			}//delimited by a <xx> tag
		]
	};

	dao.createTable(exerciseTableDetails,function(isSuccess,result){
		setTimeout(function(){
			dao.checkTableExists(exerciseTableDetails.name,function(isSuccess,result){
				console.log('Exercise table creation is > ' + isSuccess);
				callback(isSuccess,result);
	      	});
		},2000);
	});
}

CourseDAO.prototype.createAdminExerciseTable = function(callback){
	var exerciseTableDetails = {
		name:this.ADMIN_EXERCISE,
		pk:{
			isGenerated:true,
			name:'id',
			type:'INTEGER'
		},
		attributes:[
			{
				name:'lessonid',
				type:'VARCHAR(10)',
				isCompulsory:true
			},{
				name:'name',
				type:'VARCHAR(200)',
				isCompulsory:true
			},{
				name:'url',
				type:'VARCHAR(200)',
				isCompulsory:true
			},{
				name:'link',
				type:'VARCHAR(400)',
				isCompulsory:true
			},{
				name:'masterid',
				type:'VARCHAR(100)',
				isCompulsory:true
			}//delimited by a <xx> tag
		]
	};

	dao.createTable(exerciseTableDetails,function(isSuccess,result){
		setTimeout(function(){
			dao.checkTableExists(exerciseTableDetails.name,function(isSuccess,result){
				console.log('Exercise table creation is > ' + isSuccess);
				callback(isSuccess,result);
	      	});
		},2000);
	});
}

CourseDAO.prototype.insertNewLesson = function(course,callback){
	this.insertNewLessons([course],callback);
}

CourseDAO.prototype.insertNewLessons = function(courses,callback){
	var courseExtracts = this.extractCourseDetails(courses);
	var newCourseDetails = {
		name:this.TABLENAME,
		attributes:[{name:'lessonid',type:'string'},{name:'topic',type:'string'},
			{name:'objective',type:'string'}],
		values:courseExtracts
	};
	dao.checkTableExists(this.TABLENAME,function(exists,result){
		if (exists){
			dao.insert(newCourseDetails,function(isSuccess,result){
				callback(isSuccess,result);
			});
		}
	});
}

CourseDAO.prototype.extractCourseDetails = function(courses){
	var extract = [];
	for (var i in courses){
		var course = courses[i];
		extract.push({
			lessonid:course.lessonID,
			topic:course.topic,
			objective:course.objective
		});
	}
	return extract;
}

CourseDAO.prototype.extractExerciseDetails = function(exercises){
	var extract = [];
	for (var i in exercises){
		var exercise = exercises[i];
		extract.push({
			lessonid : exercise.lesson,
			name : exercise.exerciseTitle,
			url : exercise.urlPattern,
			link : exercise.alternateLink,
			masterid : exercise.id
		});
	}
	return extract;
}

CourseDAO.prototype.checkLessonExists = function(lesson,callback){
	var selectLessonDetails = {
		name:this.TABLENAME,
		distinct:false,
		attributes:['lessonid'],
		conditions:['lessonid = \''+ lesson.lessonID +'\'']
	};
	dao.select(selectLessonDetails,function(isSuccess,result){
		if (result.length >= 1){
			callback(true);//selected length >= 1
		}else{
			callback(false);//selected length is 0 or less
		}
	});
}

CourseDAO.prototype.getLessonDB = function(lessonID,exerciseObject,callback){
	var selectLessonDetails = {
		name:this.TABLENAME,
		distinct:false,
		attributes:['lessonid','topic','objective'],
		conditions:['lessonid = \''+ lessonID +'\'']
	};
	dao.select(selectLessonDetails,function(isSuccess,result){
		if (result.length >= 1){
			callback(exerciseObject,true,result);//selected length >= 1
		}else{
			callback(exerciseObject,false,result);//selected length is 0 or less
		}
	});
}

CourseDAO.prototype.getLesson = function(lessonID){
	return this.lessonMeta[lessonID];
}

CourseDAO.prototype.loadLessonDetails = function(){
	this.lessonMeta = {};
	var lm = this.lessonMeta,
	selectLessonDetails = {
		name:this.TABLENAME,
		distinct:false,
		attributes:['lessonid','topic','objective']
	};
	dao.select(selectLessonDetails,function(isSuccess,result){
		//console.log(result);
		if (result.length >= 1){
			for (var i in result){
				var res = result[i];
				lm[res.lessonid] = {topic:res.topic,objective:res.objective};
			}
		}
	});
}

CourseDAO.prototype.insertExercise = function(lesson,callback){
	var insertExerciseDetails = {
		name:this.EXERCISE_TABLE_NAME,
		values:[{
			name:'topic',
			type:'string',
			value:lesson.topic
		},{
			name:'objective',
			type:'string',
			value:lesson.objective
		}],
		conditions:['id = \'' + lesson.lessonID + '\'']
	}
}

CourseDAO.prototype.checkExerciseExistsURL = function(exercisePattern,callback){
	var selectExerciseDetails = {
		name:this.EXERCISE_TABLE_NAME,
		distinct:false,
		attributes:['url'],
		conditions:['url = \''+ exercisePattern +'\'']
	};
	dao.select(selectExerciseDetails,function(isSuccess,result){
		if (result.length >= 1){
			callback(true);//selected length >= 1
		}else{
			callback(false);//selected length is 0 or less
		}
	});
}

CourseDAO.prototype.getAllAdminExercises = function(callback){
	var selectExerciseDetails = {
		name:this.ADMIN_EXERCISE,
		distinct:false,
		attributes:['id','name','url','masterid','lessonid','link']
	};
	dao.select(selectExerciseDetails,function(isSuccess,result){
		if (result.length >= 1){
			callback(true,result);//selected length >= 1
		}else{
			callback(false);//selected length is 0 or less
		}
	});
}

CourseDAO.prototype.insertNewAdminExercises = function(exercises,callback){
	var exerciseExtracts = this.extractExerciseDetails(exercises);
	var newExerciseDetails = {
		name:this.ADMIN_EXERCISE,
		attributes:[{name:'lessonid',type:'string'},
			{name:'name',type:'string'},
			{name:'url',type:'string'},
			{name:'link',type:'string'},
			{name:'masterid',type:'string'}],
		values:exerciseExtracts
	};
	dao.checkTableExists(this.ADMIN_EXERCISE,function(exists,result){
		if (exists){
			dao.insert(newExerciseDetails,function(isSuccess,result){
				callback(isSuccess,result);
			});
		}
	});
}

CourseDAO.prototype.removeAdminExercise = function(fileid,callback){
	var removeFileDetails = {
      name:this.ADMIN_EXERCISE,
      conditions:['masterid = \''+ fileid +'\''],
      otherTable: {
        isUsed: false,
        commonAttribute: 'helloworld',
        select: {}
      }
    };
    dao.delete(removeFileDetails,function(isSuccess,result){
    	callback(isSuccess,result);
    });
}

CourseDAO.prototype.insertNewExercises = function(exercises,callback){
	var exerciseExtracts = this.extractExerciseDetails(exercises);
	var newExerciseDetails = {
		name:this.EXERCISE_TABLE_NAME,
		attributes:[{name:'lessonid',type:'string'},
			{name:'name',type:'string'},
			{name:'url',type:'string'},
			{name:'link',type:'string'},
			{name:'masterid',type:'string'}],
		values:exerciseExtracts
	};
	dao.checkTableExists(this.EXERCISE_TABLE_NAME,function(exists,result){
		if (exists){
			dao.insert(newExerciseDetails,function(isSuccess,result){
				callback(isSuccess,result);
			});
		}
	});
}

CourseDAO.prototype.updateLesson = function(lesson,callback){
	var updateLessonDetails = {
		name:this.TABLENAME,
		values:[{
			name:'topic',
			type:'string',
			value:lesson.topic
		},{
			name:'objective',
			type:'string',
			value:lesson.objective
		}],
		conditions:['id = \'' + lesson.lessonID + '\'']
	}
	dao.update(updateLessonDetails,function(isSuccess,result){
		if (result.rowCount >= 1){
			callback(true);//selected length >= 1
		}else{
			callback(false);//selected length is 0 or less
		}
	});
}

module.exports = CourseDAO;