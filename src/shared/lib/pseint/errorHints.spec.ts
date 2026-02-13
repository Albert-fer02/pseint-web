import { describe, expect, it } from 'vitest'
import { getPseintErrorHint } from './errorHints'

describe('getPseintErrorHint', () => {
  describe('basic syntax errors', () => {
    it('hints for unsupported statement', () => {
      const hint = getPseintErrorHint('Sentencia no soportada')
      expect(hint).toContain('sintaxis exacta')
    })

    it('hints for statement outside algorithm', () => {
      const hint = getPseintErrorHint('fuera de Algoritmo o Funcion')
      expect(hint).toContain('antes de FinAlgoritmo')
    })

    it('hints for missing FinAlgoritmo', () => {
      const hint = getPseintErrorHint('Falta "FinAlgoritmo"')
      expect(hint).toContain('FinAlgoritmo')
    })

    it('hints for missing FinSi', () => {
      const hint = getPseintErrorHint('Falta "FinSi"')
      expect(hint).toContain('FinSi')
    })

    it('hints for missing FinPara', () => {
      const hint = getPseintErrorHint('Falta "FinPara"')
      expect(hint).toContain('FinPara')
    })

    it('hints for missing FinMientras', () => {
      const hint = getPseintErrorHint('Falta "FinMientras"')
      expect(hint).toContain('FinMientras')
    })

    it('hints for missing Hasta Que', () => {
      const hint = getPseintErrorHint('Falta "Hasta Que"')
      expect(hint).toContain('Hasta Que')
    })

    it('hints for missing FinSegun', () => {
      const hint = getPseintErrorHint('Falta "FinSegun"')
      expect(hint).toContain('FinSegun')
    })

    it('hints for missing FinFuncion', () => {
      const hint = getPseintErrorHint('Falta "FinFuncion"')
      expect(hint).toContain('FinFuncion')
    })

    it('hints for missing FinSubProceso', () => {
      const hint = getPseintErrorHint('Falta "FinSubProceso"')
      expect(hint).toContain('FinSubProceso')
    })

    it('hints for missing semicolon', () => {
      const hint = getPseintErrorHint('Falta ";"')
      expect(hint).toContain('punto y coma')
    })

    it('hints for missing Entonces', () => {
      const hint = getPseintErrorHint('Falta "Entonces"')
      expect(hint).toContain('Entonces')
    })

    it('hints for missing Hacer', () => {
      const hint = getPseintErrorHint('Falta "Hacer"')
      expect(hint).toContain('Hacer')
    })

    it('hints for unexpected token', () => {
      const hint = getPseintErrorHint('Token inesperado')
      expect(hint).toContain('inesperado')
    })
  })

  describe('variable errors', () => {
    it('hints for undeclared variable', () => {
      const hint = getPseintErrorHint('Variable no declarada: promedio')
      expect(hint).toContain('Declara "promedio"')
    })

    it('hints for already declared variable', () => {
      const hint = getPseintErrorHint('Variable ya declarada')
      expect(hint).toContain('duplicada')
    })
  })

  describe('input errors', () => {
    it('hints for missing input', () => {
      const hint = getPseintErrorHint('Falta valor para la entrada "edad"')
      expect(hint).toContain('edad')
      expect(hint).toContain('campo de entrada')
    })
  })

  describe('type errors', () => {
    it('hints for type mismatch', () => {
      const hint = getPseintErrorHint('La variable num1 requiere un Real')
      expect(hint).toContain('num1')
      expect(hint).toContain('Real')
    })

    it('hints for unrecognized type', () => {
      const hint = getPseintErrorHint('Tipo de dato no reconocido')
      expect(hint).toContain('Entero, Real')
    })

    it('hints for type conversion failure', () => {
      const hint = getPseintErrorHint('No se puede convertir')
      expect(hint).toContain('tipo correcto')
    })

    it('hints for non-numeric value', () => {
      const hint = getPseintErrorHint('Valor no es un numero')
      expect(hint).toContain('numero')
    })

    it('hints for non-boolean value', () => {
      const hint = getPseintErrorHint('Valor no es logico')
      expect(hint).toContain('Verdadero o Falso')
    })

    it('hints for empty string error', () => {
      const hint = getPseintErrorHint('Cadena vacia no valida')
      expect(hint).toContain('cadena vacia')
    })

    it('hints for return type mismatch', () => {
      const hint = getPseintErrorHint('Se esperaba tipo Entero pero se obtuvo Cadena')
      expect(hint).toContain('Entero')
      expect(hint).toContain('Cadena')
    })
  })

  describe('arithmetic errors', () => {
    it('hints for division by zero', () => {
      const hint = getPseintErrorHint('Division por cero')
      expect(hint).toContain('divisor')
      expect(hint).toContain('distinto de 0')
    })

    it('hints for zero step in for loop', () => {
      const hint = getPseintErrorHint('El paso en Para no puede ser 0')
      expect(hint).toContain('paso')
      expect(hint).toContain('distinto de 0')
    })
  })

  describe('loop errors', () => {
    it('hints for iteration limit exceeded', () => {
      const hint = getPseintErrorHint('Se supero el limite de iteraciones')
      expect(hint).toContain('bucle infinito')
    })

    it('hints for infinite loop detected', () => {
      const hint = getPseintErrorHint('Ciclo infinito detectado')
      expect(hint).toContain('condicion de salida')
    })

    it('hints for invalid loop condition', () => {
      const hint = getPseintErrorHint('Condicion de ciclo invalida')
      expect(hint).toContain('logica')
    })

    it('hints for too many nested loops', () => {
      const hint = getPseintErrorHint('Demasiados ciclos anidados')
      expect(hint).toContain('simplificar')
    })
  })

  describe('array errors', () => {
    it('hints for array index out of range', () => {
      const hint = getPseintErrorHint('Indice fuera de rango')
      expect(hint).toContain('limites declarados')
    })

    it('hints for invalid index count', () => {
      const hint = getPseintErrorHint('Cantidad de indices invalida')
      expect(hint).toContain('dimensiones')
    })

    it('hints for negative index', () => {
      const hint = getPseintErrorHint('Indice negativo: -5')
      expect(hint).toContain('positivos')
      expect(hint).toContain('-5')
    })

    it('hints for non-integer index', () => {
      const hint = getPseintErrorHint('Indice no es un numero entero')
      expect(hint).toContain('enteros')
    })

    it('hints for dimension mismatch', () => {
      const hint = getPseintErrorHint('Se esperaban 2 dimensiones pero se usaron 3')
      expect(hint).toContain('2')
      expect(hint).toContain('3')
    })

    it('hints for undeclared array', () => {
      const hint = getPseintErrorHint('Arreglo no declarado')
      expect(hint).toContain('Definir')
    })

    it('hints for invalid dimension', () => {
      const hint = getPseintErrorHint('Dimension invalida: 0')
      expect(hint).toContain('mayor que 0')
      expect(hint).toContain('0')
    })
  })

  describe('string errors', () => {
    it('hints for substring out of range', () => {
      const hint = getPseintErrorHint('Subcadena fuera de rango')
      expect(hint).toContain('largo de la cadena')
    })

    it('hints for invalid string length', () => {
      const hint = getPseintErrorHint('Longitud de cadena invalida')
      expect(hint).toContain('invalida')
    })

    it('hints for invalid character', () => {
      const hint = getPseintErrorHint('Caracter invalido')
      expect(hint).toContain('unico')
    })
  })

  describe('function errors', () => {
    it('hints for function parameter count mismatch', () => {
      const hint = getPseintErrorHint('La funcion sumar espera 2 parametros pero se pasaron 3')
      expect(hint).toContain('sumar')
      expect(hint).toContain('2')
      expect(hint).toContain('3')
    })

    it('hints for undefined function', () => {
      const hint = getPseintErrorHint('Funcion no definida')
      expect(hint).toContain('Define la funcion')
    })
  })

  describe('procedure errors', () => {
    it('hints for procedure parameter count mismatch', () => {
      const hint = getPseintErrorHint('El subproceso imprimir espera 1 parametro pero se pasaron 2')
      expect(hint).toContain('imprimir')
      expect(hint).toContain('1')
      expect(hint).toContain('2')
    })

    it('hints for undefined procedure', () => {
      const hint = getPseintErrorHint('SubProceso no definido')
      expect(hint).toContain('Define el SubProceso')
    })
  })

  describe('recursion errors', () => {
    it('hints for recursion limit exceeded', () => {
      const hint = getPseintErrorHint('Limite de recursion excedido')
      expect(hint).toContain('caso base')
    })

    it('hints for stack overflow', () => {
      const hint = getPseintErrorHint('Stack overflow')
      expect(hint).toContain('infinita')
    })
  })

  describe('operator errors', () => {
    it('hints for invalid operator', () => {
      const hint = getPseintErrorHint('Operador invalido')
      expect(hint).toContain('+, -, *')
    })

    it('hints for incompatible operands', () => {
      const hint = getPseintErrorHint('Operandos incompatibles')
      expect(hint).toContain('compatibles')
    })

    it('hints for division between strings', () => {
      const hint = getPseintErrorHint('Division entre cadenas')
      expect(hint).toContain('ConvertirANumero')
    })

    it('hints for wrong assignment operator (colon instead of arrow)', () => {
      const hint = getPseintErrorHint('Se esperaba "<-" pero se encontro ":"')
      expect(hint).toContain('<-')
    })

    it('hints for wrong assignment operator (equals instead of arrow)', () => {
      const hint = getPseintErrorHint('Se esperaba "=" pero se encontro "==" en asignacion')
      expect(hint).toContain('<-')
    })
  })

  describe('constant errors', () => {
    it('hints for modifying constant', () => {
      const hint = getPseintErrorHint('No se puede modificar una constante')
      expect(hint).toContain('Constante')
      expect(hint).toContain('variable')
    })

    it('hints for duplicate constant', () => {
      const hint = getPseintErrorHint('Constante ya definida')
      expect(hint).toContain('nombre diferente')
    })
  })

  describe('logic errors', () => {
    it('hints for always-true condition', () => {
      const hint = getPseintErrorHint('Condicion siempre verdadera')
      expect(hint).toContain('infinito')
    })

    it('hints for always-false condition', () => {
      const hint = getPseintErrorHint('Condicion siempre falsa')
      expect(hint).toContain('nunca')
    })

    it('hints for unreachable code', () => {
      const hint = getPseintErrorHint('Codigo inalcanzable')
      expect(hint).toContain('nunca se ejecutara')
    })
  })

  describe('assignment errors', () => {
    it('hints for invalid assignment target', () => {
      const hint = getPseintErrorHint('No se puede asignar a')
      expect(hint).toContain('variables')
    })

    it('hints for multiple assignment', () => {
      const hint = getPseintErrorHint('Asignacion multiple no permitida')
      expect(hint).toContain('separadas')
    })
  })

  describe('input/output errors', () => {
    it('hints for reading expression', () => {
      const hint = getPseintErrorHint('No se puede leer una expresion')
      expect(hint).toContain('variables')
    })

    it('hints for empty Escribir', () => {
      const hint = getPseintErrorHint('Escribir requiere al menos un argumento')
      expect(hint).toContain('al menos un valor')
    })
  })

  describe('expression errors', () => {
    it('hints for unrecognized expression', () => {
      const hint = getPseintErrorHint('Expresion no reconocida')
      expect(hint).toContain('operadores')
    })

    it('hints for invalid variable reference', () => {
      const hint = getPseintErrorHint('Referencia de variable invalida')
      expect(hint).toContain('nombres validos')
    })
  })

  describe('resource errors', () => {
    it('hints for insufficient memory', () => {
      const hint = getPseintErrorHint('Memoria insuficiente')
      expect(hint).toContain('memoria')
    })

    it('hints for execution timeout', () => {
      const hint = getPseintErrorHint('Timeout de ejecucion')
      expect(hint).toContain('demasiado')
    })
  })

  describe('unknown errors', () => {
    it('returns null for unmatched error', () => {
      const hint = getPseintErrorHint('Mensaje totalmente desconocido que no matchea nada')
      expect(hint).toBeNull()
    })

    it('handles empty messages', () => {
      const hint = getPseintErrorHint('')
      expect(hint).toBeNull()
    })

    it('handles whitespace-only messages', () => {
      const hint = getPseintErrorHint('   ')
      expect(hint).toBeNull()
    })
  })

  describe('case insensitivity', () => {
    it('matches errors regardless of case', () => {
      const hint1 = getPseintErrorHint('DIVISION POR CERO')
      const hint2 = getPseintErrorHint('division por cero')
      const hint3 = getPseintErrorHint('DiViSiOn PoR cErO')

      expect(hint1).toBeTruthy()
      expect(hint2).toBeTruthy()
      expect(hint3).toBeTruthy()
      expect(hint1).toBe(hint2)
      expect(hint2).toBe(hint3)
    })
  })

  describe('pattern extraction', () => {
    it('extracts variable names correctly', () => {
      const hint = getPseintErrorHint('Variable no declarada: miVariableCompleja123')
      expect(hint).toContain('miVariableCompleja123')
    })

    it('extracts function names and parameters', () => {
      const hint = getPseintErrorHint('La funcion calcularPromedio espera 3 parametros pero se pasaron 1')
      expect(hint).toContain('calcularPromedio')
      expect(hint).toContain('3')
      expect(hint).toContain('1')
    })

    it('extracts type information', () => {
      const hint = getPseintErrorHint('La variable temperatura requiere un Real')
      expect(hint).toContain('temperatura')
      expect(hint).toContain('Real')
    })

    it('extracts numeric values', () => {
      const hint = getPseintErrorHint('Indice negativo: -10')
      expect(hint).toContain('-10')
    })
  })
})
