var User = require('./user');

function Administrator (options){
	this.administratedSubjects = options.subjects;
	this.administratorLevel = options.administratorLevel; // level can be 1 or 2, either instructor or TA 
	this.administratorSection = options.administratorSection; // Section is the literal class administrator is teaching/Ta-ing
	User.apply(this,arguments);
}

Administrator.prototype = Object.create(User.prototype);
Administrator.prototype.constructor = Administrator;

Administrator.prototype.getSubjects = function(){
	return this.administratedSubjects;
}

Administrator.prototype.getLevel = function(){
	return this.administratorLevel;
}

Administrator.prototype.getSection = function(){
	return this.administratorSection;
}

module.exports = Administrator;