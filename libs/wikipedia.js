const fb = require(`./facebook_api`);
var request = require('request');

function wiki(user_id, query) {
  if(!query)return fb.sendTextMessage(user_id, `Tuve un problema al realizar tu búsqueda. Una disculpa.`);
	query=encodeURI(query);
  	request({
      uri: `https://es.wikipedia.org/w/api.php?action=opensearch&limit=1&format=json&utf8&search=${query}`,
  	    method: 'GET'
  	  }, function (err, res, body) {
        if (!err){
  	  		try{
  	  			datos = JSON.parse(body);
	            if (datos[2][0]!=''){
	              res = `${datos[2][0].replace(/\[[0-9][0-9]?\]/g,'')}\n${datos[3][0]}`;
	            }else{
	            	res = `Este enlace te puede servir: ${datos[3][0]}`;
	            }
	  			fb.sendTextMessage(user_id, res);
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