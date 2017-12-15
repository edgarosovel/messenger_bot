const express = require('express');
const request = require('request');
const path = require('path');
const config = require('./config');
const bodyParser = require('body-parser');
const log = require('./libs/log');
const fb = require('./libs/facebook_api');
const db = require('./libs/db');
//
const gato = require('./libs/gato/juego_gato');
const recordatorios = require('./libs/recordatorios');
const clima = require('./libs/clima');
const definiciones = require('./libs/definiciones');
const matEval = require('./libs/matEval');
const wikipedia = require('./libs/wikipedia');
const trafico = require('./libs/trafico');


log.info('||||||||  Lenna is alive |||||||||')
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//Servidor que se mantiene escuchando los mensajes
app.listen(1111, ()=>console.log('Listening :1111/messenger_bot'));

app.get('/messenger_bot', function(req, res) { //webhook validation
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === config.VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});

app.post('/messenger_bot', function (req, res) {
  var data = req.body;
  // Make sure this is a page subscription
  if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;
      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        // if user not in database, save and send info/greetings
        db.select({_id:event.sender.id}, 'users', (err, user) =>{
          if (!err){
            if(user!=null){
              if (event.message) {
                handleMessage(event, user);
              }else if (event.postback) {
                //handlePostback(event);  
              }else {
                log.warning("Webhook received unknown event: ", event);
              }
            }else{
              db.insert({_id:event.sender.id}, 'users', ()=>{});
              info(event.sender.id);
            }
          }
        })
      });
    });
    res.sendStatus(200); //mandar dentro de 20 segundos, confirmando recepcion
  }
});
function info(user_id){
  fb.sendTextMessage(user_id, `Estas son algunas de las cosas que puedo hacer por ti:\n\n🔹Cálculos matemáticos. (Ej. Calcula 2+2)\n🔹Jugar gato. (Ej. Quiero jugar gato)\n🔹Informarte del clima según tu ubicación. (Ej. ¿Cómo está el clima?)\n🔹Darte el tiempo que tomaría ir de un lugar a otro (Ej. ¿Cómo está el tráfico?)\n🔹Dar el significado de palabras. (Ej. Define manzana)`);
  fb.sendTextMessage(user_id, '🔹Buscar en Wikipedia. (Ej. ¿Quién es John Mayer?)\n🔹Agendar recordatorios para mandarte un mensaje en la fecha y hora que me digas. (Ej. Recuérdame ir al super en 30 minutos)\n🔹Ver tus recordatorios. (Ej. ¿Qué recordatorios tengo?)\n🔹Borrar recordatorios (Ej. Quiero borrar un recordatorio)\n🔹Modificar/posponer recordatorios (Ej. Quiero modificar un recordatorio)');
  //fb.sendTextMessage(user_id, 'Hecho con 💙 por: Edgar Osornio Velázquez, Teo Carlos Sánchez Balderas y Jorge Maya Moreno');
}

//Cuando llega un mensaje de texto
function handleMessage(event, user) {
  var timeOfMessage = event.timestamp;
  var message = event.message;
  //log.info(`Received message for user ${senderID} and page ${recipientID} at ${timeOfMessage} with message: ${JSON.stringify(message)}`);
  var messageText = message.text;
  var quickReply = message.quick_reply;
  var messageAttachments = message.attachments;
  if (message.nlp) var nlp = message.nlp.entities;

  if (messageText) {
    if (quickReply){
      if (/gato/i.test(quickReply.payload)){
        gato.handler(quickReply.payload, user);
      }else if(/^rec/i.test(quickReply.payload)){
        recordatorios.handler({option:quickReply.payload,user:user});
      }
    }else{
      if (user.changeDate){
          new_date = nlp.datetime ? nlp.datetime[0].value : undefined;
          recordatorios.handler({option:'recnewdate', user:user, recordatorio_id:user.changeDate, dateToSend:new_date})
      }else if(nlp.intent){ // check kind of intent
        //console.log(nlp);
        switch (nlp.intent[0].value){
          case 'jugar':
            gato.handler('gatointent', user);
          break;
          case 'clima':
            clima.ask_location(user._id);
          break;
          case 'definir':
            word = (nlp.wikipedia_search_query) ? nlp.wikipedia_search_query[0].value : (nlp.math_expression) ? nlp.math_expression[0].value : undefined;
            definiciones.definiciones(user._id, word); //no debería ser math pero wit.ai es cagada
          break;
          case 'recordatorio':
            msj = (nlp.reminder) ? nlp.reminder[0].value : undefined;
            date = (nlp.datetime) ? nlp.datetime[0].value : undefined;
            recordatorios.handler({option:'recintent', user:user, message:msj, dateToSend:date});
          break;
          case 'ver':
            recordatorios.show_recordatorios(user._id, 'recopc');
          break;
          case 'cancelar':
            recordatorios.show_recordatorios(user._id, 'recdel');
          break;
          case 'posponer':
            recordatorios.show_recordatorios(user._id, 'recfec');
          break;
          case 'calcular':
            expresion = (nlp.math_expression) ? nlp.math_expression[0].value : undefined;
            matEval.matEval(user._id, expresion); 
          break;
          case 'buscar':
            query = (nlp.wikipedia_search_query) ? nlp.wikipedia_search_query[0].value : (nlp.math_expression) ? nlp.math_expression[0].value :undefined;
            wikipedia.wiki(user._id, query);
          break;
          case 'trafico':
            trafico.ask_location_from(user._id);
          break;
          case 'ayuda':
            info(user._id);
          break;
          case 'saludo':
            fb.sendTextMessage(user._id, '👋🤖👋');
          break;
        }
      }else{
        fb.sendTextMessage(user._id, `Perdón, no te entendí. Si necesitas ayuda, solo escribe "ayuda".`);
      }
    }
  } else if (messageAttachments) {
    if (messageAttachments[0].type == 'location'){
      //console.log(messageAttachments[0].payload);
      lat = messageAttachments[0].payload.coordinates.lat;
      long = messageAttachments[0].payload.coordinates.long;
      if (user.useLocationFor=='clima'){
        clima.clima(user._id,lat,long);
      }else if(user.useLocationFor=='traficofrom'){
        trafico.ask_location_to(user._id); 
      }else if(user.useLocationFor=='traficoto'){
        trafico.trafico(user._id, user.location.lat, user.location.long,lat,long);
      }
    }
  }
}

// function handlePostback() {

// }