// Funciones comunes a todos los algoritmos
"use strict";

// Resulta que JS no permite comparar arrays
const compArr = (a, b) => JSON.stringify([...a].sort()) == JSON.stringify([...b].sort());
function uniqueArr(a) {
	var ret = [];
	for(let x of a)
		ret.push(JSON.stringify(x));
	ret = unique(ret);
	for(let i in ret)
		ret[i] = JSON.parse(ret[i]);
	return ret;
}

function calcularTabla(grammar, esTerminal, items, reds) {
	const tabla = [ /* [fila, columna, texto] */ ];
	// --- DESPLAZAMIENTOS ---
	var ctr = 0;
	for(let i in items) {
		// Tan fácil como que si se repite, su estado es el conjunto de ítems que copia
		var texto = 's';
		if(items[i][2] === -1)
			texto += ctr++;
		else
			texto += items[i][2];

		tabla.push([items[i][0], items[i][1], texto]);
	}

	// --- REDUCCIONES ---
	for(let red of reds) {
		if(red[0] == 0 && red[1][0] == '$' && red[2] == 0) continue;
		tabla.push([red[0], red[1], 'r'+red[2]]);
	}

	return tabla;
}

function mostrarTabla(grammar, esTerminal, items, tabla, alg) {
	const div = document.getElementById('res');
	div.innerHTML += '<p>A la izquierda de la barra, <samp>ACTION</samp>. A la derecha, <samp>GOTO</samp>.</p>';

	// Terminales y no terminales, ordenados alfabéticamente
	var term = [];
	var noterm = [];
	for(let i in esTerminal) {
		if(i[0] === "S") continue;
		if(esTerminal[i]) term.push(i);
		else noterm.push(i);
	}
	term = term.sort().concat(['$', '|']);
	noterm = ['S'].concat(noterm.sort());
	const simbolos = term.concat(noterm);

	// Síntesis de la tabla
	const tab = [];
	for(let fila=0; fila<items.length; ++fila) {
		tab.push([]);
		for(let col=0; col<simbolos.length; ++col) {
			tab[fila].push('');
			// Barra separadora
			if(col === term.length-1)
				tab[fila][col] = '|';
		}
	}
	var conflictos = false;
	for(let entrada of tabla) {
		if(entrada[0] === -1) continue;
		const fila = entrada[0];
		const simbolo = entrada[1];
		const col  = simbolos.indexOf(simbolo);
		if(tab[fila][col].length) {
			tab[fila][col] += '/';
			conflictos = true;
		}
		tab[fila][col] += entrada[2];

		// Si es la parte GOTO, se quita el 's' del string.
		if(col >= term.length)
			tab[fila][col] = tab[fila][col].slice(1);
	}
	tab[1][term.length-2] = 'ACC';

	var texto = '<table border="1">';

	// Columnas
	texto += '<tr><td><samp>Estado</samp></td>';
	for(let simbolo of simbolos)
		texto += '<td><center><samp>' + simbolo + '</samp></center></td>';
	texto += '</tr>';

	for(let fila=0; fila<items.length; ++fila) {
		texto += '<tr>';
		texto += '<td><samp>' + fila + '</samp></td>';

		for(let col=0; col<simbolos.length; ++col) {
			texto += '<td><center><samp>';
			var conflictoAqui = false;
			if(tab[fila][col].indexOf('/') !== -1) conflictoAqui = true;
			if(conflictoAqui) texto += '<b style="color: red">';
			texto += tab[fila][col];
			if(conflictoAqui) texto += '</b>';
			texto += '</samp></center></td>';
		}

		texto += '</tr>';
	}

	texto += '</table>';
	div.innerHTML += texto;

	if(conflictos)
		div.innerHTML += '<p>Existen conflictos. La gramática <b>no</b> es ' + alg + '.</p>';
	else
		div.innerHTML += '<p>No hay conflictos. La gramática <b>es</b> ' + alg + '.</p>';
}
