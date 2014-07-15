var UserDAO = require('./UserDAO'),
SessionManager = require('./SessionManager');

var userDAO = new UserDAO(),
sessionManager = new SessionManager();

function BootstrapManager(){
	this.initializeSessionTable();
	this.initializeUserTable();
}

BootstrapManager.prototype.initializeUserTable = function(){
	userDAO.createUserTable();
}

BootstrapManager.prototype.initializeSessionTable = function(){
	sessionManager.createSessionTable();
}

module.exports = BootstrapManager;