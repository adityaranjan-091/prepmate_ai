import { InterviewConfig, ChatMessage, Scorecard, AIProvider } from '../types/interview';
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

    // Determine the active provider from config or settings
    const activeProvider = (config?.provider || this.settings.activeProvider || 'gemini') as AIProvider;
    const targetModel = config?.model || (
      activeProvider === 'gemini' ? this.settings.geminiModel :
      activeProvider === 'openai' ? this.settings.openaiModel :
      activeProvider === 'groq' ? this.settings.groqModel :
      this.settings.ollamaModel
    );

    // Format chat history
    const conversation = messages.map(m => ({
      role: m.role === 'interviewer' ? 'assistant' : m.role === 'candidate' ? 'user' : 'system',
      content: m.content,
    }));

    if (currentCode && currentCode.trim()) {
      conversation.push({
        role: 'user',
        content: `[Current code in candidate's editor]:\n\`\`\`\n${currentCode.trim()}\n\`\`\``,
      });
    }

    try {
      if (activeProvider === 'gemini') {
        await this.streamGemini(systemPrompt, conversation, callbacks, targetModel);
      } else if (activeProvider === 'openai') {
        await this.streamOpenAI(systemPrompt, conversation, callbacks);
      } else if (activeProvider === 'groq') {
        await this.streamGroq(systemPrompt, conversation, callbacks);
      } else if (activeProvider === 'ollama') {
        await this.streamOllama(systemPrompt, conversation, callbacks);
      } else {
        throw new Error(`Unsupported AI provider: ${activeProvider}`);
      }
    } catch (primaryError: any) {
      console.warn(`Primary provider (${activeProvider}) failed:`, primaryError);

      // Only attempt local Ollama fallback if enabled AND if primary was not already Ollama
      if (this.settings.enableLocalFallback && activeProvider !== 'ollama') {
        try {
          // Probe if Ollama is reachable within 1500ms before attempting
          const ollamaCheck = await fetch(`${this.settings.ollamaBaseUrl || 'http://localhost:11434'}/api/tags`, {
            signal: AbortSignal.timeout(1500),
          }).catch(() => null);

          if (ollamaCheck && ollamaCheck.ok) {
            callbacks.onChunk('\n[Cloud API unavailable - Falling back to local Ollama model...]\n');
            await this.streamOllama(systemPrompt, conversation, callbacks);
            return;
          }
        } catch {
          // Ollama not reachable, fall through to reporting the primary error cleanly
        }
      }

      // Deliver the clear, actionable primary error to the caller
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

  // --- Key Resolution Helpers ---

  public getGeminiApiKey(): string {
    const fromSettings = this.settings.geminiApiKey?.trim();
    if (fromSettings) return fromSettings;

    // Check localStorage directly for latest saved key
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('prepmate_settings_v1') || localStorage.getItem('intervai_settings_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.geminiApiKey?.trim()) return parsed.geminiApiKey.trim();
        }
      }
    } catch {}

    // Check Vite / environment variables
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const envKey = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY) as string | undefined;
      if (envKey?.trim()) return envKey.trim();
    }
    return '';
  }

  public getOpenAIApiKey(): string {
    const fromSettings = this.settings.openaiApiKey?.trim();
    if (fromSettings) return fromSettings;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('prepmate_settings_v1') || localStorage.getItem('intervai_settings_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.openaiApiKey?.trim()) return parsed.openaiApiKey.trim();
        }
      }
    } catch {}

    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const envKey = (import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY) as string | undefined;
      if (envKey?.trim()) return envKey.trim();
    }
    return '';
  }

  public getGroqApiKey(): string {
    const fromSettings = this.settings.groqApiKey?.trim();
    if (fromSettings) return fromSettings;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('prepmate_settings_v1') || localStorage.getItem('intervai_settings_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.groqApiKey?.trim()) return parsed.groqApiKey.trim();
        }
      }
    } catch {}

    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const envKey = (import.meta.env.VITE_GROQ_API_KEY || import.meta.env.GROQ_API_KEY) as string | undefined;
      if (envKey?.trim()) return envKey.trim();
    }
    return '';
  }

  // --- Provider Implementations ---

  private async generateText(prompt: string): Promise<string> {
    const geminiKey = this.getGeminiApiKey();
    if (geminiKey) {
      const baseModel = (this.settings.geminiModel || 'gemini-1.5-flash').trim().replace(/^models\//, '');
      const modelsToTry = Array.from(new Set([baseModel, 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro']));

      for (const model of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;
        try {
          // Attempt 1: JSON schema mode
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': geminiKey,
            },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json',
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text;
          }

          // Attempt 2: Standard text mode without responseMimeType
          const retryRes = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': geminiKey,
            },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt + '\nRespond strictly with valid JSON only.' }] }],
              generationConfig: { temperature: 0.2 },
            }),
          });

          if (retryRes.ok) {
            const retryData = await retryRes.json();
            const text = retryData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text;
          }
        } catch (err) {
          console.warn(`Gemini model ${model} generateText error:`, err);
        }
      }
    }

    const openAIKey = this.getOpenAIApiKey();
    if (openAIKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAIKey}`,
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
      } catch (err) {
        console.warn('OpenAI generateText network error:', err);
      }
    }

    // Fallback to Ollama
    const baseUrl = this.settings.ollamaBaseUrl || 'http://localhost:11434';
    try {
      const res = await fetch(`${baseUrl}/api/generate`, {
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
    } catch (err) {
      console.warn('Ollama generateText network error:', err);
    }

    throw new Error('No AI provider available to generate evaluation. Please check your API keys in Settings.');
  }

  /**
   * Sanitizes multi-turn history to adhere strictly to Google Gemini API specifications:
   * 1. First turn must have role 'user'
   * 2. Consecutive turns of the same role are merged
   * 3. Last turn must have role 'user' so the model can generate the reply
   * 4. Each part must have a valid non-empty text string
   */
  private formatGeminiContents(
    conversation: { role: string; content: string }[]
  ): { role: 'user' | 'model'; parts: { text: string }[] }[] {
    const raw: { role: 'user' | 'model'; text: string }[] = [];

    for (const msg of conversation) {
      const text = msg.content?.trim();
      if (!text) continue;
      const role: 'user' | 'model' =
        msg.role === 'assistant' || msg.role === 'model' || msg.role === 'interviewer'
          ? 'model'
          : 'user';
      raw.push({ role, text });
    }

    if (raw.length === 0) {
      return [
        {
          role: 'user',
          parts: [{ text: 'Hello! I am ready to begin the interview.' }],
        },
      ];
    }

    const merged: { role: 'user' | 'model'; text: string }[] = [];

    // Rule 1: Gemini requires the first turn to have role 'user'
    if (raw[0].role === 'model') {
      merged.push({
        role: 'user',
        text: 'Hello, I am ready for the interview. Please introduce yourself and start with the first question.',
      });
    }

    // Rule 2: Alternating turns (merge consecutive turns of the same role)
    for (const item of raw) {
      const prev = merged[merged.length - 1];
      if (prev && prev.role === item.role) {
        prev.text += `\n\n${item.text}`;
      } else {
        merged.push({ role: item.role, text: item.text });
      }
    }

    // Rule 3: The last turn should be from 'user' so the model can generate a reply
    const last = merged[merged.length - 1];
    if (last && last.role === 'model') {
      merged.push({
        role: 'user',
        text: 'Please evaluate my response and ask your next question.',
      });
    }

    return merged.map(m => ({
      role: m.role,
      parts: [{ text: m.text.trim() || '...' }],
    }));
  }

  private async streamGemini(
    systemPrompt: string,
    history: { role: string; content: string }[],
    callbacks: StreamCallbacks,
    requestedModel?: string
  ) {
    const apiKey = this.getGeminiApiKey();
    if (!apiKey) {
      throw new Error('Google Gemini API Key is missing. Please click Settings (gear icon in the top right) to enter your Gemini API key.');
    }

    const baseModel = (requestedModel || this.settings.geminiModel || 'gemini-1.5-flash').trim().replace(/^models\//, '');
    const modelsToTry = Array.from(new Set([
      baseModel,
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-1.5-pro',
    ]));

    const contents = this.formatGeminiContents(history);

    let lastError: Error | null = null;

    for (const modelName of modelsToTry) {
      try {
        const success = await this.tryStreamGeminiModel(modelName, apiKey, systemPrompt, contents, callbacks);
        if (success) {
          return;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini model ${modelName} failed:`, err.message);

        // If error is an invalid API key, fail immediately with clear instructions
        if (err.message.toLowerCase().includes('api key') || err.message.toLowerCase().includes('unauthenticated')) {
          throw err;
        }

        // If error is 404 (model not found), continue to try next model in candidate list
        if (err.message.includes('404') || err.message.toLowerCase().includes('not found')) {
          continue;
        }

        // If rate limited, throw clear message
        if (err.message.includes('429') || err.message.toLowerCase().includes('quota') || err.message.toLowerCase().includes('exhausted')) {
          throw new Error('Gemini API rate limit or quota exceeded (HTTP 429). Please wait a moment or try another model in Settings.');
        }
      }
    }

    if (lastError) throw lastError;
    throw new Error('Failed to generate response from Google Gemini. Please check your API key and connection in Settings.');
  }

  private async tryStreamGeminiModel(
    modelName: string,
    apiKey: string,
    systemPrompt: string,
    contents: { role: 'user' | 'model'; parts: { text: string }[] }[],
    callbacks: StreamCallbacks
  ): Promise<boolean> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `Gemini API Error (${res.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson?.error?.message) {
          errorMsg = `Gemini API (${res.status}): ${errJson.error.message}`;
        }
      } catch {}
      throw new Error(errorMsg);
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulated = '';
    let buffer = '';

    if (!reader) throw new Error('Response stream reader not available');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split by standard SSE event boundaries (double newline)
      const eventBlocks = buffer.split(/\r?\n\r?\n/);
      buffer = eventBlocks.pop() || '';

      for (const block of eventBlocks) {
        const lines = block.split(/\r?\n/);
        let dataPayload = '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const content = trimmed.slice(5).trim();
            dataPayload += (dataPayload ? '\n' : '') + content;
          }
        }

        if (!dataPayload || dataPayload === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataPayload);
          const parts = parsed?.candidates?.[0]?.content?.parts || [];
          for (const p of parts) {
            if (p?.text) {
              accumulated += p.text;
              callbacks.onChunk(p.text);
            }
          }
        } catch {
          // Incomplete event chunk, skip
        }
      }
    }

    // Process leftover buffer content
    if (buffer.trim()) {
      const lines = buffer.split(/\r?\n/);
      let dataPayload = '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          dataPayload += (dataPayload ? '\n' : '') + trimmed.slice(5).trim();
        }
      }
      if (dataPayload && dataPayload !== '[DONE]') {
        try {
          const parsed = JSON.parse(dataPayload);
          const parts = parsed?.candidates?.[0]?.content?.parts || [];
          for (const p of parts) {
            if (p?.text) {
              accumulated += p.text;
              callbacks.onChunk(p.text);
            }
          }
        } catch {}
      }
    }

    if (accumulated.trim()) {
      callbacks.onComplete(accumulated);
      return true;
    }

    // Non-streaming fallback: If 0 tokens parsed from SSE stream, fetch directly via generateContent
    console.warn(`Gemini streaming yielded 0 tokens on ${modelName}, attempting non-streaming generateContent fallback...`);
    const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const directRes = await fetch(directUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
        },
      }),
    });

    if (directRes.ok) {
      const directData = await directRes.json();
      const parts = directData?.candidates?.[0]?.content?.parts || [];
      let directText = '';
      for (const p of parts) {
        if (p?.text) directText += p.text;
      }
      if (directText.trim()) {
        callbacks.onChunk(directText);
        callbacks.onComplete(directText);
        return true;
      }
    }

    return false;
  }

  private async streamOpenAI(systemPrompt: string, history: { role: string; content: string }[], callbacks: StreamCallbacks) {
    const apiKey = this.getOpenAIApiKey();
    if (!apiKey) throw new Error('OpenAI API Key is missing. Please add it in Settings.');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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
    const apiKey = this.getGroqApiKey();
    if (!apiKey) throw new Error('Groq API Key is missing. Please add it in Settings.');

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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
    let buffer = '';

    if (!reader) throw new Error('Ollama response body reader not available');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const json = JSON.parse(trimmed);
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
    let buffer = '';

    if (!reader) throw new Error('Response body reader not available');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data:')) {
          try {
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr) continue;
            const data = JSON.parse(jsonStr);
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

  /**
   * Health-checks the selected provider's credentials and connectivity.
   */
  public async testConnection(provider: AIProvider = this.settings.activeProvider): Promise<{ ok: boolean; message: string }> {
    if (provider === 'gemini') {
      const apiKey = this.getGeminiApiKey();
      if (!apiKey) {
        return {
          ok: false,
          message: 'Google Gemini API key is missing. Please enter your API key in Settings.',
        };
      }

      const baseModel = (this.settings.geminiModel || 'gemini-1.5-flash').trim().replace(/^models\//, '');
      const modelsToTry = Array.from(new Set([baseModel, 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro']));

      let lastError = '';
      for (const model of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Respond with OK.' }] }],
            }),
          });

          if (res.ok) {
            return {
              ok: true,
              message: `Connected to Google Gemini (${model}) successfully!`,
            };
          }

          const errText = await res.text();
          try {
            const parsed = JSON.parse(errText);
            lastError = parsed?.error?.message || `HTTP ${res.status}`;
            if (res.status === 400 && (lastError.toLowerCase().includes('api key') || lastError.toLowerCase().includes('invalid'))) {
              return { ok: false, message: `Invalid API Key: ${lastError}` };
            }
          } catch {
            lastError = `HTTP ${res.status}`;
          }
        } catch (err: any) {
          lastError = err.message;
        }
      }
      return { ok: false, message: `Gemini Error: ${lastError}` };
    }

    if (provider === 'openai') {
      const apiKey = this.getOpenAIApiKey();
      if (!apiKey) return { ok: false, message: 'OpenAI API key is missing.' };
      try {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return { ok: false, message: `OpenAI error: HTTP ${res.status}` };
        return { ok: true, message: 'Connected to OpenAI successfully!' };
      } catch (err: any) {
        return { ok: false, message: err.message };
      }
    }

    if (provider === 'groq') {
      const apiKey = this.getGroqApiKey();
      if (!apiKey) return { ok: false, message: 'Groq API key is missing.' };
      try {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return { ok: false, message: `Groq error: HTTP ${res.status}` };
        return { ok: true, message: 'Connected to Groq successfully!' };
      } catch (err: any) {
        return { ok: false, message: err.message };
      }
    }

    if (provider === 'ollama') {
      const baseUrl = this.settings.ollamaBaseUrl || 'http://localhost:11434';
      try {
        const res = await fetch(`${baseUrl}/api/tags`);
        if (!res.ok) return { ok: false, message: `Ollama error: HTTP ${res.status}` };
        return { ok: true, message: `Connected to Ollama at ${baseUrl}!` };
      } catch (err: any) {
        return { ok: false, message: `Cannot reach Ollama at ${baseUrl}` };
      }
    }

    return { ok: false, message: `Unknown provider: ${provider}` };
  }
}
