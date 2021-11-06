"use strict";

function derivaEpsilon(grammar, esTerminal, X) {
	for(let prod of grammar)
		if(prod[0] === X && prod[1] === '-')
			return true;
	return false;
}

function unique(l) {
	const s = new Set(l);
	const ret = [];
	for(let i of s) {
		ret.push(i);
	}
	return ret;
}

function derivaEstrella(grammar, esTerminal, X) {
	/*
		Plan A (costoso)
		Derivar X de todas las maneras posibles hasta encontrar ɛ.
		Problema: pueden haber muchas derivaciones, como Y→Z→B→C→ɛ.
		O peor, Y→Z→BC→RT→Qɛ→P→ɛ

		Plan B (más simple)
		Reducir ɛ a todos los no terminales que se pueda hasta encontrar Y.
	*/

	var red = grammar;
	while(!derivaEpsilon(red, esTerminal, X)) {
		// Dame un no terminal Y que derive a ɛ
		var Y = '';
		for(let prod of red) {
			if(prod[1] === '-') {
				Y = prod[0];
				break;
			}
		}

		// ¿Hay alguno?
		if(Y === '') {
			// No. Definitivamente X no deriva estrella a ɛ
			return false;
		}

		// Nueva gramática sustituyendo Y por ɛ
		const newred = [];
		for(let prod of red) {
			// Si la producción es desde Y, pasamos
			if(prod[0] === Y)
				continue;

			var regla = prod[1].replaceAll(Y, '-');
			// ɛɛ = ɛ
			while(true) {
				const aux = regla.replaceAll('--', '-');
				if(aux === regla)
					break;
				regla = aux;
			}
			// αɛβ = αβ
			if(regla.length !== 1)
				regla = regla.replaceAll('-', '');
			newred.push([prod[0], regla]);
		}

		red = newred;
	}

	// ¡Reducción de ɛ a Y!
	return true;
}

function iniciales(grammar, esTerminal, Xs, visitados=[]) {
	// ¿Hay más de un símbolo en Xs?
	if(Xs.length > 1) {
		var ret = [];
		// Por cada símbolo
		for(let X of Xs) {
			const Xini = iniciales(grammar, esTerminal, X, visitados);
			ret = ret.concat(Xini);
			// ¿Tiene ɛ?
			if(Xini.indexOf('-') === -1) {
				// No hay ɛ, terminado.
				break;
			}
		}

		return ret;
	}
	// Xs solo tiene un símbolo
	const X = Xs[0];

	// ¿Es X terminal?
	if(esTerminal[X]) {
		// Sí; iniciales(X) = {X}
		return [X];
	}
	// Es no terminal

	var ret = [];

	// ¿Deriva estrella a ɛ?
	if(derivaEstrella(grammar, esTerminal, X))
		ret.push('-');

	// ¿Ya visitado?
	if(visitados.indexOf(X) !== -1)
		return ret;
	visitados.push(X);

	// Por cada producción
	for(let prod of grammar) {
		// cuya parte izquierda sea X
		if(prod[0] === X) {
			// Se añaden los iniciales de la parte derecha
			const ini = iniciales(grammar, esTerminal, prod[1], visitados);
			ret = ret.concat(ini);
		}
	}

	return unique(ret);
}

function seguidores(grammar, esTerminal, A) {
	if(A === "S'") {
		// Los seguidores del símbolo inicial de la gramática son {$}
		return ['$'];
	}

	// ¿En qué producciones aparece en la parte derecha?
	var ret = [];
	for(let i in grammar) {
		for(let val of grammar[i][1].matchAll(A)) {
			const idx = val.index;
			// ¿Hay algo después?
			if(idx === grammar[i][1].length-1) {
				// No
				if(grammar[i][0] !== A)
					ret = ret.concat(seguidores(grammar, esTerminal, grammar[i][0]));
			} else {
				// Sí
				const beta = grammar[i][1].slice(idx+1);
				const inibeta = iniciales(grammar, esTerminal, beta);
				for(let x of inibeta)
					if(x !== '-')
						ret.push(x);

				// ¿β deriva estrella a ɛ?
				// Esto es lo mismo que preguntar si ɛ∊INICIALES(β)
				//    (Gracias al libro del dragón por este apunte que simplifica todo)
				if(inibeta.indexOf('-') !== -1) {
					if(grammar[i][0] !== A)
						ret = ret.concat(seguidores(grammar, esTerminal, grammar[i][0]));
				}
			}
		}
	}

	return unique(ret);
}
