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

function iniciales(grammar, esTerminal, Xs) {
	// ¿Hay más de un símbolo en Xs?
	if(Xs.length > 1) {
		const ret = [];
		// Por cada símbolo
		for(let X of Xs) {
			const Xini = iniciales(grammar, esTerminal, X);
			// ¿Tiene ɛ?
			if(Xini.indexOf('-') !== -1) {
				// Sí lo tiene, hay que sacar los iniciales del símbolo siguiente
				ret.push('-');
			} else {
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

	// ¿Deriva a ɛ?
	if(derivaEpsilon(grammar, esTerminal, X))
		ret.push('-');

	// Por cada producción
	for(let prod of grammar) {
		// cuya parte izquierda sea X
		if(prod[0] === X) {
			// Se añaden los iniciales de la parte derecha
			const ini = iniciales(grammar, esTerminal, prod[1]);
			ret = ret.concat(ini);

			// Si ini no tiene ɛ, se han exaustado los iniciales.
			if(ini.indexOf('-') === -1) break;
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
				ret = ret.concat(seguidores(grammar, esTerminal, grammar[i][0]));
			} else {
				// Sí
				const beta = grammar[i][1][idx+1];
				// ¿β deriva estrella a ɛ?
				// Esto es lo mismo que preguntar si ɛ∊INICIALES(β)
				//    (Gracias al libro del dragón por este apunte que simplifica todo)
				const ini = iniciales(grammar, esTerminal, beta);
				if(iniciales(grammar, esTerminal, beta).indexOf('-') !== -1) {
					ret = ret.concat(seguidores(grammar, esTerminal, grammar[i][0]));
				} else {
					// No deriva estrella a ɛ
					const aux = iniciales(grammar, esTerminal, beta);
					for(let x of aux)
						if(x !== '-')
							ret.push(x);
				}
			}
		}
	}

	return unique(ret);
}
