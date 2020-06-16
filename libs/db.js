var mongo = require("mongodb").MongoClient;
const config = require(`${__dirname}/../config`);
var db;

mongo.connect(config.MONGO_URL, function (err, client) {
    if (err) {
        console.log(err);
        throw err;
    } else {
        db = client.db("lenna");
    }
});

module.exports = {
    insert: (data, tabla, callback) => {
        db.collection(tabla).insertOne(data, function (err, res) {
            return err ? callback(err) : callback(false);
        });
    },

    select: (query, tabla, callback) => {
        db.collection(tabla).findOne(query, function (err, res) {
            return err ? callback(err) : callback(false, res);
        });
    },

    select_many: (query, tabla, callback) => {
        db.collection(tabla)
            .find(query)
            .toArray(function (err, res) {
                return err ? callback(err) : callback(false, res);
            });
    },

    select_all: (tabla, callback) => {
        db.collection(tabla)
            .find()
            .toArray(function (err, res) {
                return err ? callback(err) : callback(false, res);
            });
    },

    delete: (where, tabla, callback) => {
        db.collection(tabla).deleteOne(where, function (err, res) {
            return err ? callback(err) : callback(false);
        });
    },

    delete_many: (where, tabla, callback) => {
        db.collection(tabla).deleteMany(where, function (err, res) {
            return err ? callback(err) : callback(false);
        });
    },

    update: (where, newValues, tabla, callback) => {
        db.collection(tabla).updateOne(
            where,
            { $set: newValues },
            (err, res) => {
                return err ? callback(err) : callback(false);
            }
        );
    },
};
