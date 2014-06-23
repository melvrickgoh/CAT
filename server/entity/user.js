function User(options){
	this.username = options.username,
	this.email = options.email,
	this.lastAttemptedLesson = options.lastLessonID,
	this.lastVisit = options.lastVisit ? options.lastVisit: new Date();
}

User.prototype.constructor = User;

User.prototype.getUsername = function(){
	return this.username;
}

User.prototype.getEmail = function(){
	return this.email;
}

User.prototype.getLastLesson = function(){
	return this.lastAttemptedLesson;
}

User.prototype.getLastVisit = function(){
	return this.lastVisit;
}

User.prototype.getLastVisitMilliseconds = function(){
	return this.lastVisit.getLastVisitMilliseconds();
}

User.prototype.logAttributes = function(){
	console.log('Username: ' + this.username + '\nEmail: ' + this.email + '\nLesson' + lastAttemptedLesson);
}

User.prototype.logVisit = function(){
	this.lastVisit = new Date();
}

module.exports = User;
//chmod