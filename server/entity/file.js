function File(options){
	this.type = options.type,
	this.id = options.id,
	this.etag = options.etag,
	this.selfLink = options.selfLink,
	this.alternateLink = options.alternateLink,
	this.embedLink = options.embedLink,
	this.iconLink = options.iconLink,
	this.lesson = options.lesson,//file controller: modified and added after validation processing
	this.lessonDetails = options.lessonDetails//file controller: taken from vbackend db	
	this.exercise = options.exercise,//file controller: modified and added after validation processing
	this.exerciseTitle = options.exerciseTitle,//file controller: modified and added after validation processing
	this.title = options.title,
	this.mimeType = options.mimeType,
	this.createdDate = options.createdDate,
	this.modifiedDate = options.modifiedDate,
	this.modifiedByMeDate = options.modifiedByMeDate,
	this.lastViewedByMeDate = options.lastViewedByMeDate,
	this.parents = options.parents,
	this.exportLinks = options.exportLinks,
	this.userPermission = options.userPermission,
	this.ownerNames = options.ownerNames,
	this.owners = options.owners,
	this.lastModifyingUserName = options.lastModifyingUserName,
	this.lastModifyingUser = options.lastModifyingUser,
	this.editable = options.editable,
	this.copyable = options.copyable,
	this.shared = options.shared
}

File.prototype.lastModifiedDate = function(){
	return new Date(this.modifiedDate);
}

File.prototype.constructor = File;

module.exports = File;