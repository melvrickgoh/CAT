var pgDAO = require('./index');

var dao = new pgDAO({});

function SessionManager(){

}

SessionManager.prototype.createSessionTable = function(){
	dao.createSessionTable(function(message,result){
		console.log(message);
	});
}

module.exports = SessionManager;