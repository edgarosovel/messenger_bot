const readline = require('readline');


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
	if(input.toLowerCase()=="salir") {return rl.close();}
	input = input.split('-');
	id = input[0];
	msg = input[1];
});