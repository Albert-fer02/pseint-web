export const defaultProgram = `Algoritmo VariablesBasicas
    Definir nombre Como Cadena;
    Definir edad Como Entero;
    Definir altura Como Real;
    Definir esMayorDeEdad Como Logico;
    Definir inicial Como Caracter;

    Escribir "Ingresa tu nombre: ";
    Leer nombre;

    Escribir "Ingresa tu edad: ";
    Leer edad;

    Escribir "Ingresa tu altura en metros (ej: 1.75): ";
    Leer altura;

    esMayorDeEdad <- edad >= 18;
    inicial <- Subcadena(nombre, 1, 1);

    Escribir "Hola, ", nombre, "!";
    Escribir "Tienes ", edad, " anos y mides ", altura, " m.";

    Si esMayorDeEdad Entonces
        Escribir "Eres mayor de edad :)";
    Sino
        Escribir "Eres menor de edad.";
    FinSi

    Escribir "Tu inicial es: ", inicial;
FinAlgoritmo`

export const defaultInputs: Record<string, string> = {
  nombre: 'Ana',
  edad: '20',
  altura: '1.68',
}
