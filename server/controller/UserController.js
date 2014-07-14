var UserDAO = require('../dao/UserDAO');
var dao = new UserDAO({});

var User = require('../entity/user');

function UserController(options){

}

UserController.prototype.processLogin = function(user,callback){
	//If user exists, update the logtime, else insert new user into db
	dao.checkUserExists(user,function(exists){
		if (exists){
			dao.updateUser(user,function(updated){
				callback('Update User',updated);//to be updated on the dao being updated
			});
			return;
		}else{
			dao.insertNewUser(user,function(isSuccess,result){
				callback('Insert User',isSuccess,result);//to be updated on the dao being updated
			});
		}
	});
}

module.exports = UserController;