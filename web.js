"use strict";

const textarea = document.getElementById('grammar');
function parse() {
	var grammar = textarea.value;
	grammar = grammar.replaceAll(' ', '');
	grammar = grammar.split('\n');

	// ["S:A|B", "A:a"] se convierte a ["S:A", "S:B", "A:a"]
	const nuevo = [["S'", "S"]];
	for(let i in grammar) {
		const colon = grammar[i].split(':');
		const prods = colon[1].split('|');
		for(let j in prods) {
			nuevo.push([colon[0], prods[j]]);
		}
	}

	const div = document.getElementById('res');
	div.innerHTML = '<h3>Paso 1: nuevo símbolo inicial y enumeración de las producciones</h3>';
	var paso1 = '<table border="1"><tr><td>Nº</td><td>Producción</td></tr>';
	for(let i in nuevo) {
		paso1 += '<tr><td>' + i + '</td><td><samp>';
		paso1 += nuevo[i][0] + ': ' + nuevo[i][1].replaceAll('-', 'ɛ');
		paso1 += '</samp></td></tr>';
	}
	paso1 += '</table>';
	div.innerHTML += paso1;

	// Análisis de los símbolos: ¿Cuáles son terminales?
	const esTerminal = {};
	for(let i in nuevo) {
		// Si está a la izquierda, es NO terminal
		esTerminal[nuevo[i][0]] = false;
	}
	for(let i in nuevo) {
		// Por cada símbolo a la derecha
		const der = nuevo[i][1];
		for(let j in der) {
			// Si está a la derecha y no está aún en esTerminal, entonces es terminal
			if(esTerminal[der[j]] === undefined)
				esTerminal[der[j]] = true;
		}
	}

	div.innerHTML += '<p>Se tiene:</p>';
	var conjs = '<table border="1">';
	conjs += '<tr><td>Símbolo</td><td>INICIALES</td><td>SEGUIDORES</td><td>→*ɛ</td></tr>';
	for(let simbolo in esTerminal) {
		if(esTerminal[simbolo]) continue;
		conjs += '<tr>';
		conjs += '<td><samp>' + simbolo + '</samp></td>';
		conjs += '<td><samp>' + iniciales(nuevo, esTerminal, simbolo).join(', ').replaceAll('-', 'ɛ') + '</samp></td>';
		conjs += '<td><samp>' + seguidores(nuevo, esTerminal, simbolo).join(', ') + '</samp></td>';
		if(derivaEstrella(nuevo, esTerminal, simbolo))
			conjs += '<td>SÍ</td>';
		else
			conjs += '<td>NO</td>';
		conjs += '</tr>';
	}
	conjs += '</table>';
	div.innerHTML += conjs;

	div.innerHTML += '<h3>Paso 2: colección canónica</h3>';
	// Aquí empiezan los algoritmos
	const slr = document.getElementById('SLR').checked;
	const lr = document.getElementById('LR').checked;
	const lalr = false;//document.getElementById('LALR').checked;

	// Se guardan los items repetidos con tal de poder deducir los estados.
	if(slr) {
		var itemsRepes = SLR_items(nuevo, esTerminal);
		var items = SLR_mostrarItems(itemsRepes); // Agrega estados

		div.innerHTML += '<h3>Paso 3: reducciones</h3>';
		var reds = SLR_reducciones(nuevo, esTerminal, items);
		var alg = 'SLR';
	} else if(lr) {
		var itemsRepes = LR_items(nuevo, esTerminal);
		var items = LR_mostrarItems(itemsRepes); // Agrega estados

		div.innerHTML += '<h3>Paso 3: reducciones</h3>';
		var reds = LR_reducciones(nuevo, esTerminal, items);
		var alg = 'LR(1)';
	} else if(lalr) {
	}

	div.innerHTML += '<h3>Paso 4: tabla de análisis</h3>';
	const tabla = calcularTabla(nuevo, esTerminal, itemsRepes, reds);
	mostrarTabla(nuevo, esTerminal, items, tabla, alg);
}


textarea.onchange = parse;
