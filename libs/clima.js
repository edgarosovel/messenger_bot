const fb = require(`./facebook_api`);
var request = require('request');

function ask_location(user_id){
  fb.askUserLocationMessage(user_id,`Para informarte sobre el clima necesito que compartas conmigo tu ubicación.`,`climalocation`);
}

function clima(user_id,lat,long) {
  	request({
      uri: `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=25efee1324d5f5aa1ec2bea01f863448&units=metric&lang=es`,
  	    method: 'GET'
  	  }, function (err, res, body) {
        if (!err){
  	  		try{
  	  		  datos = JSON.parse(body);
            response = `Clima de hoy en ${datos.name}\nEstado: ${datos.weather[0].description}\nTemperatura: ${datos.main.temp}°C \nMínima: ${datos.main.temp_min}°C\nMáxima: ${datos.main.temp_max}°C\nHumedad: ${datos.main.humidity}%`; // http://openweathermap.org/img/w/${datos.weather[0].icon}.png
  			    fb.sendTextMessage(user_id, response);
    			}catch(err){
    				fb.sendTextMessage(user_id, `Tuve un problema para obtener el clima. Una disculpa.`);
    			}
        }else{
          fb.sendTextMessage(user_id, `Tuve un problema para obtener el clima. Una disculpa.`);
        }
  	  });
  }

  module.exports = {
  	clima : clima,
    ask_location: ask_location
  }
