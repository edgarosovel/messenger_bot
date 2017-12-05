const express = require('express');
const request = require('request');
const path = require('path');
const config = require('./config');
const bodyParser = require('body-parser');
const log = require('./libs/log');
const fb = require('./libs/facebook_api');
const db = require('./libs/db');
const gato = require('./libs/gato/juego_gato');


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
              fb.sendTextMessage(event.sender.id, `Hola, mi nombre es Lenna y seré tu asistente personal`);
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

  if (messageText) {
    if (quickReply){
      if (/gato/i.test(quickReply.payload)){
        gato.handler(quickReply.payload, user);
      }
    }else{
      // check kind of intent
      if (messageText=="gato"){
        gato.handler("gatointent", user);
      }
    }
  } else if (messageAttachments) {

  }
}

// function handlePostback() {

// }