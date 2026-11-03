export interface ParsedResume {
  rawText: string;
  detectedSkills: string[];
  detectedRoles: string[];
  seniorityEstimate: string;
  keyProjects: string[];
}

const COMMON_TECH_SKILLS = [
  'TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
  'React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'FastAPI', 'Spring Boot',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Cassandra', 'Elasticsearch', 'DynamoDB',
  'AWS', 'Google Cloud', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'Kafka', 'GraphQL',
  'System Design', 'Microservices', 'CI/CD', 'Machine Learning', 'PyTorch', 'TensorFlow'
];

export class ResumeParserService {
  public parseText(text: string): ParsedResume {
    const lower = text.toLowerCase();
    const detectedSkills: string[] = [];

    for (const skill of COMMON_TECH_SKILLS) {
      const regex = new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'i');
      if (regex.test(text)) {
        detectedSkills.push(skill);
      }
    }

    // Estimate seniority
    let seniorityEstimate = 'Mid-level';
    if (lower.includes('staff') || lower.includes('principal') || lower.includes('director') || lower.includes('10+ years')) {
      seniorityEstimate = 'Staff / Principal';
    } else if (lower.includes('senior') || lower.includes('lead') || lower.includes('5+ years') || lower.includes('6 years') || lower.includes('7 years')) {
      seniorityEstimate = 'Senior';
    } else if (lower.includes('junior') || lower.includes('intern') || lower.includes('entry level') || lower.includes('fresh graduate') || lower.includes('0-1 years')) {
      seniorityEstimate = 'Entry Level / Associate';
    }

    // Extract potential project titles
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const keyProjects: string[] = [];

    for (const line of lines) {
      if (/^(project|built|designed|architected|developed|created):?/i.test(line) && line.length < 120) {
        keyProjects.push(line);
      }
    }

    return {
      rawText: text,
      detectedSkills: Array.from(new Set(detectedSkills)),
      detectedRoles: ['Software Engineer'],
      seniorityEstimate,
      keyProjects: keyProjects.slice(0, 5),
    };
  }

  /**
   * Generates tailored interview questions based on resume and target JD.
   */
  public generateTailoredPrompts(resume: ParsedResume, jobDescription?: string, targetCompany?: string): string[] {
    const questions: string[] = [];
    const topSkills = resume.detectedSkills.slice(0, 3).join(', ');

    questions.push(
      `I see from your background that you have extensive experience with ${topSkills || 'modern full-stack systems'}. Can you walk me through the most technically complex architectural challenge you tackled in your recent project?`
    );

    if (resume.keyProjects.length > 0) {
      questions.push(
        `On your resume you highlighted: "${resume.keyProjects[0]}". What were the non-functional requirements (throughput, latency, availability) and how did you measure success?`
      );
    }

    if (jobDescription && targetCompany) {
      questions.push(
        `Here at ${targetCompany}, high reliability and scale are paramount. Looking at the requirements for this position, how would you design a fault-tolerant system using ${resume.detectedSkills[0] || 'your core stack'}?`
      );
    }

    return questions;
  }
}

export const resumeParserService = new ResumeParserService();

