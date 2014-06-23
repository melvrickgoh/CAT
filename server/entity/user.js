var username,email,lastAttemptedLesson;

function User(options){
	username = options.username,
	email = options.email,
	lastAttemptedLesson = options.lastLessonID;
}

User.prototype.constructor = User;

User.prototype.getUsername = function(){
	return username;
}

User.prototype.getEmail = function(){
	return email;
}

User.prototype.getLastLesson = function(){
	return lastAttemptedLesson;
}

User.prototype.logAttributes = function(){
	console.log('Username: ' + username + '\nEmail: ' + email + '\nLesson' + lastAttemptedLesson);
}

module.exports = User;
