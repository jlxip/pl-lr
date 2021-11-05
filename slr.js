"use strict";

// Los ítems los represento como ternas (izquierda, antes del punto, después del punto)

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

function SLR_clausura(grammar, esTerminal, inicio) {
	var abiertos = [inicio];
	const cerrados = [];

	while(abiertos.length) {
		const item = abiertos[0];
		abiertos = abiertos.slice(1);
		cerrados.push(item);

		// Si detrás del punto hay un NT
		const trasPunto = item[2];
		if(trasPunto.length && !esTerminal[trasPunto[0]]) {
			// Se añaden las producciones de ese símbolo con el punto a la izquierda del todo
			for(let prod of grammar) {
				if(prod[0] === trasPunto[0]) {
					if(prod[1] === '-')
						abiertos.push([trasPunto[0], '-', '']);
					else
						abiertos.push([trasPunto[0], '', prod[1]]);
					//const nitem = [trasPunto[0], '', prod[1]];
					//abiertos.push(nitem);
				}
			}
		}
	}

	return cerrados;
}

function SLR_goto(grammar, esTerminal, I, simbolo) {
	// Se recorren todos los ítems de "I" intentando desplazar "simbolo"
	const paraClausura = [];
	for(let i in I) {
		const item = [...I[i]]; // Copia profunda, mucho rato perdido por culpa de esto 👀
		// ¿Se puede desplazar?
		if(item[2].length && item[2][0] === simbolo) {
			item[1] += item[2][0];
			item[2] = item[2].slice(1);
			paraClausura.push(item);
		}
	}

	var resultado = paraClausura;
	for(let item of paraClausura) {
		const clausura = SLR_clausura(grammar, esTerminal, item);
		resultado = resultado.concat(clausura.slice(1));
	}

	return uniqueArr(resultado);
}

function SLR_items(grammar, esTerminal) {
	const div = document.getElementById('res');
	const ret = [];

	const I0 = SLR_clausura(grammar, esTerminal, ["S'", "", "S"]);
	// (I anterior, símbolo, repetido, ítems)
	ret.push([-1, '', -1, I0]);

	// Siguientes conjuntos de ítems
	var ultimoIterminado = -1;
	while(++ultimoIterminado !== ret.length) {
		const Iidx = ultimoIterminado;
		const I = ret[Iidx][3];
		// ¿Repetido?
		if(ret[Iidx][2] !== -1)
			continue;

		// goto(I, ...)

		// ¿Qué símbolos hay a la derecha del punto?
		const simbolos = [];
		for(let prod of I) {
			const derecha = prod[2];
			if(derecha.length) {
				const simbolo = derecha[0];
				if(!simbolos.includes(simbolo))
					simbolos.push(simbolo);
			}
		}

		// goto con cada símbolo
		for(let i in simbolos) {
			const simbolo = simbolos[i];
			const items = SLR_goto(grammar, esTerminal, I, simbolo);

			// ¿Repetido?
			var repetido = -1;
			for(let j in ret) {
				if(compArr(ret[j][3], items)) {
					// Este conjunto de ítems está repetido, es el mismo que Ij
					repetido = j;
					break;
				}
			}

			ret.push([Iidx, simbolo, repetido, items]);
		}
	}

	return ret;
}

function SLR_item2str(item) {
	// ¿Punto a la derecha?
	var ret = '';
	if(item[2] === '') ret += '<u>';
	ret += '[' + item[0] + ': ' + item[1].replaceAll('-', 'ɛ') + '·' + item[2] + ']';
	if(item[2] === '') ret += '</u>';
	return ret;
}

function SLR_items2str(items) {
	var ret = '{';
	const arr = [];
	for(let item of items)
		arr.push(SLR_item2str(item));
	ret += arr.join(', ');
	ret += '}';
	return ret;
}

function SLR_mostrarItems(items) {
	const div = document.getElementById('res');

	var texto = '<samp>';
	texto += "I0 = clausura{[S': ·S]} = " + SLR_items2str(items[0][3]) + '<br>';

	const noRepetidos = [items[0]];
	var ctr = 1;
	for(let i=1; i<items.length; ++i) {
		const repetido = items[i][2] !== -1;

		if(repetido) texto += '<s>';
		texto += 'I' + ctr;
		if(repetido) texto += '</s>';

		texto += ' = goto(I' + items[i][0] + ', ' + items[i][1] + ') = ';
		texto += SLR_items2str(items[i][3]);

		if(repetido) {
			texto += ' = I' + items[i][2];
		} else {
			++ctr;
			noRepetidos.push(items[i]);
		}

		texto += '<br>';
	}

	texto += '</samp>';
	div.innerHTML += texto;

	return noRepetidos;
}

function SLR_reducciones(grammar, esTerminal, items) {
	const div = document.getElementById('res');

	var ret = [];
	var text = '<ul>';
	for(let i in items) {
		// ¿Items con el punto al final?
		const its = items[i][3];
		for(let j in its) {
			if(its[j][2] === '') {
				// Tiene el punto al final: definitivamente reduce en fila "i"
				// ¿Columna? Seguidores de A
				const segs = seguidores(grammar, esTerminal, its[j][0]);
				//ret.push([i, segs]);

				text += '<li><samp>';
				text += 'I' + i + ' &ni; ' + SLR_item2str(its[j]) + '<br>';
				text += 'SEG(' + its[j][0] + ') = {' + segs.join(', ') + '}';
				for(let seg of segs) {
					text += '<br>Hay una reducción del estado I' + i;
					text += ' con \'' + seg + '\' por la producción ';
					const estaProd = [its[j][0], its[j][1]+its[j][2]];
					for(let k in grammar) {
						if(compArr(grammar[k], estaProd)) {
							text += k;
							ret.push([i, seg, k]);
							break;
						}
					}
				}
				text += '</samp></li>';
			}
		}
	}
	text += '</ul>';
	div.innerHTML += text;

	return ret;
}



function SLR_tabla(grammar, esTerminal, items, reds) {
	const tabla = [ /* [fila, columna, texto] */ ];
	// --- DESPLAZAMIENTOS ---
	for(let i in items)
		tabla.push([items[i][0], items[i][1], 's'+Number(i)]);
	// --- REDUCCIONES ---
	for(let red of reds) {
		if(red[0] == 0 && red[1][0] == '$' && red[2] == 0) continue;
		tabla.push([red[0], red[1], 'r'+red[2]]);
	}

	return tabla;
}

function SLR_mostrarTabla(grammar, esTerminal, items, tabla) {
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
		texto += '<td><samp>I' + fila + '</samp></td>';

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
		div.innerHTML += '<p>Existen conflictos. La gramática no es SLR.</p>';
}
