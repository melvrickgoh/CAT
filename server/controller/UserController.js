var UserDAO = require('../dao/UserDAO'),
StudentRecordsDAO = require('../dao/StudentRecordsDAO');
var dao, srdao;

var User = require('../entity/user');

function UserController(options){
	if(options){
		dao = new UserDAO({pgURL:options.pgURL});
		srdao = new StudentRecordsDAO({pgURL:options.pgURL});
	}
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
			return;
		}
	});
}

UserController.prototype.getAllStudentRecords = function(callback){
	srdao.getAllRecords(callback);
}

UserController.prototype.getAllUsers = function(callback){
	var administrators = [],
	otherUsers = [],
	ta = [];
	filterUsers = function(users){
		for (var i = 0; i<users.length; i++){
			var user = users[i];
			if(user.role && user.role == 'admin'){
				administrators.push(user);
			}else if (user.role && user.role == 'ta'){
				ta.push(user);
			}else{
				otherUsers.push(user);
			}
		}
		return {admins:administrators,users:otherUsers,assistants:ta};
	};
	dao.getAllUsers(function(isSuccess,results){
		if (isSuccess){
			callback(isSuccess,filterUsers(results));
		}else{
			callback(isSuccess);
		}
	});
}

UserController.prototype.changeUserRole = function(userid,role,callback){
	dao.updateUserRole({id:userid,role:role},callback);
}

UserController.prototype.checkUserAdmin = function(user,callback){
	dao.checkUserAdministrator(user,function(isSuccess,results){
		if(isSuccess){
			var user = results[0];
			if (user.role == 'admin'){
				callback(true);
				return;
			}
		}
		callback(false);
	});
}

module.exports = UserController;