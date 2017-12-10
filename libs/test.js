var request = require('request');
query=encodeURI('Steve Jobs');
  	request({
      uri: `https://es.wikipedia.org/w/api.php?action=opensearch&limit=1&format=json&utf8&search=${query}`,
  	    method: 'GET'
  	  }, function (err, res, body) {
        if (!err){
  	  		try{
  	  			
    		}catch(err){
    			//fb.sendTextMessage(user_id, `Tuve un problema al realizar tu búsqueda. Una disculpa.`);
    		}
        }else{
          //fb.sendTextMessage(user_id, `Tuve un problema al realizar tu búsqueda. Una disculpa.`);
        }
  	  });