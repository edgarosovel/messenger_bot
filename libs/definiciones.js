const fb = require(`./facebook_api`);
var request = require('request');

function definiciones(user_id, palabra){
	if (!palabra) return fb.sendTextMessage(user_id, `Tuve problemas para definir la palabra.`);
	var response = `Definiciones de ${palabra}:\n`;
	request({
	    headers: {
	    	'Accept': 'application/json',
	    	'app_key': 'c99b09b093e1378509e15264fdfe5d03',
	    	'app_id': 'e19eec4d'
	    },
	    uri: 'https://od-api.oxforddictionaries.com:443/api/v1/entries/es/'+encodeURI(palabra),
	    method: 'GET'
	  }, function (err, res, body) {
	  	if(!err){
	  		try{
	  			reg = /"definitions":(\s|\n)+\[(\s|\n)+".+"(\s|\n)+\]/g;
	  			s = body;
	  			nArray = "[";
	  			do{
	  				m = reg.exec(s)
	  				if (m){
	  					nArray = `${nArray}{${m[0]}},`;
	  				}
	  			}while(m)
	  			nArray = nArray.substr(0,nArray.length-1)+"]";
			  	results = JSON.parse(nArray);
			  	lim = (3 < results.length)?3:results.length;
			    for (var x = 0; x < lim; x++){
			    	response = `${response}\n${x+1}.- ${results[x].definitions[0]}.`;//Ej: ${results.senses[x].examples[0]}\n`;
			    }
			    fb.sendTextMessage(user_id, response);
			}catch(err){
				fb.sendTextMessage(user_id, `No tengo idea de lo que sea "${palabra}"`);
			}
		}else{
			fb.sendTextMessage(user_id, `No tengo idea de lo que sea "${palabra}"`);
		}
	  });
}

module.exports = {
	definiciones : definiciones
}