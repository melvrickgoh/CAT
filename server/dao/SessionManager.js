var pgDAO = require('./index');

var dao = new pgDAO({pgURL:(process.env.OPENSHIFT_POSTGRESQL_DB_URL||"postgres://adminedaruff:3nEF-3YgNmnW@127.0.0.1:5432/cat")});

function SessionManager(){

}

SessionManager.prototype.createSessionTable = function(){
	dao.createSessionTable(function(message,result){
		console.log(message);
	});
}

module.exports = SessionManager;