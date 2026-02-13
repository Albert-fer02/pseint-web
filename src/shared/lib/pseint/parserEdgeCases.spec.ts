import { describe, expect, it } from 'vitest'
import { parseProgram } from '@/shared/lib/pseint/parser'

describe('parseProgram - Parser Edge Cases', () => {
  describe('declaration edge cases', () => {
    it('throws for duplicate variable declaration', () => {
      const source = `Algoritmo Test
      Definir x Como Entero;
      Definir x Como Real;
   FinAlgoritmo`

      expect(() => parseProgram(source)).toThrow(/Variable ya declarada/)
    })

    it('throws for invalid variable name', () => {
      const source = `Algoritmo Test
      Definir 123invalid Como Entero;
   FinAlgoritmo`

      expect(() => parseProgram(source)).toThrow(/Declaracion invalida/)
    })

    it('throws for array with non-numeric dimension', () => {
      const source = `Algoritmo Test
      Definir arr[abc] Como Entero;
   FinAlgoritmo`

      expect(() => parseProgram(source)).toThrow(/Dimension invalida/)
    })

    it('throws for array with zero dimension', () => {
      const source = `Algoritmo Test
      Definir arr[0] Como Entero;
   FinAlgoritmo`

      expect(() => parseProgram(source)).toThrow(/Dimension fuera de rango/)
    })

    it('throws for array with negative dimension', () => {
      const source = `Algoritmo Test
      Definir arr[-5] Como Entero;
   FinAlgoritmo`

      expect(() => parseProgram(source)).toThrow(/Dimension/)
    })

    it('throws for duplicate constant name', () => {
      const source = `Algoritmo Test
      Constante PI <- 3.14;
      Constante PI <- 3.1416;
   FinAlgoritmo`

      expect(() => parseProgram(source)).toThrow(/Nombre ya declarado/)
    })

    it('throws for constant with same name as variable', () => {
      const source = `Algoritmo Test
      Definir x Como Entero;
      Constante x <- 5;
   FinAlgoritmo`

      expect(() => parseProgram(source)).toThrow(/Nombre ya declarado/)
    })

    it('parses multi-dimensional arrays correctly', () => {
      const source = `Algoritmo Test
      Definir cubo[2,3,4] Como Real;
   FinAlgoritmo`

      const ast = parseProgram(source)
      expect(ast.declarations[0]?.dimensions).toEqual([2, 3, 4])
    })
  })

  describe('function edge cases', () => {
    it('throws for function with duplicate parameter names', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   Funcion result <- duplicado(x, x)
      result <- x * 2;
   FinFuncion`

      expect(() => parseProgram(source)).toThrow(/Parametro repetido/)
    })

    it('throws for function missing FinFuncion', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   Funcion result <- incompleta(x)
      result <- x + 1;`

      expect(() => parseProgram(source)).toThrow(/Falta "FinFuncion"/)
    })

    it('throws for function with invalid header', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   Funcion  <- (x)
      result <- x;
   FinFuncion`

      expect(() => parseProgram(source)).toThrow(/Cabecera de Funcion invalida/)
    })

    it('parses function with array parameter (unspecified rank)', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   Funcion suma <- sumarArr(valores[])
      suma <- 0;
   FinFuncion`

      const ast = parseProgram(source)
      expect(ast.functions[0]?.parameters[0]?.isArray).toBe(true)
      expect(ast.functions[0]?.parameters[0]?.arrayRank).toBe(1)
    })

    it('parses function with array parameter (specified rank)', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   Funcion suma <- sumarMatriz(mat[,])
      suma <- 0;
   FinFuncion`

      const ast = parseProgram(source)
      expect(ast.functions[0]?.parameters[0]?.isArray).toBe(true)
      expect(ast.functions[0]?.parameters[0]?.arrayRank).toBe(2)
    })

    it('parses function with by-reference parameter (suffix)', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   Funcion result <- test(x Por Referencia)
      x <- x + 1;
      result <- x;
   FinFuncion`

      const ast = parseProgram(source)
      expect(ast.functions[0]?.parameters[0]?.byReference).toBe(true)
    })

    it('parses function with by-reference parameter (prefix)', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   Funcion result <- test(Por Referencia x)
      x <- x + 1;
      result <- x;
   FinFuncion`

      const ast = parseProgram(source)
      expect(ast.functions[0]?.parameters[0]?.byReference).toBe(true)
    })

    it('throws for invalid function parameter format', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   Funcion result <- test(123invalid)
      result <- 0;
   FinFuncion`

      expect(() => parseProgram(source)).toThrow(/Parametro de funcion invalido/)
    })
  })

  describe('subprocess edge cases', () => {
    it('throws for subprocess with duplicate parameter names', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   SubProceso duplicado(a, a)
      Escribir a;
   FinSubProceso`

      expect(() => parseProgram(source)).toThrow(/Parametro repetido/)
    })

    it('throws for subprocess missing FinSubProceso', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   SubProceso incompleto(x)
      Escribir x;`

      expect(() => parseProgram(source)).toThrow(/Falta "FinSubProceso"/)
    })

    it('throws for subprocess with invalid header', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   SubProceso ()
      Escribir "test";
   FinSubProceso`

      expect(() => parseProgram(source)).toThrow(/Cabecera de SubProceso invalida/)
    })

    it('throws for subprocess with return-value arrow syntax (current limitation)', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   SubProceso suma <- calcular(x, y)
      suma <- x + y;
   FinSubProceso`

      expect(() => parseProgram(source)).toThrow(/Expresion binaria incompleta/)
    })

    it('parses subprocess with return value and duplicate param throws', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   SubProceso result <- test(x, result)
      result <- x;
   FinSubProceso`

      expect(() => parseProgram(source)).toThrow(/Parametro repetido/)
    })

    it('parses subprocess without return as procedure', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   SubProceso saludar(nombre)
      Escribir "Hola, ", nombre;
   FinSubProceso`

      const ast = parseProgram(source)
      expect(ast.procedures).toHaveLength(1)
      expect(ast.procedures[0]?.name).toBe('saludar')
    })
  })

  describe('complex nested structures', () => {
    it('parses deeply nested if-else chains', () => {
      const source = `Algoritmo Test
      Definir x Como Entero;
      Leer x;
      Si x == 1 Entonces
         Si x > 0 Entonces
            Escribir "nested 1";
         FinSi
      Sino Si x == 2 Entonces
         Escribir "two";
      Sino Si x == 3 Entonces
         Escribir "three";
      Sino
         Escribir "other";
      FinSi
   FinAlgoritmo`

      const ast = parseProgram(source)
      expect(ast.statements.some((s) => s.kind === 'if')).toBe(true)
    })

    it('parses loops inside functions', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   Funcion total <- procesar()
      Definir i, acumulado Como Entero;
      acumulado <- 0;
      Para i <- 1 Hasta 3 Hacer
         acumulado <- acumulado + i;
      FinPara
      total <- acumulado;
   FinFuncion`

      const ast = parseProgram(source)
      expect(ast.functions).toHaveLength(1)
    })

    it('parses constants inside functions', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   Funcion area <- calcularArea(radio)
      Constante PI <- 3.14159;
      area <- PI * radio * radio;
   FinFuncion`

      const ast = parseProgram(source)
      expect(ast.functions[0]?.constants).toHaveLength(1)
      expect(ast.functions[0]?.constants[0]?.name).toBe('PI')
    })

    it('parses empty function body', () => {
      const source = `Algoritmo Test
   FinAlgoritmo

   Funcion result <- vacio()
      result <- 0;
   FinFuncion`

      const ast = parseProgram(source)
      expect(ast.functions[0]?.statements).toHaveLength(1)
    })

    it('parses function calling another function', () => {
      const source = `Algoritmo Test
      Definir resultado Como Real;
      resultado <- calcular(5);
      Escribir resultado;
   FinAlgoritmo

   Funcion r <- calcular(x)
      r <- helper(x * 2);
   FinFuncion

   Funcion val <- helper(n)
      val <- n + 10;
   FinFuncion`

      const ast = parseProgram(source)
      expect(ast.functions).toHaveLength(2)
    })
  })
})
