export function getPseintErrorHint(rawMessage: string): string | null {
  const message = rawMessage.trim()

  if (/Sentencia no soportada/i.test(message)) {
    return 'Revisa la linea indicada y verifica la sintaxis exacta de la sentencia.'
  }

  if (/fuera de Algoritmo o Funcion/i.test(message)) {
    return 'Mueve esa sentencia antes de FinAlgoritmo o colócala dentro de una Funcion.'
  }

  if (/Falta "FinAlgoritmo"/i.test(message)) {
    return 'Asegurate de cerrar el programa con FinAlgoritmo al final del archivo.'
  }

  if (/Falta "FinSi"/i.test(message)) {
    return 'Cada Si debe cerrarse con FinSi.'
  }

  if (/Falta "FinPara"/i.test(message)) {
    return 'Cada ciclo Para debe cerrarse con FinPara.'
  }

  if (/Falta "FinMientras"/i.test(message)) {
    return 'Cada ciclo Mientras debe cerrarse con FinMientras.'
  }

  if (/Falta "Hasta Que"/i.test(message)) {
    return 'Cada bloque Repetir debe cerrarse con Hasta Que <condicion>.'
  }

  if (/Falta "FinSegun"/i.test(message)) {
    return 'Cada bloque Segun debe cerrarse con FinSegun.'
  }

  if (/Falta "FinFuncion"/i.test(message)) {
    return 'Cada Funcion debe cerrarse con FinFuncion.'
  }

  if (/Falta "FinSubProceso"/i.test(message)) {
    return 'Cada SubProceso debe cerrarse con FinSubProceso.'
  }

  const undeclaredVariable = message.match(/Variable no declarada:\s*([A-Za-z_][A-Za-z0-9_]*)/i)
  if (undeclaredVariable) {
    return `Declara "${undeclaredVariable[1]}" con Definir antes de usarla.`
  }

  const missingInput = message.match(/Falta valor para la entrada "([^"]+)"/i)
  if (missingInput) {
    return `Completa el campo de entrada "${missingInput[1]}" antes de ejecutar.`
  }

  const typeMismatch = message.match(/La variable\s+([^\s.]+)\s+requiere un\s+(Entero|Real|Logico|Caracter)/i)
  if (typeMismatch) {
    return `La entrada de "${typeMismatch[1]}" debe ser de tipo ${typeMismatch[2]}.`
  }

  if (/Division por cero/i.test(message)) {
    return 'Valida que el divisor sea distinto de 0 antes de dividir.'
  }

  if (/El paso en Para no puede ser 0/i.test(message)) {
    return 'Usa un paso positivo o negativo distinto de 0 en Para.'
  }

  if (/Se supero el limite de iteraciones/i.test(message)) {
    return 'Revisa la condicion de salida del ciclo para evitar un bucle infinito.'
  }

  if (/Indice fuera de rango/i.test(message)) {
    return 'Verifica que los indices del arreglo esten dentro de los limites declarados.'
  }

  if (/Cantidad de indices invalida/i.test(message)) {
    return 'Usa la misma cantidad de indices que dimensiones declaraste en el arreglo.'
  }

  if (/Expresion no reconocida/i.test(message)) {
    return 'Revisa operadores, parentesis y separacion por comas en la expresion.'
  }

  if (/Referencia de variable invalida/i.test(message)) {
    return 'Usa nombres validos como variable o arreglo: nombre o nombre[indice].'
  }

  // Function/Procedure errors
  const paramCountMismatch = message.match(/La funcion\s+([^\s]+)\s+espera\s+(\d+)\s+parametros?\s+pero se pasaron?\s+(\d+)/i)
  if (paramCountMismatch) {
    return `La funcion "${paramCountMismatch[1]}" requiere ${paramCountMismatch[2]} parametros, pero recibio ${paramCountMismatch[3]}. Verifica la llamada.`
  }

  const procedureParamMismatch = message.match(/El subproceso\s+([^\s]+)\s+espera\s+(\d+)\s+parametros?\s+pero se pasaron?\s+(\d+)/i)
  if (procedureParamMismatch) {
    return `El subproceso "${procedureParamMismatch[1]}" requiere ${procedureParamMismatch[2]} parametros, pero recibio ${procedureParamMismatch[3]}. Verifica la llamada.`
  }

  if (/Funcion no definida/i.test(message)) {
    return 'Define la funcion antes de usarla, o verifica que el nombre este escrito correctamente.'
  }

  if (/SubProceso no definido/i.test(message)) {
    return 'Define el SubProceso antes de usarlo, o verifica que el nombre este escrito correctamente.'
  }

  const returnTypeMismatch = message.match(/Se esperaba tipo\s+([^\s]+)\s+pero se obtuvo\s+([^\s]+)/i)
  if (returnTypeMismatch) {
    return `Tipo incorrecto: se esperaba ${returnTypeMismatch[1]} pero se obtuvo ${returnTypeMismatch[2]}. Verifica el valor de retorno.`
  }

  // Array errors
  const negativeIndex = message.match(/Indice negativo:\s*(-?\d+)/i)
  if (negativeIndex) {
    return `Los indices de arreglos deben ser positivos (empiezan en 1). Recibiste: ${negativeIndex[1]}.`
  }

  if (/Indice no es un numero entero/i.test(message)) {
    return 'Los indices de arreglos deben ser numeros enteros. Verifica que no uses decimales o caracteres.'
  }

  const dimensionMismatch = message.match(/Se esperaban?\s+(\d+)\s+dimension(es)?\s+pero se usaron?\s+(\d+)/i)
  if (dimensionMismatch) {
    return `El arreglo tiene ${dimensionMismatch[1]} dimension(es), pero usaste ${dimensionMismatch[3]} indice(s). Deben coincidir.`
  }

  if (/Arreglo no declarado/i.test(message)) {
    return 'Declara el arreglo con Definir antes de usarlo. Ejemplo: Definir arr[10] Como Entero;'
  }

  // Type conversion errors
  if (/No se puede convertir/i.test(message)) {
    return 'El valor no puede ser convertido al tipo requerido. Verifica que uses el tipo correcto de datos.'
  }

  if (/Valor no es un numero/i.test(message)) {
    return 'Se esperaba un numero pero se recibio otro tipo de dato. Verifica la entrada o la variable.'
  }

  if (/Valor no es logico/i.test(message)) {
    return 'Se esperaba un valor logico (Verdadero o Falso) pero se recibio otro tipo.'
  }

  if (/Cadena vacia no valida/i.test(message)) {
    return 'No puedes usar una cadena vacia en este contexto. Verifica tu entrada.'
  }

  // String operation errors
  if (/Subcadena fuera de rango/i.test(message)) {
    return 'Los indices de Subcadena deben estar dentro del largo de la cadena. Verifica tus valores.'
  }

  if (/Longitud de cadena invalida/i.test(message)) {
    return 'La longitud especificada para la operacion de cadena es invalida.'
  }

  if (/Caracter invalido/i.test(message)) {
    return 'El valor debe ser un caracter unico. Verifica que no uses cadenas largas.'
  }

  // Loop errors
  if (/Ciclo infinito detectado/i.test(message)) {
    return 'El ciclo parece infinito. Verifica que la condicion de salida se cumpla eventualmente.'
  }

  if (/Condicion de ciclo invalida/i.test(message)) {
    return 'La condicion del ciclo debe ser una expresion logica (Verdadero/Falso).'
  }

  const nestedLoopLimit = message.match(/Demasiados ciclos anidados/i)
  if (nestedLoopLimit) {
    return 'Tienes demasiados ciclos anidados. Considera simplificar tu logica.'
  }

  // Recursion errors
  if (/Limite de recursion excedido/i.test(message)) {
    return 'La funcion se llama a si misma demasiadas veces. Verifica que tenga un caso base que detenga la recursion.'
  }

  if (/Stack overflow/i.test(message)) {
    return 'Recursion infinita detectada. Asegurate de que tu funcion recursiva tenga una condicion de salida.'
  }

  // Syntax errors (common mistakes)
  if (/Se esperaba "<-" pero se encontro ":"/i.test(message)) {
    return 'Para asignar valores usa "<-" (flecha), no ":". Ejemplo: x <- 5;'
  }

  if (/Se esperaba "=" pero se encontro "=="\s+en asignacion/i.test(message)) {
    return 'Para asignar usa "<-", no "==". El "==" se usa solo para comparar.'
  }

  if (/Falta ";"/i.test(message)) {
    return 'Cada sentencia debe terminar con punto y coma (;).'
  }

  if (/Falta "Entonces"/i.test(message)) {
    return 'Despues de la condicion del Si, debes escribir "Entonces".'
  }

  if (/Falta "Hacer"/i.test(message)) {
    return 'Los ciclos Para, Mientras, etc. requieren "Hacer" despues de la condicion.'
  }

  if (/Token inesperado/i.test(message)) {
    return 'Palabra o simbolo inesperado. Revisa la sintaxis en la linea indicada.'
  }

  // Operator errors
  if (/Operador invalido/i.test(message)) {
    return 'El operador usado no es valido en este contexto. Verifica que uses +, -, *, /, %, Y, O, NO correctamente.'
  }

  if (/Operandos incompatibles/i.test(message)) {
    return 'Los tipos de datos no son compatibles con este operador. Ejemplo: no puedes sumar un numero y una cadena.'
  }

  if (/Division entre cadenas/i.test(message)) {
    return 'No puedes dividir cadenas. Si quieres convertir a numero, usa ConvertirANumero().'
  }

  // Declaration errors
  if (/Variable ya declarada/i.test(message)) {
    return 'No puedes declarar la misma variable dos veces. Usa un nombre diferente o elimina la declaracion duplicada.'
  }

  if (/Tipo de dato no reconocido/i.test(message)) {
    return 'Usa tipos validos: Entero, Real, Cadena, Logico, o Caracter.'
  }

  const dimensionError = message.match(/Dimension invalida:\s*(\d+)/i)
  if (dimensionError) {
    return `La dimension del arreglo debe ser mayor que 0. Recibiste: ${dimensionError[1]}.`
  }

  // Constant errors
  if (/No se puede modificar una constante/i.test(message)) {
    return 'Las constantes declaradas con Constante no pueden ser modificadas. Usa una variable si necesitas cambiar el valor.'
  }

  if (/Constante ya definida/i.test(message)) {
    return 'Ya existe una constante con ese nombre. Usa un nombre diferente.'
  }

  // Logic errors
  if (/Condicion siempre verdadera/i.test(message)) {
    return 'La condicion siempre es verdadera. Esto puede causar un ciclo infinito. Revisa tu logica.'
  }

  if (/Condicion siempre falsa/i.test(message)) {
    return 'La condicion nunca se cumple. El codigo dentro nunca se ejecutara.'
  }

  if (/Codigo inalcanzable/i.test(message)) {
    return 'Este codigo nunca se ejecutara porque esta despues de un return o en una rama imposible.'
  }

  // Assignment errors
  if (/No se puede asignar a/i.test(message)) {
    return 'No puedes asignar valores a expresiones o literales. Solo puedes asignar a variables.'
  }

  if (/Asignacion multiple no permitida/i.test(message)) {
    return 'No puedes asignar varios valores a la vez. Hazlo en sentencias separadas.'
  }

  // Input/Output errors
  if (/No se puede leer una expresion/i.test(message)) {
    return 'Leer solo puede usarse con variables, no con expresiones. Ejemplo: Leer x; (no Leer x+1;)'
  }

  if (/Escribir requiere al menos un argumento/i.test(message)) {
    return 'Escribir necesita al menos un valor para mostrar. No puede estar vacio.'
  }

  // General errors
  if (/Memoria insuficiente/i.test(message)) {
    return 'El programa requiere demasiada memoria. Reduce el tamaño de los arreglos o la complejidad del algoritmo.'
  }

  if (/Timeout de ejecucion/i.test(message)) {
    return 'El programa tardo demasiado en ejecutarse. Verifica que no tengas ciclos infinitos.'
  }

  return null
}
