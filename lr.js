"use strict";

// Los ítems los represento como tuplas (izquierda, antes del punto, después del punto, símbolos de anticipación)

function anticipacion(grammar, esTerminal, item) {
	// Los símbolos de anticipación, en un escenario [A→α·Bβ, a] son INICIALES(βa)
	// β es, así, todo lo que hay a la derecha del siguiente símbolo tras el punto
	const beta = item[2].slice(1);
	const a = item[3];
	const ret = iniciales(grammar, esTerminal, beta+a);
	if(!ret.length)
		return '$';
	else if(ret.length === 1)
		return ret[0];
	else {
		var txt = '<b>Más de un seguidor en los símbolos de anticipación de \'';
		txt += item + '\'. Esto creo que no ha ocurrido en los ejercicios de clase.';
		txt += ' No sé ni si es posible, y desde luego no sé qué hacer 🤡.</b>';
		document.getElementById('res').innerHTML += txt;
		return undefined;
	}
}

function LR_clausura(grammar, esTerminal, inicio) {
	var abiertos = [inicio];
	const cerrados = [];

	while(abiertos.length) {
		const item = abiertos[0];
		abiertos = abiertos.slice(1);
		// ¿Está "item" en cerrados?
		var estabaCerrado = false;
		for(let cerrado of cerrados) {
			if(compArr(cerrado, item)) {
				estabaCerrado = true;
				break;
			}
		}
		if(estabaCerrado) continue;

		cerrados.push(item);

		// Si detrás del punto hay un NT
		const trasPunto = item[2];
		if(trasPunto.length && !esTerminal[trasPunto[0]]) {
			// Se añaden las producciones de ese símbolo con el punto a la izquierda del todo
			for(let prod of grammar) {
				if(prod[0] === trasPunto[0]) {
					const ant = anticipacion(grammar, esTerminal, item);
					if(prod[1] === '-')
						abiertos.push([trasPunto[0], '-', '', ant]);
					else
						abiertos.push([trasPunto[0], '', prod[1], ant]);
				}
			}
		}
	}

	return cerrados;
}

function LR_goto(grammar, esTerminal, I, simbolo, fClausura=LR_clausura) {
	// Se recorren todos los ítems de "I" intentando desplazar "simbolo"
	const paraClausura = [];
	for(let i in I) {
		const item = [...I[i]];
		// ¿Se puede desplazar?
		if(item[2].length && item[2][0] === simbolo) {
			item[1] += item[2][0];
			item[2] = item[2].slice(1);
			// Al desplazar, los símbolos de anticipación no se tocan
			paraClausura.push(item);
		}
	}

	var resultado = paraClausura;
	for(let item of paraClausura) {
		const clausura = fClausura(grammar, esTerminal, item);
		resultado = resultado.concat(clausura.slice(1));
	}

	return uniqueArr(resultado);
}

function LR_items(grammar, esTerminal, fClausura=LR_clausura, fGoto=LR_goto) {
	const div = document.getElementById('res');
	const ret = [];

	const I0 = fClausura(grammar, esTerminal, ["S'", "", "S", "$"]);
	// (I anterior, símbolo, repetido, ítems)
	ret.push([-1, '', -1, I0]);

	// Siguientes conjuntos de ítems
	var ultimoIterminado = -1;
	var insertados = 0; // Cuántos hay no repetidos (por cuál vamos)
	const repeticiones = []; // Cuáles se han intentado insertar pero estaban repetidos
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
			const items = fGoto(grammar, esTerminal, I, simbolo);

			// ¿Repetido?
			var repetido = -1;
			for(let j in ret) {
				if(compArr(ret[j][3], items)) {
					// Este conjunto de ítems está repetido, es el mismo que Ij
					repetido = j;
					break;
				}
			}

			if(repetido === -1)
				++insertados;
			else
				repeticiones.push(insertados+1);

			/*
				Hay que restar al índice actual cuántos no se han insertado
				por debajo del que se pide. No sé ni yo por qué funciona esto.
				Son las 4 AM. Estoy muy cansado.
			*/
			var offset = 0;
			for(let rep of repeticiones)
				if(rep < Iidx)
					++offset;

			ret.push([Iidx - offset, simbolo, repetido, items]);
		}
	}

	return ret;
}

function LR_item2str(item) {
	// ¿Punto a la derecha?
	var ret = '';
	if(item[2] === '') ret += '<u>';
	ret += '[' + item[0] + ': ';
	ret += item[1].replaceAll('-', 'ɛ') + '·' + item[2];
	ret += ', ' + item[3];
	ret += ']';
	if(item[2] === '') ret += '</u>';
	return ret;
}

function LR_items2str(items) {
	var ret = '{';
	const arr = [];
	for(let item of items)
		arr.push(LR_item2str(item));
	ret += arr.join(', ');
	ret += '}';
	return ret;
}

function LR_mostrarItems(items) {
	const div = document.getElementById('res');

	var texto = '<samp>';
	texto += "I0 = clausura{[S': ·S]} = " + LR_items2str(items[0][3]) + '<br>';

	const noRepetidos = [items[0]];
	var ctr = 1;
	for(let i=1; i<items.length; ++i) {
		const repetido = items[i][2] !== -1;

		if(repetido) texto += '<s>';
		texto += 'I' + ctr;
		if(repetido) texto += '</s>';

		texto += ' = goto(I' + items[i][0] + ', ' + items[i][1] + ') = ';
		texto += LR_items2str(items[i][3]);

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

function LR_reducciones(grammar, esTerminal, items) {
	const div = document.getElementById('res');

	var ret = [];
	var text = '<ul>';
	for(let i in items) {
		// ¿Items con el punto al final?
		const its = items[i][3];
		for(let j in its) {
			if(its[j][2] === '') {
				// Tiene el punto al final: definitivamente reduce en fila "i"
				// ¿Columna? Indicada por el símbolo de anticipación 🥳
				const ant = its[j][3];

				text += '<li><samp>';
				text += 'I' + i + ' &ni; ' + LR_item2str(its[j]) + '<br>';
				text += 'Símbolo de anticipación = ' + ant;
				text += '<br>Hay una reducción del estado I' + i;
				text += ' con \'' + ant + '\' por la producción ';
				const estaProd = [its[j][0], its[j][1]+its[j][2]];
				for(let k in grammar) {
					if(compArr(grammar[k], estaProd)) {
						text += k;
						ret.push([i, ant, k]);
						break;
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
