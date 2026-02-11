export type PseintVarType = 'Cadena' | 'Entero' | 'Real' | 'Logico' | 'Caracter'

export interface ProgramDeclaration {
  kind: 'declaration'
  name: string
  varType: PseintVarType
  dimensions: number[] | null
}

export type TargetRef =
  | { kind: 'variable'; name: string }
  | { kind: 'arrayElement'; name: string; indices: Expression[] }

export type Expression =
  | { kind: 'literal'; value: string | number | boolean }
  | { kind: 'identifier'; name: string }
  | { kind: 'arrayElement'; name: string; indices: Expression[] }
  | { kind: 'binary'; operator: BinaryOperator; left: Expression; right: Expression }
  | { kind: 'functionCall'; name: string; args: Expression[] }

export type BinaryOperator = '>=' | '<=' | '>' | '<' | '==' | '!=' | '+' | '-' | '*' | '/'

export type Statement =
  | { kind: 'read'; target: TargetRef }
  | { kind: 'write'; expressions: Expression[]; noNewline: boolean }
  | { kind: 'assign'; target: TargetRef; expression: Expression }
  | { kind: 'if'; condition: Expression; thenBranch: Statement[]; elseBranch: Statement[] }
  | { kind: 'for'; iterator: string; start: Expression; end: Expression; step: Expression; body: Statement[] }

export interface FunctionParameter {
  name: string
  isArray: boolean
  arrayRank: number
}

export interface ProgramFunction {
  name: string
  returnVariable: string
  parameters: FunctionParameter[]
  declarations: ProgramDeclaration[]
  statements: Statement[]
}

export interface ProgramAst {
  name: string
  declarations: ProgramDeclaration[]
  statements: Statement[]
  functions: ProgramFunction[]
}

export type RuntimeScalar = string | number | boolean
export type RuntimeValue = RuntimeScalar | RuntimeValue[]

export interface RuntimeExecution {
  outputs: string[]
  variables: Record<string, RuntimeValue>
  stepsExecuted: number
}

export interface RuntimeInputField {
  name: string
  varType: PseintVarType
}

export type ProgramLevel = 'Basico' | 'Intermedio' | 'Avanzado'
export type ComplexityBand = 'Baja' | 'Media' | 'Alta'

export interface ProgramInsights {
  totalLines: number
  codeLines: number
  commentLines: number
  declarationCount: number
  readCount: number
  writeCount: number
  assignmentCount: number
  conditionalCount: number
  loopCount: number
  maxNesting: number
  statementCount: number
  cyclomaticComplexity: number
  complexityScore: number
  complexityBand: ComplexityBand
  estimatedLevel: ProgramLevel
  timeComplexity: string
  guidance: string[]
}
