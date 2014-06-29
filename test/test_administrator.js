//mocha --require test/support/env --reporter dot --check-leaks test/*.js maketest
var after = require('after');
var express = require('express'),
  Administrator = require('../server/entity/administrator'),
  methods = require('methods'),
  assert = require('assert');

describe('Administrator', function(){
  var law = new Administrator({
    username:"Law",
    email:"lawshengxun@gmail.com",
    lastAttemptedLesson:"hello world",
    subjects: ['CAT']
  });

  it('should be able to call username',function(done){
    assert.equal('Law',law.getUsername());
    done();
  });

  it('should be able to call email',function(done){
    assert.equal('lawshengxun@gmail.com',law.getEmail());
    done();
  });

  it('should be able to get the subjects',function(done){
    assert.equal('CAT',law.getSubjects()[0]);
    done();
  });
});