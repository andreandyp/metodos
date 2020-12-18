$(document).ready(function () {
	//Renderizar los <select></select>
	$("select").material_select();

	var variables = 1,
		restricciones = 1;


	/*
	Notas importantes:

	1.En todas las funciones siguientes, al localizar a un elemento, se agrega un .parent()
	porque todos los componentes los envuelve un div.input-field

	2.Todos los e.preventDefault() están ahí porque uso <a></a> como botones para el FAB
	*/

	$("#agregarVar").click(function (e) {
		e.preventDefault();
		if (variables === 20) {
			return Materialize.toast("No puedes agregar más de 20 variables", 1000);
		}

		$("#x" + variables).parent().after(agregarElemento(variables + 1, "x"));

		//Agregar las nuevas variables a todas las restricciones
		for (let i = 1; i <= restricciones; i++) {
			$("#r" + i + variables).parent().after(agregarElemento(variables + 1, "r", i));
		}
		++variables;
	});

	$("#eliminarVar").click(function (e) {
		e.preventDefault();
		if (variables === 1) {
			return Materialize.toast("No puedes eliminar más variables", 1000);
		}
		$("#x" + variables).parent().remove();

		//Eliminar las variables de todas las restricciones
		for (let i = restricciones; i >= 1; i--) {
			$("#r" + i + variables).parent().remove();
		}
		--variables;
	});

	$("#agregarRestr").click(function (e) {
		e.preventDefault();
		if (restricciones === 50) {
			return Materialize.toast("No puedes agregar más de 50 restricciones", 1000);
		}
		//Agregar un rX1 para poder ubicar a los nuevos a partir de este
		//La referencia es la etiqueta donde están las de no negatividad
		$("h5").parent().before(agregarElemento(1, "r", ++restricciones));

		for (let i = 1; i < variables; i++) {
			$("#r" + restricciones + i).parent().after(agregarElemento(i + 1, "r", restricciones));
		}

		//Añadir la desigualdad
		$("#r" + restricciones + variables).parent().after(añadirDesigualdad(crearDiv("r"), restricciones));
		//Renderizar los nuevos <select></select>
		$("select").material_select();

		//Añadir el Resultado X
		//Doble .parent() porque Materialize agrega un <div></div> wrapper
		$("#signo" + restricciones).parent().parent().after(añadirResultado(crearDiv("r"), restricciones));

		//Agregar un hr
		$("#res" + restricciones).parent().after("<div class='col s12 m12'><hr></div>");
	});

	$("#eliminarRestr").click(function (e) {
		e.preventDefault();
		if (restricciones === 1) {
			return Materialize.toast("No puedes eliminar más restricciones", 1000);
		}

		//Eliminar resultado
		$("#res" + restricciones).parent().remove();

		//Eliminar todas las restricciones
		for (let i = variables; i >= 1; i--) {
			$("#r" + restricciones + i).parent().remove();
		}

		//Doble .parent() porque Materialize agrega un <div></div> wrapper
		$("#signo" + restricciones).parent().parent().remove();

		--restricciones;

		//Eliminar hr y el div al que pertenecen
		//Usar $("hr")[restricciones - 1].parent().remove() no sirve
		$("div.s12.m12").has("hr")[restricciones - 1].remove();
	});

	$("#calcular").click(function () {
		$("#impresion").empty();

		//Valores de las variables
		var valoresVars = [];
		for (let i = 1; i <= variables; i++) {
			let valor = $("#x" + i).val();
			if (!valor) {
				valor = 0;
				$("#x" + i).val(0);
			}
			valoresVars.push(valor);
		}

		//Valores de las restricciones y sus resultados
		var valoresRestr = obtenerValoresRestr(variables, restricciones);
		Materialize.updateTextFields();

		var iteraciones = $("#iteraciones").val(),
			vectores = $("#vectores").val();
		if(vectores < 1 || vectores > 1000){
			return Materialize.toast("No puede ser menos de un vector y tampoco más de 1000", 1000);
		}
		if (iteraciones < 1 || iteraciones > 500) {
			return Materialize.toast("No puede ser menos de una iteración y tampoco más de 500", 1000);
		}

		ejecutarAlgoritmo(valoresVars, valoresRestr, variables, restricciones, iteraciones, vectores);

	});

	//Depuración
	/*$("#agregarVar").click();
	$("#x1").val(3);
	$("#x2").val(5);
	$("#agregarRestr").click();
	$("#agregarRestr").click();

	$("#r11").val(4);
	$("#r12").val(2);
	$("#signo1").val("me");
	$("#res1").val(75);

	$("#r21").val(1);
	$("#r22").val(3);
	$("#signo2").val("me");
	$("#res2").val(40);

	$("#r31").val(1);
	$("#r32").val(1);
	$("#signo3").val("ma");
	$("#res3").val(10);

	$("#iteraciones").val(100);
	$("#vectores").val(10);

	$("select").material_select();*/

});

function agregarElemento(vars, tipo, restr = "") {
	var elemento = crearDiv(tipo);

	var label = document.createElement("label");
	label.setAttribute("for", tipo + restr + vars);
	label.innerHTML = tipo + "<sub>" + restr + vars + "</sub>";

	var input = document.createElement("input");
	input.setAttribute("type", "number");
	input.setAttribute("id", tipo + restr + vars);

	elemento.appendChild(label);
	elemento.appendChild(input);

	return elemento;
}

function crearDiv(tipo) {
	var div = document.createElement("div");
	div.classList.add("input-field");
	div.classList.add("col");
	div.classList.add("s6");
	div.classList.add(tipo === "r" ? "m2" : "m3");

	return div;
}

function añadirResultado(div, restr) {
	var label = document.createElement("label");
	label.setAttribute("for", "res" + restr);
	label.innerHTML = "Res " + restr;

	var input = document.createElement("input");
	input.setAttribute("type", "number");
	input.setAttribute("id", "res" + restr);

	div.appendChild(label);
	div.appendChild(input);

	return div;
}

function añadirDesigualdad(div, restr) {
	var opciones = {
		"ma": ">=",
		"me": "<=",
		"ig": "="
	};
	var select = document.createElement("select");

	select.setAttribute("id", "signo" + restr);
	for (let opc in opciones) {
		let option = document.createElement("option");
		option.setAttribute("value", opc);
		option.innerText = opciones[opc];
		select.appendChild(option);
	}
	div.appendChild(select);

	return div;
}

function obtenerValoresRestr(vars, restr) {
	//Arreglo unidimensional
	var valores = [];

	for (let i = 1; i <= restr; i++) {

		//Crear un arreglo dentro de una posición
		//Arreglo dentro de arreglo = arreglo bidimensional
		valores[i - 1] = new Array();

		for (let j = 1; j <= vars; j++) {
			let valor = parseInt($("#r" + i + j).val());
			if (!valor) {
				valor = 0;
				$("#r" + i + j).val(0);
			}
			valores[i - 1][j - 1] = valor;
		}

		//Obtener signos de desigualdades
		var desig = $("#signo" + i).val();
		valores[i - 1][vars] = desig;

		//Obtener resultados de desigualdades
		var resultado = parseInt($("#res" + i).val());
		if (!resultado) {
			$("#res" + i).val(0);
			resultado = 0;
		}
		valores[i - 1][vars + 1] = resultado;
	}
	return valores;
}

function ejecutarAlgoritmo(valoresVars, valoresRestr, vars, restr, iter, nVectores) {
	var valoresZ = {},
		limites = obtenerLimites(valoresRestr, vars, restr);

	var hilo = thread({
		env: {
			vars,
			restr,
			limites,
			valoresRestr,
			valoresVars,
			evaluarRestricciones,
			checarDesigualdades,
			nVectores
		}
	});

	for (let n = 1; n <= iter; n++) {
		imprimir("Número de iteración: " + n, n, true);
		var task = hilo.run(function () {
			var numerosAleatorios = [],
				textoResultado = [],
				valoresGenerados = {},
				resultadosDesigualdades = [],
				resultadoHilo = [];

			for (let i = 1; i <= env.vars; i++) {
				numerosAleatorios[i - 1] = new Array();
				for (let j = 1; j <= env.nVectores; j++) {
					numerosAleatorios[i - 1][j - 1] = (Math.trunc(Math.random() * env.limites[i - 1]));
					valoresGenerados["x" + i + j] = numerosAleatorios[i - 1][j - 1];
					textoResultado.push("Valores de x" + i + "-" + j + ": " + numerosAleatorios[i - 1][j - 1] + "<br>");
				}
			}

			for (let i = 1; i <= env.restr; i++) {
				env.evaluarRestricciones(env.valoresRestr, numerosAleatorios, env.vars, i, valoresGenerados, env.nVectores);
			}

			var z = 0;
			for (let i = 1; i <= env.nVectores; i++) {
				resultadosDesigualdades = env.checarDesigualdades(valoresGenerados, env.valoresRestr, env.vars, env.restr, i);
				textoResultado.push(resultadosDesigualdades[1]);
				if (resultadosDesigualdades[0] === true) {
					for (let j = 1; j <= env.vars; j++) {
						z += env.valoresVars[j - 1] * valoresGenerados["x" + j + i];
					}
					textoResultado.push("Valor de Z = " + z+"<br>");
				}
				resultadoHilo.push(textoResultado);
				resultadoHilo.push(z);
			}

			return resultadoHilo;
		});

		task.then(function (resultado) {
			imprimir(resultado[0].join(""), n);
			if (resultado[1]) {
				valoresZ[n] = resultado[1];
			}
			if (n == iter) {
				buscarMaxMin(valoresZ);
			}
		}).catch(function (err) {
			console.log(err);
		});
	}
}

function obtenerLimites(valoresRestr, vars, restr) {
	var valoresMax = [];
	for (let i = 1; i <= restr; i++) {
		for (let j = 1; j <= vars; j++) {
			let limite = valoresRestr[i - 1][vars + 1] / valoresRestr[i - 1][j - 1];

			//Evitar una división entre 0
			if (limite !== Infinity) {
				//Es mejor hacer esto que inicializar los valoresMax con 0
				valoresMax[j - 1] = (valoresMax[j - 1] === undefined) ? 0 : valoresMax[j - 1];

				//Obtener el valor más alto
				valoresMax[j - 1] = limite > valoresMax[j - 1] ? limite : valoresMax[j - 1];
			}
		}
	}

	//Sacar los ceros del arreglo
	for (let n of valoresMax) {
		if (valoresMax[n] === 0) {
			valoresMax.splice(n, 1);
		}
	}
	return valoresMax;
}

function evaluarRestricciones(valoresRestr, numsAleatorios, vars, i, valGen, nVectores) {
	var restrActual = 0;

	for (let v = 1; v <= nVectores; v++) {
		for (let j = 1; j <= vars; j++) {
			restrActual += valoresRestr[i - 1][j - 1] * (numsAleatorios[j - 1][v - 1]);
		}
		valGen["res" + i + v] = restrActual;
	}


}

function checarDesigualdades(valGen, valoresRestr, vars, restr, j) {
	var resCumplio = true,
		resTexto = [],
		resTotal = [];

	for (let i = 1; i <= restr; i++) {

		let signo = valoresRestr[i - 1][vars];

		switch (signo) {

		case "ma":
			if (valGen["res" + i + j] >= valoresRestr[i - 1][vars + 1]) {
				resTexto.push("Se cumple la restricción " + i+" (Vector "+j+")<br>");
			} else {
				resCumplio = false;
			}
			break;
		case "me":
			if (valGen["res" + i + j] <= valoresRestr[i - 1][vars + 1]) {
				resTexto.push("Se cumple la restricción " + i+" (Vector "+j+")<br>");
			} else {
				resCumplio = false;
			}
			break;
		case "ig":
			if (valGen["res" + i + j] === valoresRestr[i - 1][vars + 1]) {
				resTexto.push("Se cumple la restricción " + i+" (Vector "+j+")<br>");
			} else {
				resCumplio = false;
			}
			break;
		}
	}
	resTotal[0] = resCumplio;
	resTotal[1] = resTexto.join("");
	return resTotal;
}

function imprimir(texto, nIteracion, nuevo) {
	if (nuevo === true) {
		var p = document.createElement("p");
		p.setAttribute("id", "iter" + nIteracion);
		p.appendChild(document.createTextNode(texto));
		$("#impresion").append(p);
	} else {
		var textoInterno = $("#iter" + nIteracion).html();
		$("#iter" + nIteracion).html(textoInterno + "<br>" + texto);
	}
}

function buscarMaxMin(valoresZ) {
	var valZ = [],
		p = document.createElement("p");
	p.setAttribute("style", "color: red;");

	for (let n in valoresZ) {
		valZ.push(valoresZ[n]);
	}
	if (valZ.length === 0) {
		p.appendChild(document.createTextNode("No se encontró Z"));
		$("p")[2].before(p);
		return;
	}

	valZ.sort();

	if($("input[name=maxmin]:checked").val() === "max"){
		p.appendChild(document.createTextNode("Valor máximo de Z = " + valZ[valZ.length - 1]));
		for (let n in valoresZ) {
			if (valoresZ[n] === valZ[valZ.length - 1]) {
				p.innerHTML += "<br>en la iteración " + n;
			}
		}
	}else{
		p.appendChild(document.createTextNode("Valor mínimo de Z = " + valZ[0]));
		for (let n in valoresZ) {
			if (valoresZ[n] === valZ[0]) {
				p.innerHTML += "<br>en la iteración " + n;
			}
		}
	}
	$("p")[2].before(p);
}