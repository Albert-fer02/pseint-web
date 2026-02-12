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

  const undeclaredVariable = message.match(/Variable no declarada:\s*([A-Za-z_][A-Za-z0-9_]*)/i)
  if (undeclaredVariable) {
    return `Declara "${undeclaredVariable[1]}" con Definir antes de usarla.`
  }

  const missingInput = message.match(/Falta valor para la entrada "([^"]+)"/i)
  if (missingInput) {
    return `Completa el campo de entrada "${missingInput[1]}" antes de ejecutar.`
  }

  if (/Division por cero/i.test(message)) {
    return 'Valida que el divisor sea distinto de 0 antes de dividir.'
  }

  if (/El paso en Para no puede ser 0/i.test(message)) {
    return 'Usa un paso positivo o negativo distinto de 0 en Para.'
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

  return null
}
