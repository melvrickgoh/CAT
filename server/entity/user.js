function User(options){
	var username = options.username,
	email = options.email,
	lastAttemptedLesson = options.lastLessonID;
}

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

module.exports.User;