var pgDAO = require('./index');
var dao = new pgDAO({pgURL:("postgres://tinrklywlxfrri:hk39mjf6cN-_rbsXRXWYjhD0Wc@ec2-107-21-223-147.compute-1.amazonaws.com:5432/d9vled6ah1g453")});
var ID = 'id',
	EMAIL = 'email',
	SECTION = 'section',
	YEAR = 'year',
	SEMESTER = 'semester';
function StudentRecordsDAO(options){
	if (options){
		dao = new pgDAO({pgURL:options.pgURL})
	}
	this.TABLENAME = 'studentrecords';
}

StudentRecordsDAO.prototype.getVariables = function(){
	return [ID,EMAIL,SECTION,YEAR,SEMESTER];
}

StudentRecordsDAO.prototype.createStudentRecordsTable = function(){
	var srDetails = {
		name:this.TABLENAME,
		pk:{
			isGenerated:false,
			name:ID,
			type:'SERIAL'
		},
		attributes:[
			{
				name:EMAIL,
				type:'VARCHAR(1000)',
				isCompulsory:false
			},{
				name:SECTION,
				type:'VARCHAR(10)',
				isCompulsory:false
			},{
				name:YEAR,
				type:'integer',
				isCompulsory:false
			},{
				name:SEMESTER,
				type:'integer',
				isCompulsory:false
			}
		]
	};
	//dao.dropTable(userDetails.name,function(isSuccess,result){
		dao.createTable(srDetails,function(isSuccess,result){
			dao.checkTableExists(srDetails.name,function(isSuccess,result){
				console.log('Student Records table creation is > ' + isSuccess);
	      });
		});
	//});
	
}

StudentRecordsDAO.prototype.insertNewRecord = function(record,year,semester,section,callback){
	this.insertNewRecords([record],year,semester,section,callback);
}

StudentRecordsDAO.prototype.insertNewRecords = function(records,year,semester,section,callback){
	var srExtracts = this.extractRecordsDetails(records,year,semester,section);
	var newSRDetails = {
		name:this.TABLENAME,
		attributes:[{name:EMAIL,type:'string'},{name:SECTION,type:'string'},{name:YEAR,type:'integer'},
			{name:SEMESTER,type:'integer'}],
		values:srExtracts
	};
	dao.insert(newSRDetails,function(isSuccess,result){
		callback(isSuccess,result);
	});
}

StudentRecordsDAO.prototype.getAllRecords = function(callback){
	var selectSRDetails = {
		name:this.TABLENAME,
		distinct:false,
		attributes:this.getVariables()
	};
	dao.select(selectSRDetails,function(isSuccess,result){
		callback(true,result);//selected length >= 1
	});
}

StudentRecordsDAO.prototype.extractRecordsDetails = function(records,year,semester,section){
	var extract = [];
	for (var i in records){
		var email = records[i];
		extract.push({
			email:email,
			section:section,
			year:year,
			semester:semester
		});
	}
	return extract;
}

StudentRecordsDAO.prototype.checkRecordExists = function(email,callback){
	var selectSRDetails = {
		name:this.TABLENAME,
		distinct:false,
		attributes:['email'],
		conditions:['email = \''+ email +'\'']
	};
	dao.select(selectSRDetails,function(isSuccess,result){
		if (result.length >= 1){
			callback(true);//selected length >= 1
		}else{
			callback(false);//selected length is 0 or less
		}
	});
}

module.exports = StudentRecordsDAO;