var mongo = require('mongodb').MongoClient,
  assert = require('assert');
const config = require(`${__dirname}/../config`);
log = require('winston');
var users;

mongo.connect(config.MONGO_URL, function(err, db) {
	if (err) {
		log.error(err);
		throw err;
	}
	users = db.collection('users');
  })

module.exports = {
	insert : (data,callback) => {
		users.insertOne(data, function(err, res) {
			return (err) ? callback(err) : callback(false);
		})
	},

	select : (query,callback) => {
		users.findOne(query).toArray(function(err, res) {
			return (err) ? callback(err) : callback(false,res);
		})
	},

	delete : (id, callback) => {
		users.deleteOne({_id:id}, function(err, obj) {
			return (err) ? callback(err) : callback(false);
		})
	}

	update : (where, newValues, callback) => {
		users.updateOne(where,newValues,(err, res)=>{
			return (err) ? callback(err) : callback(false);
		})
	}
}