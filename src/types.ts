export interface Task {
  id: string;
  expr: string;
  answer: string;
  check: '✓' | '✗' | '';
  solution: string;
  correctValue: number | null;
  viewed?: boolean;
}

export type Theme = 'light' | 'dark';

export interface Settings {
  fontSize: number;
  theme: Theme;
  aStart: string;
  aEnd: string;
  bStart: string;
  bEnd: string;
  opName: string;
  taskCount: number;
  intOnly: boolean;
  nameMain: string;
  nameMul: string;
  mulTaskCount: number;
  mulSelected: number[];
  mulMaxFor: Record<string, string>;
  mulSequential: boolean;
}
