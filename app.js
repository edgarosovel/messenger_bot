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
              fb.sendTextMessage(event.sender.id, `Hola 👋, mi nombre es Lenna y seré tu asistente personal.\nEstas son algunas de las cosas que puedo hacer por ti:\n\n🔹Hacer cáluclos matemáticos simples.\n🔹Jugar el clásico juego de "gato".\n🔹Informarte del clima según tu ubicación.\n🔹Darte el significado de palabras.\n🔹Buscar información en Wikipedia.\n🔹Agendar recordatorios para mandarte un mensaje en la fecha y hora que me digas.`);
            }
          }
        })
      });
    });
    res.sendStatus(200); //mandar dentro de 20 segundos, confirmando recepcion
  }
});

//Cuando llega un mensaje de texto
function handleMessage(event, user) {
  var timeOfMessage = event.timestamp;
  var message = event.message;
  //log.info(`Received message for user ${senderID} and page ${recipientID} at ${timeOfMessage} with message: ${JSON.stringify(message)}`);
  var messageText = message.text;
  var quickReply = message.quick_reply;
  var messageAttachments = message.attachments;
  if (message.nlp) var nlp = message.nlp.entities

  console.log(message);

  if (messageText) {
    if (quickReply){
      if (/gato/i.test(quickReply.payload)){
        gato.handler(quickReply.payload, user);
      }else if(/^rec/i.test(quickReply.payload)){
        recordatorios.handler({option:quickReply.payload,user:user});
      }else if('climalocation' == quickReply.payload){
        //clima.clima(lat,long, user._id);
      }
    }else{
      if (user.changeDate){
          new_date = nlp.datetime ? nlp.datetime[0].value : undefined;
          recordatorios.handler({option:'recnewdate', user:user, recordatorio_id:user.changeDate, dateToSend:new_date})
      }else if(nlp.intent){ // check kind of intent
        console.log(nlp);
        switch (nlp.intent[0].value){
          case 'jugar':
            gato.handler('gatointent', user);
          break;
          case 'clima':
            clima.ask_location(user._id);
          break;
          case 'definir':
            word = (nlp.wikipedia_search_query) ? nlp.wikipedia_search_query[0].value : undefined;
            definiciones.definiciones(user._id, word); //no debería ser reminder
          break;
          case 'recordatorio':
            if (nlp.reminder && nlp.datetime)
              recordatorios.handler({option:'recintent', user:user, message: nlp.reminder[0].value, dateToSend:nlp.datetime[0].value});
            else 
              fb.sendTextMessage(user._id, `Necesito que me des un mensaje y una hora/fecha para guardar tu recordatorio`);
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
            if(nlp.math_expression)
              matEval.matEval(user._id, nlp.math_expression[0].value); 
          break;
          case 'buscar':
            query = (nlp.wikipedia_search_query) ? nlp.wikipedia_search_query[0].value : undefined;
            wikipedia.wiki(user._id, query);
          break;
          case 'ayuda':
            fb.sendTextMessage(user._id, `Estas son algunas de las cosas que puedo hacer por ti:\n\n🔹Hacer cáluclos matemáticos simples.\n🔹Jugar el clásico juego de "gato".\n🔹Informarte del clima según tu ubicación.\n🔹Darte el significado de palabras.\n🔹Buscar información en Wikipedia.\n🔹Agendar recordatorios para mandarte un mensaje en la fecha y hora que me digas.\n\nHecho con 💙 por: Edgar Osornio Velázquez, Teo Carlos Sánchez Balderas y Jorge Maya Moreno`);
          break;
        }
      }else{
        fb.sendTextMessage(user._id, `Perdón, no te entendí. Si necesitas ayuda, solo escribe "ayuda".`);
      }
    }
  } else if (messageAttachments) {
    if (messageAttachments[0].type == 'location'){
      console.log(messageAttachments[0].payload);
      lat = messageAttachments[0].payload.coordinates.lat;
      long = messageAttachments[0].payload.coordinates.long;
      if (user.useLocationFor=='clima'){
        clima.clima(user._id,lat, long);
      }
    }
  }
}

// function handlePostback() {

// }