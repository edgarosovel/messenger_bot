const emo = require('./static/emoji.json');
const lines = require('./static/lines');
const log = require('winston');
const db = require(`${__dirname}/../db`);
const fb = require(`${__dirname}/../facebook_api`);

function handler(option, user){
	// play
	// accept new game
	// decline new game
	// make a move
	if (/gato[1-9]/i.test(option)){
		// handle move
		number = Number(option.substr(4));
		game(number, user)
	}else if(option == "gatointent"){
		// user may want to play
		fb.sendConfirmationMessage(user._id, `¡Juguemos gato!. ¿Aceptas el reto?`, `gatoplay`);
	}else if(option == "1gatoplay"){
		// accepted game
		check_game_status(user);	
	}else if(optino == "0gatoplay"){
		// game not accepted
	}
}

function check_game_status(user){
	if (user.gato.game) // if there is already a game, play
		fb.sendGatoMessage(user._id, `No hemos terminado este juego ${format_board(user.gato.game)}`, get_number_buttons(user.gato.game) );
	else{ // if the is no ongoing game, make one
		gato = {game:[0,0,0,0,0,0,0,0,0], lines:{1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0}};
		db.update({_id:user._id}, {gato:gato}, `users` ,(err)=>{
			if (!err){
				fb.sendGatoMessage(user._id, `¡A jugar! ${format_board(gato.game)}`, get_number_buttons(gato.game) );
			}
		})
	}
}

function game(number, user){
	if (user.gato.game) {// game should exist
		gato = user.gato;
		if (number!=null) {
			if (gato.game[number-1] == 0) { //if square not played
				var {gato, win} = handle_move(gato, number, 1); // user move. 1 means X
				if (win){
					//user won
					db.update({_id:user._id}, {gato:""}, `users` ,(err)=>{
	    				if (!err){
	    					fb.sendConfirmationMessage(user._id, `¡Felicidades, ganaste! ¿Deseas jugar de nuevo?`, `gatoplay`);
	    				}
	    			})	
				}else if (Object.keys(gato.lines).length==0) {
					// handle a draw game
					db.update({_id:user._id}, {gato:""}, `users` ,(err)=>{
	    				if (!err){
	    					fb.sendConfirmationMessage(user._id, `Uff, parece que empatamos. ¿Te gustaría jugar de nuevo?`, `gatoplay`);
	    				}
	    			})
				}else{
					var {gato, win} = bot_response(gato);
					if (win) {
						// bot won
						db.update({_id:user._id}, {gato:""}, `users` ,(err)=>{
		    				if (!err){
		    					fb.sendConfirmationMessage(user._id, `¡Ja, te gané! ¿Quieres la revancha?`, `gatoplay`);
		    				}
		    			})
					}else if (Object.keys(gato.lines).length==0) {
					}else{
						//game continues
						db.update({_id:user._id}, {gato:gato}, `users` ,(err)=>{
		    				if (!err){
		    					var board = format_board(gato.game);
		    					fb.sendGatoMessage(user._id, `${board}`, get_number_buttons(gato.game));
		    				}
		    			})
					}	
				}	
			} else{
				//square aleady taken
				fb.sendGatoMessage(user._id, `¡La casilla ${emo[number]} ya no está disponible! ${format_board(gato.game)}`, get_number_buttons(gato.game) );
			}
		}else{
			// not a valid number (null)
		}	
	}else{ //should exist a game
	}
}

function handle_move(gato, number, mark){
	win = false;
	gato.game[number-1] = mark; //make player move on board. 1 means an X, -1 means O
	for (l in lines.lines[number]){ //remove/update possible winning lines
		if (lines.lines[number][l] in gato.lines) { //if the line is still there...
			if ( gato.lines[lines.lines[number][l]]!=0 && ((gato.lines[lines.lines[number][l]]<0) != (mark<0)) ) { //if line was already played, delete it
				delete gato.lines[lines.lines[number][l]]
			}else{
				gato.lines[lines.lines[number][l]] += mark;	//update line
				if (gato.lines[lines.lines[number][l]]==3 || gato.lines[lines.lines[number][l]]==-3) {
					win=true;
					break //breaks for
				}
			}
		}
	}

	return {gato:gato, win:win};
}

function bot_response(gato){
	// play on line with -2 to win
	// if not, play on line with highest number
	// if no high number, play on lowest number
	win = false;
	highest = 0;
	lowest = 0;

	for (l in gato.lines){
		if (gato.lines[l] == -2){
			to_win = gato.lines[l];
		}else if (gato.lines[l] > highest) {
			highest = gato.lines[l];
		}else if (gato.lines[l] < lowest){
			lowest = gato.lines[l];
		}else{
			line_to_play = gato.lines[l];
		}
	}

	line_to_play = (to_win) ? to_win : (highest > 0) ? highest : (lowest < 0) ? lowest : line_to_play;

	for (n of lines.squares[line_to_play]){
		if (gato.game[n-1] == 0) {
			number_to_play = gato.game[n-1];
			break;
		}
	}

	return handle_move(gato, number_to_play, -1);
}

function get_number_buttons(game){
	numbers = [];
	for (i in game) {
		if (game[i]==0) {
			numbers.push({
				content_type: `text`,
                title: emo[i+1],
                payload: `gato${i+1}`
              })
		}
	}

	return numbers;
}

function format_board(game){
	let s = "\n|"
	for (var x = 0; x < 9; x++) {
		if (x==3 || x==6) s+="\n|"
		switch (game[x]){
			case 1:{
				s+=`${emo.x}|`
				break
			}
			case -1:{
				s+=`${emo.o}|`
				break
			}
			default:{
				s+=`${emo[x+1]}|`
				break
			}
		}
	}
	return s;
}

module.exports = {
	handler:handler
}