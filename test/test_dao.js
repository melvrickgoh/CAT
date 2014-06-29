
var after = require('after');
var express = require('express'),
  pgDAO = require('../server/dao/index'),
  methods = require('methods'),
  assert = require('assert');

describe('DAO', function(){
  var dao = new pgDAO({});
  var tableDetails = {
      name: 'epictable',
      pk:{
        isGenerated:true,
        name:'mytable_key',
        type:''
      },
      attributes:[{
        name:'moobars',
        type:'VARCHAR(40)',
        isCompulsory:true
      },{
        name:'foobars',
        type:'VARCHAR(40)',
        isCompulsory:false
      }]
    };
  var insertDetails = {
    name:'epictable',
    attributes:[{name:'moobars',type:'string'},{name:'foobars',type:'string'}],
    values:[{
      moobars:'helloworldmoo',
      foobars:'helloworldfoo'
    }]
  };
  var additionalInsertDetails = [{
      moobars:'helloworldmoo3',
      foobars:'helloworldfoo3'
    },{
      moobars:'helloworldmoo4',
      foobars:'helloworldfoo4'
    },{
      moobars:'helloworldmoo5',
      foobars:'helloworldfoo5'
    }];

  it('should be able to generate the basic create table query correctly',function(done){
    
    var tableQuery = 'CREATE TABLE IF NOT EXISTS epictable ( mytable_key SERIAL PRIMARY KEY, moobars VARCHAR(40) NOT NULL, foobars VARCHAR(40));';

    assert.equal(tableQuery,dao.generateCreateTableQuery(tableDetails));
    done();
  });

  it('should be able to create table query correctly',function(done){
    this.timeout(5000);//approx time taken to complete the test
    
    dao.createTable(tableDetails,function(isSuccess,result){
      var result = dao.checkTableExists(tableDetails.name,function(isSuccess,result){
        assert.equal(1,result.rowCount);
        done();
      });
    });
  });

  it('should be able to delete the table created',function(done){
    this.timeout(5000);

    dao.dropTable(tableDetails.name,function(isSuccess,result){
      var result = dao.checkTableExists(tableDetails.name,function(isSuccess,result){
        assert.equal(0,result.rowCount);
        done();
      });
    });
  });

  it('should be able to truncate the table created',function(done){
    this.timeout(10000);

    dao.createTable(tableDetails,function(isSuccess,result){
      dao.truncateTable(tableDetails.name,function(isSuccess,result){
        dao.totalRowCount(tableDetails.name,function(isSuccess,result){
          assert.equal(0,result);
          //clean up test table
          dao.dropTable(tableDetails.name,function(isSuccess,result){
            done();
          });
        })
      })
    });
  });

  it('should be able to generate single insert query correctly',function(){
    var query = dao.generateInsertQuery(insertDetails);
    var correctQuery = 'INSERT INTO epictable (moobars, foobars) VALUES (\'helloworldmoo\', \'helloworldfoo\');'
    assert.equal(correctQuery,query);
  });

  it('should be able to generate multiple insert query correctly',function(){
    insertDetails.values.push({
      moobars:'helloworldmoo2',
      foobars:'helloworldfoo2'
    });
    var query = dao.generateInsertQuery(insertDetails);
    var correctQuery = 'INSERT INTO epictable (moobars, foobars) VALUES (\'helloworldmoo\', \'helloworldfoo\'), (\'helloworldmoo2\', \'helloworldfoo2\');'
    assert.equal(correctQuery,query);
  });

  it('should be able to execute single insert query correctly',function(done){
    this.timeout(10000);

    dao.createTable(tableDetails,function(isSuccess,result){
      dao.insert(insertDetails,function(isSuccess,result){
        assert.equal(0,0);
        //clean up test table
        dao.dropTable(tableDetails.name,function(isSuccess,result){
          done();
        });
      });
    });

  });

  it('should be able to generate select query (basic) correctly',function(){
    var selectDetails = {
      name:'epictable'
    }

    var query = dao.generateSelectQuery(selectDetails);
    var correctQuery = 'SELECT * FROM epictable ;';
    assert.equal(correctQuery,query);
  });

  it('should be able to generate select query (with single selective attribute) correctly',function(){
    var selectDetails = {
      name:'epictable',
      attributes:['moobars']
    }

    var query = dao.generateSelectQuery(selectDetails);
    var correctQuery = 'SELECT moobars FROM epictable ;';
    assert.equal(correctQuery,query);
  });

  it('should be able to generate select query (with multiple selective attribute) correctly',function(){
    var selectDetails = {
      name:'epictable',
      attributes:['moobars','foobars']
    }

    var query = dao.generateSelectQuery(selectDetails);
    var correctQuery = 'SELECT moobars, foobars FROM epictable ;';
    assert.equal(correctQuery,query);
  });

  it('should be able to generate select query (single condition) correctly',function(){
    var selectDetails = {
      name:'epictable',
      conditions:['moobars = \'helloworldmoo5\'']
    }

    var query = dao.generateSelectQuery(selectDetails);
    var correctQuery = 'SELECT * FROM epictable WHERE moobars = \'helloworldmoo5\' ;';
    assert.equal(correctQuery,query);
  });

  it('should be able to generate select query (attributes & single condition) correctly',function(){
    var selectDetails = {
      name:'epictable',
      attributes:['moobars','foobars'],
      conditions:['moobars = \'helloworldmoo5\'']
    }

    var query = dao.generateSelectQuery(selectDetails);
    var correctQuery = 'SELECT moobars, foobars FROM epictable WHERE moobars = \'helloworldmoo5\' ;';
    assert.equal(correctQuery,query);
  });

  it('should be able to generate select query (multiple conditions) correctly',function(){
    var selectDetails = {
      name:'epictable',
      conditions:['moobars = \'helloworldmoo5\'','foobars = \'helloworldfoo5\'']
    }

    var query = dao.generateSelectQuery(selectDetails);
    var correctQuery = 'SELECT * FROM epictable WHERE moobars = \'helloworldmoo5\' AND foobars = \'helloworldfoo5\' ;';
    assert.equal(correctQuery,query);
  });

  it('should be able to generate select query (attributes & multiple conditions) correctly',function(){
    var selectDetails = {
      name:'epictable',
      attributes:['moobars','foobars'],
      conditions:['moobars = \'helloworldmoo5\'','foobars = \'helloworldfoo5\'']
    }

    var query = dao.generateSelectQuery(selectDetails);
    var correctQuery = 'SELECT moobars, foobars FROM epictable WHERE moobars = \'helloworldmoo5\' AND foobars = \'helloworldfoo5\' ;';
    assert.equal(correctQuery,query);
  });

  it('should be able to generate select query (with ORDER) correctly',function(){
    var selectDetails = {
      name:'epictable',
      order:'DESC'
    }

    var query = dao.generateSelectQuery(selectDetails);
    var correctQuery = 'SELECT * FROM epictable ORDER BY DESC ;';
    assert.equal(correctQuery,query);
  });

  it('should be able to generate select query (with LIMIT) correctly',function(){
    var selectDetails = {
      name:'epictable',
      limit: 2
    }

    var query = dao.generateSelectQuery(selectDetails);
    var correctQuery = 'SELECT * FROM epictable LIMIT 2;';
    assert.equal(correctQuery,query);
  });

  it('should be able to generate select query (DISTINCT) correctly',function(){
    var selectDetails = {
      name:'epictable',
      distinct:true
    }

    var query = dao.generateSelectQuery(selectDetails);
    var correctQuery = 'SELECT DISTINCT * FROM epictable ;';
    assert.equal(correctQuery,query);
  });

  it('should be able to select from database',function(done){
    this.timeout(10000);
    var selectDetails = {
      name:'epictable'
    }

    insertDetails.values = additionalInsertDetails;

    dao.createTable(tableDetails,function(isSuccess,result){
      dao.insert(insertDetails,function(isSuccess,result){
        dao.select(selectDetails,function(isSuccess,result){
          assert.equal(3,result.length);
          done();
        });
      });
    });
  });
});