export type CSSubject =
  | 'Operating Systems'
  | 'DBMS & SQL'
  | 'Computer Networks'
  | 'OOP & Design'
  | 'DSA & Complexity';

export interface MCQQuestion {
  id: string;
  subject: CSSubject;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  companyTags: string[];
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  keyTakeaway?: string;
}

export interface MCQStats {
  totalAnswered: number;
  totalCorrect: number;
  savedQuestionIds: string[];
  subjectScores: Record<
    CSSubject,
    {
      attempted: number;
      correct: number;
    }
  >;
}
