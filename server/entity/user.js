function User(options){
	this.id = options.id,
	this.etag = options.etag,
	this.gender = options.gender,
	this.googleURL = options.googleURL,
	this.displayName = options.displayName,
	this.name = options.name,
	this.image = options.image,
	this.email = options.email,

	this.refreshToken = options.refreshToken,
	this.authClient = options.authClient,

	this.lastAttemptedLesson = options.lastLessonID,
	this.lastVisit = options.lastVisit ? options.lastVisit: new Date();
}

User.prototype.constructor = User;

User.prototype.getID = function(){
	return this.id;
}

User.prototype.getETag = function(){
	return this.etag;
}

User.prototype.getGender = function(){
	return this.gender;
}

User.prototype.getGoogleURL = function(){
	return this.googleURL;
}

User.prototype.getDisplayName = function(){
	return this.displayName;
}

User.prototype.getName = function(){
	return this.name;
}

User.prototype.getImage = function(){
	return this.image;
}

User.prototype.getEmail = function(){
	return this.email;
}

User.prototype.getRefreshToken = function(){
	return this.refreshToken;
}

User.prototype.getAuthClient = function(){
	return this.authClient;
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
	console.log('Username: ' + this.displayName + '\nEmail: ' + this.email + '\nLesson' + lastAttemptedLesson);
}

User.prototype.logVisit = function(){
	this.lastVisit = new Date();
}

module.exports = User;