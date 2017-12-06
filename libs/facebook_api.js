const config = require(`${__dirname}/../config`);
const log = require('winston');
const request = require('request');

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: config.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      log.info(`Mensaje con id ${messageId} enviado a ${recipientId}: ${messageData}`);
    } else {
      log.error(`No se pudo mandar el mensaje: ${messageData}\nResponse: ${response}\nError: ${error} Body:${body}`);
    }
  });  
}

module.exports={
  sendTextMessage: function (recipientId, messageText) {
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        text: messageText
      }
    };
    callSendAPI(messageData);
  },
  sendGatoMessage: function (recipientId, messageText, buttons) {
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        text: messageText,
        quick_replies: buttons
      }
    };  

    callSendAPI(messageData);
  },
  sendConfirmationMessage: function (recipientId, messageText, payload) {
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        text: messageText,
        quick_replies: [{
            content_type: "text",
            title: "Sí",
            payload: `1${payload}`
          },
          {
            content_type: "text",
            title: "No",
            payload: `0${payload}`
          }
        ] 
      }
    };  

    callSendAPI(messageData);
  },
  askUserLocationMessage: function (recipientId, payload) {
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        text: messageText,
        quick_replies:[
          {
            content_type: "location",
            payload: payload
          }
        ]  
      }
    };  

    callSendAPI(messageData);
  }
}