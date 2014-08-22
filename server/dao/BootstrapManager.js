var UserDAO = require('./UserDAO'),
CourseDAO = require('./CourseDAO'),
SessionManager = require('./SessionManager');

var userDAO = new UserDAO(),
courseDAO = new CourseDAO(),
sessionManager = new SessionManager();

function BootstrapManager(){
	//this.initializeSessionTable();
	//this.initializeUserTable();
	//this.initializeCourseTable();
}

BootstrapManager.prototype.initializeUserTable = function(){
	userDAO.createUserTable();
}

BootstrapManager.prototype.initializeCourseTable = function(){
	courseDAO.createCourseTable(function(){
		var catLessonDescriptions = [{
			lessonID:'1',
			topic:'Basic Modeling in Excel',
			objective:'Know course scope, schedule, assessment and assignments<xx>Be motivated by the purpose and potential value of the course<xx>Can construct simple spreadsheet models'
		},{
			lessonID:'2',
			topic:'Spreadsheet Engineering',
			objective:'Understand how modeling is an effective tool in solving problems<xx>Know how to check correctness and ask analyzing questions<xx>Know how to construct a pleasing chart to present a problem situation'
		},{
			lessonID:'3',
			topic:'Functional Relationship',
			objective:'Able to build models with different functions and variable types<xx>Know how to generate tables of information from formulas<xx>Know how to add fool-proofing and user-friendly features<xx>Able to do iterative recursive computations'
		},{
			lessonID:'4',
			topic:'Data Lookup and Linkup',
			objective:'Able to automate lookup of information from a data list<xx>Able to record, minor edit and run macros'
		},{
			lessonID:'5',
			topic:'Monte-Carlo Simulation',
			objective:'Understand the importance of simulation to verify analytical results<xx>Able to setup simulation models and test decision choices under uncertainty'
		},{
			lessonID:'6',
			topic:'It’s about Time',
			objective:'Able to do computations with time and date variables<xx>Understand how to build a spreadsheet decision-support system<xx>Able to read, edit and write simple macros / VBA codes'
		},{
			lessonID:'7',
			topic:'Decision Support',
			objective:'Understand the complexity of decision-making<xx>Appreciate practical aspects of basic decision-making<xx>Understand the relevance of using the right frames of reference and tools<xx>Buy, Share and Rent, or equivalent<xx>WXYZ Construction, or equivalent<xx>Tree-Plan add-in<xx>Crazy Auction or Google Adwords, or equivalent'
		},{
			lessonID:'8',
			topic:'Term break',
			objective:'Term Break'
		},{
			lessonID:'9',
			topic:'Project Proposal',
			objective:'Able to present a clear and concise project proposal<xx>Able to discern the trivial from the important<xx>Confident in completing their team’s project by the deadline'
		},{
			lessonID:'10',
			topic:'Data Analysis',
			objective:'Able to compute basic statistics of data sets<xx>Able to fit data to statistical distributions<xx>Able to assess risks of decision choices<xx>Able to compile multi-attribute data statistics'
		},{
			lessonID:'11',
			topic:'Decision-making',
			objective:'Project consultation'
		},{
			lessonID:'12',
			topic:'Project Presentation',
			objective:'Able to comment on other projects<xx>Able to present own project and show teamwork'
		},{
			lessonID:'13',
			topic:'Project Presentation',
			objective:'Able to comment on other projects<xx>Able to present own project and show teamwork'
		}];
		courseDAO.insertNewLessons(catLessonDescriptions,function(isSuccess,result){
			console.log('inserting new lessons into courses table for cat >>> ' + isSuccess);
			console.log(result);
		});
	});
}

BootstrapManager.prototype.initializeSessionTable = function(){
	sessionManager.createSessionTable();
}

module.exports = BootstrapManager;