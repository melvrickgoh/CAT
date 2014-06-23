var User = require('./user');

function Administrator (options){
	this.administratedSubjects = options.subjects;
	User.apply(this,arguments);
}

Administrator.prototype = Object.create(User.prototype);
Administrator.prototype.constructor = Administrator;

Administrator.prototype.getSubjects = function(){
	return this.administratedSubjects;
}

module.exports = Administrator;