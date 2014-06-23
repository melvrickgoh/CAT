
var after = require('after');
var express = require('express'),
  User = require('../server/entity/user'),
  methods = require('methods'),
  assert = require('assert');

describe('User', function(){
  var mel = new User({
    username:"Mel",
    email:"melvrickgoh@hotmail.com",
    lastAttemptedLesson:"hello"
  });

  it('should be able to call username',function(){
    assert.equal('Mel',mel.getUsername());
    //done();
  });

  it('should be able to call email',function(){
    assert.equal('melvrickgoh@hotmail.com',mel.getEmail());
    //done();
  });
});