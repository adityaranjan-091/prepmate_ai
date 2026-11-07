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
  'System Design', 'Microservices', 'CI/CD', 'Machine Learning', 'PyTorch', 'TensorFlow', 'REST API',
  'Tailwind CSS', 'Redux', 'Zustand', 'Git', 'Linux'
];

export class ResumeParserService {
  /**
   * Reads and extracts readable text from uploaded files (PDF, TXT, MD, etc.)
   */
  public async extractTextFromFile(file: File): Promise<string> {
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (isPdf) {
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let textContent = '';

        // Decode as Latin1 / ASCII to search text streams
        const decoder = new TextDecoder('latin1');
        const rawString = decoder.decode(bytes);

        // Extract PDF literal text tokens (e.g. (Hello World) Tj or [(Hello) -10 (World)] TJ)
        const tjMatches = rawString.match(/\(([^()]{2,100})\)\s*Tj/g);
        if (tjMatches && tjMatches.length > 5) {
          textContent = tjMatches
            .map(m => m.replace(/^[\s\(]+|[\)\sTj]+$/g, ''))
            .filter(t => /[a-zA-Z]{2,}/.test(t))
            .join(' ');
        }

        // Fallback: extract continuous ASCII printable strings
        if (textContent.length < 50) {
          const printableChunks = rawString.match(/[A-Za-z0-9\s.,;:\-_@#&()\/+]{4,}/g);
          if (printableChunks) {
            textContent = printableChunks
              .filter(chunk => !chunk.includes('obj') && !chunk.includes('endobj') && !chunk.includes('xref') && !chunk.includes('trailer'))
              .join('\n')
              .slice(0, 5000);
          }
        }

        if (textContent.trim().length > 30) {
          return textContent.trim();
        }
      } catch (err) {
        console.warn('PDF heuristic parsing notice:', err);
      }
    }

    // Default text reader for .txt, .md, .json, and plain documents
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve((e.target?.result as string) || '');
      };
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    });
  }

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

    // Extract potential project or impact sentences
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const keyProjects: string[] = [];

    for (const line of lines) {
      if (/^(project|built|designed|architected|developed|created|implemented|optimized):?/i.test(line) && line.length > 20 && line.length < 160) {
        keyProjects.push(line);
      }
    }

    // Extract detected role titles
    const detectedRoles: string[] = [];
    if (/frontend|react|vue|web/i.test(text)) detectedRoles.push('Frontend Engineer');
    if (/backend|api|database|microservice/i.test(text)) detectedRoles.push('Backend Engineer');
    if (/full.?stack/i.test(text)) detectedRoles.push('Full Stack Engineer');
    if (/machine learning|ml|ai|deep learning/i.test(text)) detectedRoles.push('ML/AI Engineer');
    if (detectedRoles.length === 0) detectedRoles.push('Software Engineer');

    return {
      rawText: text,
      detectedSkills: Array.from(new Set(detectedSkills)),
      detectedRoles,
      seniorityEstimate,
      keyProjects: keyProjects.slice(0, 4),
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
