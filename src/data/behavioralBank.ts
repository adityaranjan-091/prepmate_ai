export interface BehavioralQuestion {
  id: string;
  category: 'Leadership' | 'Conflict Resolution' | 'Failure & Resilience' | 'Customer Obsession' | 'Ownership' | 'Technical Disagreement';
  question: string;
  followUps: string[];
  evaluationCriteria: string[];
  idealStarStructure: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
}

export const BEHAVIORAL_QUESTIONS: BehavioralQuestion[] = [
  {
    id: 'conflict-priorities',
    category: 'Conflict Resolution',
    question: 'Tell me about a time when you strongly disagreed with a team member or manager on an architectural decision or project priority. How did you handle it, and what was the outcome?',
    followUps: [
      'If the team had stuck with the alternative path, what risks do you think would have materialized?',
      'How did you maintain a healthy working relationship with that person afterwards?',
      'Did you rely on data, prototypes, or consensus to resolve the impasse?',
    ],
    evaluationCriteria: [
      'Focus on objective data and customer impact rather than personal ego',
      'Willingness to "disagree and commit" if appropriate or persuade with proof-of-concept',
      'Demonstrated professional empathy and constructive collaboration',
    ],
    idealStarStructure: {
      situation: 'Working on a microservices migration where backend lead insisted on gRPC while frontend wanted GraphQL.',
      task: 'Need to resolve the architecture deadlock within 1 week without delaying the quarterly sprint goal.',
      action: 'Set up an objective benchmark matrix comparing developer velocity, payload sizes, and caching; built a quick 2-day spike.',
      result: 'Agreed on gRPC for internal service-to-service and GraphQL gateway for clients; delivered on time with 35% latency drop.',
    },
  },
  {
    id: 'outage-failure',
    category: 'Failure & Resilience',
    question: 'Describe a time when a critical production bug or system failure was traced back to code or a decision you made. How did you respond?',
    followUps: [
      'How quickly was the incident mitigated for end users?',
      'What post-mortem safeguards (linters, integration tests, canary rollouts) did you personally institute?',
      'How did you communicate with stakeholders during the active outage?',
    ],
    evaluationCriteria: [
      'Extreme ownership: zero deflection of blame',
      'Urgent bias for action to restore service before deep debugging',
      'Thorough blameless post-mortem and structural engineering prevention',
    ],
    idealStarStructure: {
      situation: 'A database migration script locked the orders table on Black Friday due to an unindexed foreign key.',
      task: 'Restore database throughput and prevent cascading timeouts affecting checkout.',
      action: 'Immediately killed the locking migration transaction, rolled back, and added the missing concurrent index during an off-peak maintenance window.',
      result: 'System recovered within 8 minutes; authored post-mortem and instituted mandatory automated DDL review in CI pipeline.',
    },
  },
  {
    id: 'ambiguity-ownership',
    category: 'Ownership',
    question: 'Tell me about a project where the requirements were extremely ambiguous or the scope changed halfway through. How did you navigate the uncertainty?',
    followUps: [
      'How did you avoid scope creep while still adapting to feedback?',
      'Who were the key stakeholders you consulted to clarify requirements?',
    ],
    evaluationCriteria: [
      'Proactive leadership under uncertainty',
      'Iterative milestones and early prototyping to validate assumptions',
      'Clear stakeholder communication',
    ],
    idealStarStructure: {
      situation: 'Asked to build an internal AI analytics tool with vague instructions ("make company data queryable by natural language").',
      task: 'Define scope, technical architecture, and measurable success metrics for a 6-week MVP.',
      action: 'Interviewed 12 key users across product and finance, created wireframes, and defined 3 core query workflows before writing code.',
      result: 'Launched tool saving 15 analyst hours/week; received company innovation award.',
    },
  },
];

