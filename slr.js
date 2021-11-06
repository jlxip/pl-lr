"use strict";

// Los ítems los represento como ternas (izquierda, antes del punto, después del punto)

// En parte importante de este código se entiende que
// la colección canónica de SLR es la misma que LR(0), así que
// se intenta reutilizar todo el código de lr.js que se puede
function SLR_clausura(grammar, esTerminal, inicio) {
	const lr1 = LR_clausura(grammar, esTerminal, inicio);
	const lr0 = [];
	for(let item of lr1)
		lr0.push([item[0], item[1], item[2]]); // 🌬 item[3]
	return uniqueArr(lr0);
}

const SLR_goto = (grammar, esTerminal, I, simbolo) =>
	LR_goto(grammar, esTerminal, I, simbolo, SLR_clausura);

const SLR_items = (grammar, esTerminal) =>
	LR_items(grammar, esTerminal, SLR_clausura, SLR_goto);

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

				text += '<li><samp>';
				text += 'I' + i + ' &ni; ' + SLR_item2str(its[j]) + '<br>';
				text += 'SEG(' + its[j][0] + ') = {' + segs.join(', ') + '}';
				for(let seg of segs) {
					text += '<br>Hay una reducción del estado ' + i;
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
