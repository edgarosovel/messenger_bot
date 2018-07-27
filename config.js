CONFIG_DEV = {};

try {
	CONFIG_DEV = require('./config_dev');
}catch(e){
	console.log("No DEV keys found. Deploy mode on.");
}

module.exports={
	PAGE_ACCESS_TOKEN: process.env.PAGE_ACCESS_TOKEN || CONFIG_DEV.PAGE_ACCESS_TOKEN,
	VERIFY_TOKEN: process.env.VERIFY_TOKEN || CONFIG_DEV.VERIFY_TOKEN,
	MONGO_URL: process.env.MONGO_URL || CONFIG_DEV.MONGO_URL,
}