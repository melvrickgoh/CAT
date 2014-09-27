var pgDAO = require('./index');
var dao;
function UserFileDAO(options){
	this.TABLENAME = 'userfile';
	if (options){
		dao = new pgDAO({pgURL:options.pgURL});
	}
}

UserFileDAO.prototype.createUserFileTable = function(callback){
	var details = {
		name:this.TABLENAME,
		pk:{
			isGenerated:true,
			name:'id',
			type:'VARCHAR(10)'
		},
		attributes:[
			{
				name:'userid',
				type:'VARCHAR(50)',
				isCompulsory:false
			},{
				name:'fileid',
				type:'VARCHAR(100)',
				isCompulsory:true
			},{
				name:'fileurl',
				type:'VARCHAR(200)',
				isCompulsory:true
			}
		]
	};

	dao.createTable(details,function(isSuccess,result){
		setTimeout(function(){
			dao.checkTableExists(details.name,function(isSuccess,result){
				console.log('Course table creation is > ' + isSuccess);
				callback(isSuccess,result);
	      	});
		},2000);
	});
}

UserFileDAO.prototype.insertNewRecord = function(record,callback){
	this.insertNewLessons([record],callback);
}

UserFileDAO.prototype.insertNewRecords = function(records,callback){
	var recordExtracts = this.extractRecordsDetails(records);
	var newRecordDetails = {
		name:this.TABLENAME,
		attributes:[{name:'userid',type:'string'},{name:'fileid',type:'string'},{name:'fileurl',type:'string'}],
		values:recordExtracts
	};
	dao.checkTableExists(this.TABLENAME,function(exists,result){
		if (exists){
			dao.insert(newRecordDetails,function(isSuccess,result){
				callback(isSuccess,result);
			});
		}
	});
}

UserFileDAO.prototype.extractRecordsDetails = function(records){
	var extract = [];
	for (var i in records){
		var record = records[i];
		extract.push({
			userid:record.userid,
			fileid:record.fileid,
			fileurl:record.fileurl
		});
	}
	return extract;
}

UserFileDAO.prototype.checkRecordExists = function(userid,fileid,callback){
	var selectRecordDetails = {
		name:this.TABLENAME,
		distinct:false,
		attributes:['userid','fileid'],
		conditions:['userid = \''+ userid +'\'','fileid = \''+ fileid +'\'']
	};
	dao.select(selectRecordDetails,function(isSuccess,result){
		if (result.length >= 1){
			callback(true);//selected length >= 1
		}else{
			callback(false);//selected length is 0 or less
		}
	});
}

UserFileDAO.prototype.deleteRecord = function(userid,fileid,callback){
	var deleteDetails = {
		name:this.TABLENAME,
		conditions:['userid = \'' + userid + '\'','fileid = \'' + fileid + '\'']
	}
	dao.delete(deleteDetails,function(isSuccess,result){
		callback(true,result);//selected length >= 1
	});
}

UserFileDAO.prototype.getRecord = function(userid,fileid,callback){
	var selectDetails = {
		name:this.TABLENAME,
		distinct:false,
		attributes:['id','userid','fileid','fileurl'],
		conditions:['userid = \''+ userid +'\'','fileid = \''+ fileid +'\'']
	};
	dao.select(selectDetails,function(isSuccess,result){
		if (result.length >= 1){
			callback(true,result);//selected length >= 1
		}else{
			callback(false,result);//selected length is 0 or less
		}
	});
}

UserFileDAO.prototype.getUserRecords = function(userid,callback){
	var selectDetails = {
		name:this.TABLENAME,
		distinct:false,
		attributes:['id','userid','fileid','fileurl'],
		conditions:['userid = \''+ userid +'\'']
	};
	dao.select(selectDetails,function(isSuccess,result){
		if (result.length >= 1){
			callback(true,result);//selected length >= 1
		}else{
			callback(false,result);//selected length is 0 or less
		}
	});
}

module.exports = UserFileDAO;