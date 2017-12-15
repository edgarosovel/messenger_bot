const fb = require(`./facebook_api`);
const db = require(`./db`);
var request = require('request');

function ask_location_from(user_id){
  db.update({_id:user_id}, {useLocationFor:'traficofrom'},`users`,(e,r)=>{
    if(!e)fb.askUserLocationMessage(user_id,`¿En dónde te encuentras?`,`traficolocation`);
    else fb.sendTextMessage(user_id, 'Ocurrió un error.');
  });
}

function ask_location_to(user_id, latOrig, longOrig){
  db.update({_id:user._id}, {location:{lat:latOrig, long:longOrig}},`users`,(e,r)=>{
    if(!e){
      db.update({_id:user_id}, {useLocationFor:'traficoto'},`users`,(e,r)=>{
        if(!e)fb.askUserLocationMessage(user_id,`¿Hacia dónde te diriges?`,`traficolocation`);
        else fb.sendTextMessage(user_id, 'Ocurrió un error.');
      });
    }else fb.sendTextMessage(user_id, 'Ocurrió un error.');
  });
}

function trafico(user_id, latOrigen, longOrigen, latDestino, longDestino) {
  var request = require('request');
  	var response = `Datos del Tráfico:\n`;
  	request({
      //uri: `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=20.5911214,-100.3945889&destinations=20.7045684,-100.4456643&key=AIzaSyD4ET1QB6uWbKg4XlOKatzSA8MJgqoM8v4`,
      uri: `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${latOrigen},${longOrigen}&destinations=${latDestino},${longDestino}&key=AIzaSyD4ET1QB6uWbKg4XlOKatzSA8MJgqoM8v4`,
  	    method: 'GET'
  	  }, function (err, res, body) {
        if(!err){
  	  		try{
  	  		   datos = JSON.parse(body);
              response = `${response}Origen: ${datos.origin_addresses[0]}\nDestino:${datos.destination_addresses[0]}\nDistancia: ${datos.rows[0].elements[0].distance.text} \nTiempo estimado: ${datos.rows[0].elements[0].duration.text}`;
  			     fb.sendTextMessage(user_id, response);
    			}catch(err){
    				fb.sendTextMessage(user_id, 'Tuve problemas para calcular el tráfico. Una disculpa');
    			}
        }else fb.sendTextMessage(user_id, 'Tuve problemas para calcular el tráfico. Una disculpa');
  	  });
  }

  module.exports = {
  	trafico  : trafico,
    ask_location_from: ask_location_from,
    ask_location_to: ask_location_to
  }
