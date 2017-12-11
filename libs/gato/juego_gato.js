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
		//fb.sendConfirmationMessage(user._id, `¡Juguemos gato! ¿Aceptas el reto?`, `gatoplay`);
		check_game_status(user);
	}else if(option == "1gatoplay"){
		// accepted game
		check_game_status(user);	
	}else if(option == "0gatoplay"){
		// game not accepted
		fb.sendTextMessage(user._id, `🐔🐔🐔`);
	}
}

function check_game_status(user){
	if (user.gato && user.gato.game) // if there is already a game, play
		fb.sendButtonsMessage(user._id, `No hemos terminado este juego ${format_board(user.gato.game)}`, get_number_buttons(user.gato.game) );
	else{ // if the is no ongoing game, make one
		gato = {game:[0,0,0,0,0,0,0,0,0], lines:{1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0}};
		db.update({_id:user._id}, {gato:gato}, `users` ,(err)=>{
			if (!err){
				fb.sendButtonsMessage(user._id, `¡A jugar! Tú empiezas.${format_board(gato.game)}`, get_number_buttons(gato.game) );
			}
		})
	}
}

function game(number, user){
	if (user.gato.game) {// game should exist
		gato = user.gato;
		win=false;
		if (number!=null) {
			if (gato.game[number-1] == 0) { //if square not played
				[gato, win] = handle_move(gato, number, 1); // user move. 1 means X
				if (win){
					//user won
					db.update({_id:user._id}, {gato:""}, `users` ,(err)=>{
	    				if (!err){
	    					fb.sendConfirmationMessage(user._id, `¡Felicidades, ganaste! ${format_board(gato.game)}\n¿Deseas jugar de nuevo?`, `gatoplay`);
	    				}
	    			})	
				}else if (Object.keys(gato.lines).length==0) {
					// handle a draw game
					db.update({_id:user._id}, {gato:""}, `users` ,(err)=>{
	    				if (!err){
	    					fb.sendConfirmationMessage(user._id, `Uff, parece que empatamos.${format_board(gato.game)}\n¿Te gustaría jugar de nuevo?`, `gatoplay`);
	    				}
	    			})
				}else{
					[gato, win, casilla_bot] = bot_response(gato);
					if (win) {
						// bot won
						db.update({_id:user._id}, {gato:""}, `users` ,(err)=>{
		    				if (!err){
		    					fb.sendConfirmationMessage(user._id, `¡Ja, te gané! ${format_board(gato.game)}\n¿Quieres la revancha?`, `gatoplay`);
		    				}
		    			})
					}else if (Object.keys(gato.lines).length==0) {
						// handle a draw game
						db.update({_id:user._id}, {gato:""}, `users` ,(err)=>{
		    				if (!err){
		    					fb.sendConfirmationMessage(user._id, `Uff, parece que empatamos.${format_board(gato.game)}\n¿Te gustaría jugar de nuevo?`, `gatoplay`);
		    				}
		    			})
					}else{
						//game continues
						db.update({_id:user._id}, {gato:gato}, `users` ,(err)=>{
		    				if (!err){
		    					var board = format_board(gato.game);
		    					fb.sendButtonsMessage(user._id, `Escojo la casilla ${emo[casilla_bot]} ${board}`, get_number_buttons(gato.game));
		    				}
		    			})
					}	
				}	
			} else{
				//square aleady taken
				fb.sendButtonsMessage(user._id, `¡La casilla ${emo[number]} ya no está disponible! ${format_board(gato.game)}`, get_number_buttons(gato.game) );
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

	return [gato, win];
}

function bot_response(gato){
	// play on line with -2 to win
	// if not, play on line with highest number
	// if no high number, play on lowest number
	to_win = null;
	highest = 0;
	lowest = 0;

	for (l in gato.lines){
		if (gato.lines[l] == -2){
			to_win = l;
		}else if (gato.lines[l] > highest) {
			highest = gato.lines[l];
			highest_line = l;
		}else if (gato.lines[l] < lowest){
			lowest = gato.lines[l];
			lowest_line = l;
		}else{
			line_to_play = l;
		}
	}

	line_to_play = (to_win!=null) ? to_win : (highest > 0) ? highest_line : (lowest < 0) ? lowest_line : line_to_play;

	for (n of lines.squares[line_to_play]){
		if (gato.game[n-1] == 0) {
			number_to_play = n; // handle move takes care of the -1
			break;
		}
	}
	[gato, win] = handle_move(gato, number_to_play, -1);
	return [gato, win, number_to_play];
}

function get_number_buttons(game){
	numbers = [];
	for (i in game) {
		i = Number(i);
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