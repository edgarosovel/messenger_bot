const fb = require(`./facebook_api`);
var request = require('request');

function convertir(user_id, _from, to, quantity) {
  if(!query)return fb.sendTextMessage(user_id, `Tuve un problema al realizar tu búsqueda. Una disculpa.`);
  	request({
      uri: `https://api.fixer.io/latest?base=${_from}&symbols=MXN`,
  	    method: 'GET'
  	  }, function (err, res, body) {
        if (!err){
  	  		try{
  	  			datos = JSON.parse(body);
	  			  //fb.sendTextMessage(user_id, res);
      		}catch(err){
      			fb.sendTextMessage(user_id, `Tuve un problema al realizar tu búsqueda. Una disculpa.`);
      		}
        }else{
          fb.sendTextMessage(user_id, `Tuve un problema al realizar tu búsqueda. Una disculpa.`);
        }
  	  });
  }

module.exports = {
	wiki : wiki
}