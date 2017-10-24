const express = require('express');
const request = require('request');
const path = require('path');
const config = require('./config');
const bodyParser = require('body-parser');
const log = require('./libs/log');
const fb = require('./libs/facebook_api');
const db = require('./libs/db');

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
        if (event.message) {
          handleMessage(event);
        }else if (event.postback) {
          handlePostback(event);  
        }else {
          log.warning("Webhook received unknown event: ", event);
        }
      });
    });
    res.sendStatus(200); //mandar dentro de 20 segundos, confirmando recepcion
  }
});

//Cuando llega un mensaje de texto
function handleMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  log.info(`Received message for user ${senderID} and page ${recipientID} at ${timeOfMessage} with message: ${JSON.stringify(message)}`);

  var messageId = message.mid;
  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    fb.sendTextMessage(senderID, `Mensaje: ${messageText}. Sender ID: ${senderID} Timestamp: ${timeOfMessage}`);
  } else if (messageAttachments) {
    fb.sendTextMessage(senderID, "Message with attachment received");
  }
}

function handlePostback() {

}