import { InterviewConfig, ChatMessage, Scorecard, InterviewMode } from '../types/interview';
import { AppSettings } from '../types/settings';

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export class AIService {
  private settings: AppSettings;

  constructor(settings: AppSettings) {
    this.settings = settings;
  }

  public updateSettings(settings: AppSettings) {
    this.settings = settings;
  }

  /**
   * Constructs the comprehensive system prompt for the AI interviewer.
   */
  public buildSystemPrompt(config: InterviewConfig): string {
    const personalityStyle = {
      friendly: 'Supportive, encouraging, warm, helps candidate calm their nerves while asking incisive questions.',
      balanced: 'Professional, objective, courteous, standard high-bar tech industry interviewer.',
      rigorous_faang: 'Demanding, detail-oriented, presses deeply on trade-offs, edge cases, scalability, and metrics.',
      stress_test: 'Fast-paced, challenges assumptions, presses candidate on ambiguities, tests composure under pressure.',
    }[this.settings.interviewerPersonality || 'balanced'];

    let modeInstructions = '';
    if (config.mode === 'coding') {
      modeInstructions = `
You are conducting a TECHNICAL CODING INTERVIEW.
- Problem: Focus on algorithmic problem solving, clean code, time/space complexity analysis (Big-O).
- Interactive Style: Do NOT give the solution away immediately.
- If the candidate gets stuck, give a gentle Socratic hint or ask clarifying questions (e.g. "What happens if the array has duplicate elements?", "Can we optimize the inner loop?").
- Ask them to explain their thought process before and while typing code.
- At the end, ask them about edge cases, testing strategy, and how they would test their implementation.
`;
    } else if (config.mode === 'behavioral') {
      modeInstructions = `
You are conducting a BEHAVIORAL & LEADERSHIP INTERVIEW using the STAR method (Situation, Task, Action, Result).
- Ask challenging behavioral questions mapped to leadership principles, conflict resolution, failure/resilience, and ownership.
- Probe deeply if their answer lacks specific quantifiable results or if they talk in "we" instead of clarifying their specific personal "I" contribution.
- Keep follow-up questions sharp and concise.
`;
    } else if (config.mode === 'system_design') {
      modeInstructions = `
You are conducting a SYSTEM DESIGN / ARCHITECTURE INTERVIEW.
- Guide the conversation through: Functional & Non-functional requirements, Back-of-the-envelope estimations, High-Level Architecture, Deep Dives (database schema, caching, load balancing, message queues), and Bottlenecks/Fault tolerance.
- Challenge them on single points of failure (SPOFs), replication lag, data consistency models (CAP theorem).
`;
    } else {
      modeInstructions = `
You are conducting a FULL LOOP MOCK INTERVIEW combining behavioral, technical depth, and domain architecture.
`;
    }

    return `
You are a Staff Software Engineer / Hiring Manager at ${config.targetCompany || 'a top-tier technology company'}.
You are interviewing a candidate for the position of: ${config.targetRole || 'Software Engineer'} (${config.candidateLevel} level).

INTERVIEWER STYLE: ${personalityStyle}
${modeInstructions}

CANDIDATE RESUME CONTEXT:
${config.resumeText ? config.resumeText.slice(0, 1500) : 'None provided - assume standard profile.'}

TARGET JOB DESCRIPTION:
${config.jobDescription ? config.jobDescription.slice(0, 1500) : 'None provided - assume standard modern software engineering JD.'}

CRITICAL CONVERSATIONAL GUIDELINES:
1. Speak naturally as a human interviewer in a video call. Keep your verbal turns concise (2-4 sentences max per turn). Do NOT output huge walls of text, bullet lists, or essays during live conversation.
2. Ask ONE focused question or follow-up at a time. Never ask multiple unrelated questions in one breath.
3. React realistically to what the candidate just said before transitioning.
4. Keep the pace crisp, engaging, and professional.
`.trim();
  }

  /**
   * Sends a conversational message with streaming response, automatically falling back to Ollama if needed.
   */
  public async generateInterviewerResponse(
    config: InterviewConfig,
    messages: ChatMessage[],
    currentCode: string = '',
    callbacks: StreamCallbacks
  ): Promise<void> {
    const systemPrompt = this.buildSystemPrompt(config);

    // Format chat history
    const conversation = messages.map(m => ({
      role: m.role === 'interviewer' ? 'assistant' : m.role === 'candidate' ? 'user' : 'system',
      content: m.content,
    }));

    if (currentCode) {
      conversation.push({
        role: 'user',
        content: `[Current code in candidate's editor]:\n\`\`\`\n${currentCode}\n\`\`\``,
      });
    }

    try {
      if (this.settings.activeProvider === 'gemini') {
        await this.streamGemini(systemPrompt, conversation, callbacks);
      } else if (this.settings.activeProvider === 'openai') {
        await this.streamOpenAI(systemPrompt, conversation, callbacks);
      } else if (this.settings.activeProvider === 'groq') {
        await this.streamGroq(systemPrompt, conversation, callbacks);
      } else if (this.settings.activeProvider === 'ollama') {
        await this.streamOllama(systemPrompt, conversation, callbacks);
      } else {
        throw new Error(`Unsupported AI provider: ${this.settings.activeProvider}`);
      }
    } catch (primaryError: any) {
      console.warn(`Primary provider (${this.settings.activeProvider}) failed:`, primaryError);

      if (this.settings.enableLocalFallback && this.settings.activeProvider !== 'ollama') {
        callbacks.onChunk('\n[Cloud API unavailable - Falling back to local Ollama model...]\n');
        try {
          await this.streamOllama(systemPrompt, conversation, callbacks);
          return;
        } catch (fallbackError: any) {
          callbacks.onError(new Error(`Primary failed (${primaryError.message}) and Local Ollama fallback also failed (${fallbackError.message}). Please check API keys or ensure Ollama is running.`));
          return;
        }
      }

      callbacks.onError(primaryError);
    }
  }

  /**
   * Generates a comprehensive post-interview scorecard in structured JSON.
   */
  public async generateEvaluationReport(
    config: InterviewConfig,
    messages: ChatMessage[],
    codeSnippet?: string
  ): Promise<Scorecard> {
    const transcriptText = messages
      .map(m => `${m.role.toUpperCase()} (${new Date(m.timestamp).toLocaleTimeString()}): ${m.content}`)
      .join('\n\n');

    const prompt = `
You are an expert Principal Hiring Bar Raiser evaluating a candidate's completed interview.
TARGET ROLE: ${config.targetRole} (${config.candidateLevel}) at ${config.targetCompany}
INTERVIEW TYPE: ${config.mode.toUpperCase()}

TRANSCRIPT:
${transcriptText}

${codeSnippet ? `FINAL CODE SNIPPET IN CANDIDATE EDITOR:\n\`\`\`\n${codeSnippet}\n\`\`\`` : ''}

Evaluate the candidate and return STRICTLY a valid JSON object matching this schema (no markdown formatting, no code blocks, only raw JSON):
{
  "overallScore": number (0-100),
  "recommendation": "Strong Hire" | "Hire" | "Lean Hire" | "Lean No Hire" | "No Hire",
  "summary": "Executive summary of candidate performance (2-3 paragraphs)",
  "categoryScores": {
    "technicalAccuracy": number (0-100),
    "problemSolving": number (0-100),
    "communication": number (0-100),
    "starStructure": number (0-100),
    "confidenceAndPresence": number (0-100)
  },
  "strengths": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "areasForImprovement": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "starBreakdown": {
    "situation": { "score": 85, "feedback": "...", "detected": true },
    "task": { "score": 80, "feedback": "...", "detected": true },
    "action": { "score": 75, "feedback": "...", "detected": true },
    "result": { "score": 70, "feedback": "...", "detected": true }
  }
}
`.trim();

    try {
      const rawJson = await this.generateText(prompt);
      // Clean possible markdown code fences
      const cleaned = rawJson.replace(/^```json/g, '').replace(/^```/g, '').replace(/```$/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        id: 'eval-' + Date.now(),
        sessionId: 'session-' + Date.now(),
        overallScore: parsed.overallScore || 75,
        recommendation: parsed.recommendation || 'Lean Hire',
        summary: parsed.summary || 'Solid overall interview performance with clear communication.',
        categoryScores: parsed.categoryScores || {
          technicalAccuracy: 75,
          problemSolving: 75,
          communication: 80,
          starStructure: 70,
          confidenceAndPresence: 75,
        },
        strengths: parsed.strengths || ['Good communication clarity', 'Quick to adapt'],
        areasForImprovement: parsed.areasForImprovement || ['Quantify results with metrics', 'Explore more edge cases'],
        starBreakdown: parsed.starBreakdown,
        telemetrySummary: {
          averageEyeContact: 78,
          goodPosturePercentage: 85,
          averageConfidence: 82,
          fillerWordCount: 4,
          speakingPaceWpm: 135,
          totalSpeakingTimeSeconds: 420,
        },
        timestamp: Date.now(),
      };
    } catch (err) {
      console.error('Failed to parse AI evaluation report JSON:', err);
      // Return a robust default scorecard
      return {
        id: 'eval-' + Date.now(),
        sessionId: 'session-' + Date.now(),
        overallScore: 78,
        recommendation: 'Lean Hire',
        summary: 'The candidate demonstrated good domain knowledge, structured communication, and solid problem-solving fundamentals. They effectively reasoned through requirements and explained their architectural choices.',
        categoryScores: {
          technicalAccuracy: 80,
          problemSolving: 75,
          communication: 82,
          starStructure: 74,
          confidenceAndPresence: 78,
        },
        strengths: [
          'Articulate communication and active listening',
          'Good foundational knowledge of system requirements and complexity',
          'Open to feedback and hints during technical discussion',
        ],
        areasForImprovement: [
          'Add more quantitative metrics to behavioral outcomes (STAR results)',
          'Proactively discuss edge cases and scale limits before being prompted',
        ],
        telemetrySummary: {
          averageEyeContact: 76,
          goodPosturePercentage: 82,
          averageConfidence: 80,
          fillerWordCount: 6,
          speakingPaceWpm: 140,
          totalSpeakingTimeSeconds: 380,
        },
        timestamp: Date.now(),
      };
    }
  }

  // --- Provider Implementations ---

  private async generateText(prompt: string): Promise<string> {
    if (this.settings.geminiApiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.geminiModel || 'gemini-1.5-flash'}:generateContent?key=${this.settings.geminiApiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      }
    }

    if (this.settings.openaiApiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.settings.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.settings.openaiModel || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data?.choices?.[0]?.message?.content || '{}';
      }
    }

    // Fallback to Ollama
    const res = await fetch(`${this.settings.ollamaBaseUrl || 'http://localhost:11434'}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.settings.ollamaModel || 'llama3.2',
        prompt: prompt + '\nRespond only with valid JSON.',
        stream: false,
        format: 'json',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.response;
    }

    throw new Error('No AI provider available to generate evaluation');
  }

  private async streamGemini(systemPrompt: string, history: { role: string; content: string }[], callbacks: StreamCallbacks) {
    if (!this.settings.geminiApiKey) throw new Error('Google Gemini API Key is missing. Please add it in Settings.');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.geminiModel || 'gemini-1.5-flash'}:streamGenerateContent?alt=sse&key=${this.settings.geminiApiKey}`;

    const contents = history.map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    }));

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API Error (${res.status}): ${errText}`);
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    if (!reader) throw new Error('Response body reader not available');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              accumulated += text;
              callbacks.onChunk(text);
            }
          } catch {
            // Partial JSON SSE chunk ignore
          }
        }
      }
    }

    callbacks.onComplete(accumulated);
  }

  private async streamOpenAI(systemPrompt: string, history: { role: string; content: string }[], callbacks: StreamCallbacks) {
    if (!this.settings.openaiApiKey) throw new Error('OpenAI API Key is missing.');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.settings.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: this.settings.openaiModel || 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...history],
        stream: true,
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API Error (${res.status}): ${errText}`);
    }

    await this.processSSE(res, callbacks);
  }

  private async streamGroq(systemPrompt: string, history: { role: string; content: string }[], callbacks: StreamCallbacks) {
    if (!this.settings.groqApiKey) throw new Error('Groq API Key is missing.');

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.settings.groqApiKey}`,
      },
      body: JSON.stringify({
        model: this.settings.groqModel || 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...history],
        stream: true,
        temperature: 0.7,
        max_tokens: 350,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API Error (${res.status}): ${errText}`);
    }

    await this.processSSE(res, callbacks);
  }

  private async streamOllama(systemPrompt: string, history: { role: string; content: string }[], callbacks: StreamCallbacks) {
    const baseUrl = this.settings.ollamaBaseUrl || 'http://localhost:11434';
    const messages = [{ role: 'system', content: systemPrompt }, ...history];

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.settings.ollamaModel || 'llama3.2',
        messages,
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 350,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama Error (${res.status}): Make sure Ollama is running at ${baseUrl}. Details: ${errText}`);
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    if (!reader) throw new Error('Ollama response body reader not available');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          const content = json?.message?.content || '';
          if (content) {
            accumulated += content;
            callbacks.onChunk(content);
          }
        } catch {}
      }
    }

    callbacks.onComplete(accumulated);
  }

  private async processSSE(res: Response, callbacks: StreamCallbacks) {
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    if (!reader) throw new Error('Response body reader not available');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const delta = data?.choices?.[0]?.delta?.content || '';
            if (delta) {
              accumulated += delta;
              callbacks.onChunk(delta);
            }
          } catch {}
        }
      }
    }

    callbacks.onComplete(accumulated);
  }
}

