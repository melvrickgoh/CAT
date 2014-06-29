
var after = require('after');
var express = require('express'),
  User = require('../server/entity/user'),
  Administrator = require('../server/entity/administrator'),
  methods = require('methods'),
  assert = require('assert');

describe('User', function(){
  var mel = new User({
    username:"Mel",
    email:"melvrickgoh@hotmail.com",
    lastAttemptedLesson:"hello"
  });

  it('should be able to call username',function(done){
    assert.equal('Mel',mel.getUsername());
    done();
  });

  it('should be able to call email',function(done){
    assert.equal('melvrickgoh@hotmail.com',mel.getEmail());
    done();
  });

  it('should be able to log current date',function(done){
    mel.logVisit();
    var d = mel.getLastVisit();
    mel.logVisit();
    var e = mel.getLastVisit();
    assert.notEqual(d,e);
    done();
  });
});