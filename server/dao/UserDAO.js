var pgDAO = require('./index');
var dao = new pgDAO({});
function UserDAO(options){
	this.TABLENAME = 'users';
}

UserDAO.prototype.createUserTable = function(){
	var userDetails = {
		name:this.TABLENAME,
		pk:{
			isGenerated:false,
			name:'id',
			type:'VARCHAR(50)'
		},
		attributes:[
			{
				name:'givenName',
				type:'VARCHAR(100)',
				isCompulsory:false
			},{
				name:'email',
				type:'VARCHAR(250)',
				isCompulsory:true
			},{
				name:'emailusername',
				type:'VARCHAR(150)',
				isCompulsory:true
			},{
				name:'gender',
				type:'VARCHAR(20)',
				isCompulsory:true
			},{
				name:'lastVisit',
				type:'BIGINT',
				isCompulsory:false
			},{
				name:'refreshToken',
				type:'VARCHAR(50)',
				isCompulsory:false
			}
		]
	};
	//dao.dropTable(userDetails.name,function(isSuccess,result){
		dao.createTable(userDetails,function(isSuccess,result){
			dao.checkTableExists(userDetails.name,function(isSuccess,result){
				console.log('User table creation is > ' + isSuccess);
	      });
		});
	//});
	
}

UserDAO.prototype.insertNewUser = function(user,callback){
	this.insertNewUsers([user],callback);
}

UserDAO.prototype.insertNewUsers = function(users,callback){
	var userExtracts = this.extractUsersDetails(users);
	var newUserDetails = {
		name:this.TABLENAME,
		attributes:[{name:'id',type:'string'},{name:'givenName',type:'string'},{name:'emailusername',type:'string'},
			{name:'email',type:'string'},{name:'gender',type:'string'},{name:'lastVisit',type:'BIGINT'},
			{name:'refreshToken',type:'string'}],
		values:userExtracts
	};
	dao.insert(newUserDetails,function(isSuccess,result){
		callback(isSuccess,result);
	});
}

UserDAO.prototype.extractUsersDetails = function(users){
	var extract = [];
	for (var i in users){
		var user = users[i];
		extract.push({
			id:user.id,
			givenName:user.name.givenName,
			email:user.email,
			emailusername:user.emailUsername,
			gender:user.gender,
			lastVisit:user.lastVisit.getTime(),
			refreshToken:user.refreshToken
		});
	}
	return extract;
}

UserDAO.prototype.checkUserExists = function(user,callback){
	var selectUserDetails = {
		name:this.TABLENAME,
		distinct:false,
		attributes:['id'],
		conditions:['id = \''+ user.id +'\'']
	};
	dao.select(selectUserDetails,function(isSuccess,result){
		if (result.length >= 1){
			callback(true);//selected length >= 1
		}else{
			callback(false);//selected length is 0 or less
		}
	});
}

UserDAO.prototype.updateUser = function(user,callback){
	var updateUserDetails = {
		name:this.TABLENAME,
		values:[{
			name:'lastVisit',
			type:'BIGINT',
			value:user.lastVisit.getTime()
		},{
			name:'refreshToken',
			type:'string',
			value:user.refreshToken
		}],
		conditions:['id = \'' + user.id + '\'']
	}
	dao.update(updateUserDetails,function(isSuccess,result){
		if (result.rowCount >= 1){
			callback(true);//selected length >= 1
		}else{
			callback(false);//selected length is 0 or less
		}
	});
}

module.exports = UserDAO;