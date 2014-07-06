var pg = require('pg.js'),
conString = "postgres://adminedaruff:3nEF-3YgNmnW@127.0.0.1:5432/cat",
handleError;

function pgDAO (options){
	this.DEFAULT_OPTIONS = {
		create: {
			name: 'table_name',
			pk:{
				isGenerated:true,//then it'll be autoincremented
				name:'pk_name',
				type:'varchar(50)',
			},
			attributes:[{
				name:'name',
				type:'varchar(50)',
				isCompulsory:true//then it'll place in a notnull
			},{
				name:'type',
				type:'varchar(50)',
				isCompulsory:true//then it'll place in a notnull
			}]
		},
		insert: {
			name: 'table_name',
			attributes:[{name:'attr1',type:'string'},{name:'attr2',type:'number'},{name:'attr3',type:'time'}],
			values:[{
				attr1:'value1',
				attr2:'value2',
				attr3:'value3'
			}]
		},
		select: {
			name:'table_name',
			distinct: true,
			attributes:['attr1','attr2','attr3'],
			conditions:[//conditions are conjoined by AND by default
				//chain ur custom condition into the array as a single value if complex
				'attr1 = \'goran pandev\'',
				'attr2 <> NULL',
				],
			order:'ASC|DESC',
			limit: 'count|ALL',
			nesting: true//for usage by other querys where select is a nested statement
		},
		delete:{
			name:'table_name',
			conditions:[],
			otherTable: {
				isUsed: true,
				commonAttribute: 'attr1',
				select: {
					//same as the select format as shown above
				}
			}
		},
		update:{
			name:'table_name',
			values:[{name:'attr1',type:'string',value:'helloworld'},{name:'attr2',type:'number',value:'helloworld'}],
			conditions:[],
			returning:['attr1','attr2','attr3']
		}
	}
}

pgDAO.prototype.constructor = pgDAO;

pgDAO.prototype.initialize = function(){
	this._setupDefaults();
	this._getDatabaseTablesInformation();
}

pgDAO.prototype.getConnection = function(queryObject,callback,errCallback){
	// get a pg client from the connection pool
  pg.connect(conString, function(err, client, done) {
	try{
		client.query(queryObject,callback);
		done();
	}catch(err){
		//errCallback(err);
      	done(client);
	}
  });
}

pgDAO.prototype.update = function(details,callback){
	var query = this.generateUpdateQuery(details);

	this.getConnection(query,function(err,result){
		if (err){
			callback(false,err);
			return;
		}
		//returns the number of rows deleted
		callback(true,{
			rowCount:result.rowCount,
			rows:result.rows
		});
	});
}

pgDAO.prototype.generateUpdateQuery = function(details){
	var query = 'UPDATE ' + details.name + ' SET ';

	//setting up the values
	var values = details.values;
	for (var i in values){
		var obj = values[i];

		query += obj.name + ' = ' + this.generateSQLWrappers(obj.value,obj.type);

		i == values.length-1 ? query+=' ' : query+=', '
	}

	//conditions
	var conditions = details.conditions;
	if (conditions && conditions.length > 0){
		query += 'WHERE ';
		for (var i in conditions){
			var condition = conditions[i];
			if (i == conditions.length-1){
				query += condition + ' ';
			}else{
				query += condition + ' AND ';
			}
		}
	}

	//returning
	var returning = details.returning;
	if (returning && returning.length > 0){
		query += 'RETURNING '
		for (var i in returning){
			var returningAttr = returning[i];
			if (i == returning.length-1){
				query += returningAttr;
			}else{
				query += returningAttr + ', ';
			}
		}
	}

	return query += ';';
}

pgDAO.prototype.delete = function(details,callback){
	var query = this.generateDeleteQuery(details);

	this.getConnection(query,function(err,result){
		if (err){
			callback(false,err);
			return;
		}
		//returns the number of rows deleted
		callback(true,result.rowCount);
	});
}

pgDAO.prototype.generateDeleteQuery = function(details){
	var query = 'DELETE FROM ' + details.name + ' WHERE ';

	if (details.otherTable && details.otherTable.isUsed){
		query += details.otherTable.commonAttribute + ' IN (';

		query += this.generateSelectQuery(details.otherTable.select);

		query += ');';
	}else{
		for (var i in details.conditions){
			var condition = details.conditions[i];
			if (i == details.conditions.length-1){
				query += condition + ';'
			}else{
				query += condition + ' AND ';
			}
		}
	}

	return query;
}

pgDAO.prototype.select = function(details,callback){
	var query = this.generateSelectQuery(details);

	this.getConnection(query,function(err,result){
		if (err){
			callback(false,err);
			return;
		}
		//rows is the array containing the attributes with the column names as keys
		callback(true,result.rows);
	});
}

pgDAO.prototype.generateSelectQuery = function(details){
	var query = 'SELECT ',
	attributes = details.attributes,
	conditions = details.conditions;

	//selectively unique?
	if (details.distinct){
		query += 'DISTINCT ';
	}
	
	//generating form for attributes to select
	if (!attributes || attributes.length <= 0){
		query += '* FROM ' + details.name + ' ';
	}else{
		for (var i in attributes){
			var attr = attributes[i];
			if (i == attributes.length-1){
				query += attr + ' FROM ' + details.name + ' ';
			}else{
				query += attr + ', ';	
			}
		}
	}

	//generating matching conditions
	if (conditions && conditions.length > 0){
		query += 'WHERE ';
		for (var i in conditions){
			var condition = conditions[i];
			if (i == conditions.length-1){
				query += condition + ' ';
			}else{
				query += condition + ' AND ';
			}
		}
	}

	//adding in order
	if (details.order && details.order.length > 0){
		query += 'ORDER BY ' + details.order + ' ';
	}

	//adding in limits
	if (details.limit){
		query += 'LIMIT ' + details.limit;
	}

	//nesting of select statement?
	if (details.nesting){
		return query;
	}
	return query += ';'
}

pgDAO.prototype.insert = function(details,callback){
	var query = this.generateInsertQuery(details);
	//query = 'INSERT INTO epictable (moobars, foobars) VALUES (\'helloworldmoo\', \'helloworldfoo\');'
	this.getConnection(query,function(err,result){
		if (err){
			callback(false,err);
			return;
		}
		callback(true,result);
	});
}

pgDAO.prototype.generateInsertQuery = function(details){
	var query = 'INSERT INTO ' + details.name + ' (';
	//pumping in the attributes to be inserted: ORDER is IMPORTANT
	var attrDeclaration = details.attributes;
	for (var i in attrDeclaration){
		var attrName = attrDeclaration[i];
		if (i==attrDeclaration.length-1){
			query += attrName.name + ') VALUES '
		}else{
			query += attrName.name + ', '
		}
	}
	//setting up the values
	for (var i in details.values){
		var valueObj = details.values[i];
		query+='('
		for (var j in attrDeclaration){
			var attr = attrDeclaration[j].name,
			attrType = attrDeclaration[j].type;
			if (j==attrDeclaration.length-1){
				query += this.generateSQLWrappers(valueObj[attr],attrType);
			}else{
				query += this.generateSQLWrappers(valueObj[attr],attrType) +', ';
			}
		}
		if (i==details.values.length-1){
			query+=');'
		}else{
			query+='), '
		}
	}
	return query;
}

pgDAO.prototype.generateSQLWrappers = function(value,type){
	var convertedValue;
	switch(type.toLowerCase()){
		case 'string':
			convertedValue='\''+value+'\'';
			break;
		default:
			convertedValue = value;
	}
	return convertedValue;
}

pgDAO.prototype.totalRowCount = function(tableName,callback){
	this.conditionalRowCount(tableName,[],callback);
}

pgDAO.prototype.conditionalRowCount = function(tableName,conditions,callback){
	var query = 'SELECT COUNT(*) FROM '+tableName;
	if (conditions.length <= 0){
		query += ';';
	}else{
		query += ' WHERE ';
		for (var i in conditions){
			var condition = conditions[i];
			if (i == conditions.length-1){
				query += condition + ';';
			}else{
				query += condition + ' AND ';
			}
		}//17ZAhg655836
	}

	this.getConnection(query,function(err,result){
		if (err){
			callback(false,err);
		}
		callback(true,result.rows[0].count);
	});
}

pgDAO.prototype.createTable = function(details,callback){

	var query = this.generateCreateTableQuery(details);
	this.getConnection(query,function(err,result){
		if (err){
			callback(false,err);
			return;
		}
		callback(true,result);
	});
}

pgDAO.prototype.dropTable = function(tableName,callback){
	var query = 'DROP TABLE IF EXISTS ' + tableName + ';';
	this.getConnection(query,function(err,result){
		if (err){
			callback(false,err);
			return;
		}
		callback(true,result);
	});
}

pgDAO.prototype.truncateTable = function(tableName,callback){
	var query = 'TRUNCATE TABLE ' + tableName + ';';
	this.getConnection(query,function(err,result){
		if (err){
			callback(false,err);
			return;
		}
		callback(true,result);
	});
}

pgDAO.prototype.checkTableExists = function(tableName,callback){
	var query = 'SELECT relname FROM pg_class WHERE relname = \''+tableName+'\' AND relkind = \'r\';';
	var mainResult;

	this.getConnection(query,function(err,result){
		if (err){
			callback(false,err);
			return;
		}

		mainResult = result;
		callback(true,mainResult);
	});
}

pgDAO.prototype.generateCreateTableQuery = function(details){
	var query = 'CREATE TABLE IF NOT EXISTS';
	query += ' ' + details.name + ' (';
	query += ' ' + details.pk.name + ' ';

	if (details.pk.isGenerated){
		query += 'SERIAL PRIMARY KEY,';
	}else{
		query += details.pk.type + ' PRIMARY KEY,';
	}
	
	for (var i in details.attributes){
		var attribute = details.attributes[i];
		query += ' ' + attribute.name + ' ' + attribute.type;
		if (attribute.isCompulsory){
			query += ' NOT NULL,'
		}else{
			i == details.attributes.length-1 ? '' : query += ','
		}
	}

	query += ');'
	return query;
}

pgDAO.prototype._getDatabaseTablesInformation = function (){
	var queryString = 'SELECT table_schema,table_name FROM information_schema.tables ORDER BY table_schema,table_name;'
	
	this.getConnection(queryString,function(err,result){
		// handle an error from the query
      	if(err) throw err;
	});
}

pgDAO.prototype._setupDefaults = function (){
	pg.defaults.host = '127.0.0.1',
	pg.defaults.port = '5432',
	pg.defaults.poolSize = 30;
}

pgDAO.prototype._getRHCPortForwardingOptions = function (){
	return {
		host:'127.11.8.130:5432',
		port:'5432'
	};
}

module.exports = pgDAO;