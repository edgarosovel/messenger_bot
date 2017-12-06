var mongo = require('mongodb').MongoClient,
  assert = require('assert');
const config = require(`${__dirname}/../config`);
log = require('winston');
var db;

mongo.connect(config.MONGO_URL, function(err, db_) {
	if (err) {
		log.error(err);
		throw err;
	}else{
		db = db_;
	}
  })

module.exports = {
	insert : (data,tabla,callback) => {
		db.collection(tabla).insertOne(data, function(err, res) {
			return (err) ? callback(err) : callback(false);
		})
	},

	select : (query,tabla,callback) => {
		db.collection(tabla).findOne(query, function(err, res) {
			return (err) ? callback(err) : callback(false,res);
		})
	},

	delete : (id,tabla,callback) => {
		db.collection(tabla).deleteOne({_id:id}, function(err, res) {
			return (err) ? callback(err) : callback(false);
		})
	},

	update : (where,newValues,tabla,callback) => {
		db.collection(tabla).updateOne(where, {$set:newValues},(err, res)=>{
			return (err) ? callback(err) : callback(false);
		})
	}
}