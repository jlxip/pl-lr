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
	var tabla = '<table border="1"><tr><td>Nº</td><td>Producción</td></tr>';
	for(let i in nuevo) {
		tabla += '<tr><td>' + i + '</td><td><samp>';
		tabla += nuevo[i][0] + ': ' + nuevo[i][1];
		tabla += '</samp></td></tr>';
	}
	tabla += '</table>';
	div.innerHTML += tabla;

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

	div.innerHTML += '<h3>Paso 2: colección canónica</h3>';
	// Aquí empiezan los algoritmos
	const slr = document.getElementById('SLR').checked;
	const lr = false;//document.getElementById('LR').checked;
	const lalr = false;//document.getElementById('LALR').checked;
	if(slr) {
		var items = SLR_items(nuevo, esTerminal);
		items = SLR_mostrarItems(items); // Devuelve no repetidos

		div.innerHTML += '<h3>Paso 3: reducciones</h3>';
		const reds = SLR_reducciones(nuevo, esTerminal, items);

		div.innerHTML += '<h3>Paso 4: tabla sintáctica</h3>';
		const tabla = SLR_tabla(nuevo, esTerminal, items, reds);
		SLR_mostrarTabla(nuevo, esTerminal, items, tabla);
	} else if(lr) {
	} else if(lalr) {
	}
}


textarea.onchange = parse;
