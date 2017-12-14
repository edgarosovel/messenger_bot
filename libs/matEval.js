const fb = require(`./facebook_api`);

function matEval(user_id, expresion){
	var reg = /((([\-+.*/^\(]+)|([0-9]+))(([\-+.*/%^\(]+)|([0-9]+))((\)+)|([0-9]?)))+/g;
	var potencia = /(([0-9]+)|([0-9]+\.[0-9]+))\^(([0-9]+\.[0-9]+)|([0-9]+))/g;
	// m = reg.exec(mensaje);
	// if (!m) return fb.sendTextMessage(user_id,"Parece que lo que escribiste no es una expresión matemática.");
	// expresion = m[0];
	if(!expresion) return fb.sendTextMessage(user_id,"Parece que lo que escribiste no es una expresión matemática.");
	if(reg.test(expresion)){
		try{
			tmp = expresion;
			expresion = expresion.replace(potencia,'Math.pow($1,$4)');
			//expresion = expresion.replace('^','**');
			fb.sendTextMessage(user_id, `${tmp} = ${eval(expresion)}`);
		}catch(err){
			fb.sendTextMessage(user_id, "Perdón, mis chips no pudieron evaluar esa expresión. Puede ser que esté mal escrita.");
		}
	}else{
		fb.sendTextMessage(user_id,"Parece que lo que escribiste no es una expresión matemática.");
	}
}

module.exports = {
	matEval : matEval
}