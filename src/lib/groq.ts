import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;
const isMockKey = !apiKey || apiKey === "mock-groq-api-key" || apiKey.trim() === "";

const groqDefault = isMockKey ? null : new Groq({ apiKey });

// Starter code templates — used to detect unchanged/empty submissions in mock evaluator
const STARTER_TEMPLATES: Record<string, string> = {
  "JavaScript": "// Write your solution here\nfunction solution() {\n  \n}\n",
  "TypeScript": "// Write your solution here\nfunction solution(): void {\n  \n}\n",
  "Python": "# Write your solution here\ndef solution():\n    pass\n",
  "Java": "// Write your solution here\nclass Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n",
  "C++": "// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n",
  "Go": "// Write your solution here\npackage main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println()\n}\n",
  "SQL": "-- Write your SQL query here\nSELECT * \nFROM table_name\nWHERE condition;\n",
};

export function getRoleCategory(jobRole: string): "software" | "data" | "finance" | "product" | "general" {
  const roleLower = jobRole.toLowerCase();
  
  if (
    roleLower.includes("finance") || 
    roleLower.includes("financial") || 
    roleLower.includes("investment") || 
    roleLower.includes("bank") || 
    roleLower.includes("account") || 
    roleLower.includes("audit") || 
    roleLower.includes("tax") ||
    roleLower.includes("equity") ||
    roleLower.includes("treasury")
  ) {
    return "finance";
  }
  
  if (
    roleLower.includes("product manager") || 
    roleLower.includes("project manager") || 
    roleLower.includes("scrum") || 
    roleLower.includes("agile") || 
    roleLower.includes("product owner") ||
    roleLower.includes("program manager")
  ) {
    return "product";
  }

  if (
    roleLower.includes("data scientist") || 
    roleLower.includes("data analyst") || 
    roleLower.includes("machine learning") || 
    roleLower.includes("ml engineer") || 
    roleLower.includes("ai engineer") ||
    roleLower.includes("analytics") ||
    roleLower.includes("business intelligence") ||
    roleLower.includes("bi analyst") ||
    roleLower.includes("statistics")
  ) {
    return "data";
  }

  if (
    roleLower.includes("software") || 
    roleLower.includes("developer") || 
    roleLower.includes("engineer") || 
    roleLower.includes("frontend") || 
    roleLower.includes("backend") || 
    roleLower.includes("fullstack") || 
    roleLower.includes("web") || 
    roleLower.includes("devops") || 
    roleLower.includes("programmer") ||
    roleLower.includes("coder") ||
    roleLower.includes("qa") ||
    roleLower.includes("mobile") ||
    roleLower.includes("android") ||
    roleLower.includes("ios") ||
    roleLower.includes("cloud")
  ) {
    return "software";
  }

  return "general";
}

export function extractKeywords(resumeText: string): string[] {
  const commonKeywords = [
    "react", "angular", "vue", "next.js", "nextjs", "typescript", "javascript", "node", "express", "nest",
    "python", "django", "flask", "fastapi", "pandas", "numpy", "pytorch", "tensorflow", "scikit-learn",
    "sql", "mysql", "postgresql", "mongodb", "redis", "cassandra", "dynamodb", "oracle", "prisma", "sequelize",
    "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ansible", "jenkins", "git", "ci/cd",
    "excel", "powerpoint", "tableau", "power bi", "sap", "quickbooks", "gaap", "ifrs", "dcf", "wacc", "valuation",
    "scrum", "agile", "jira", "confluence", "trello", "figma", "photoshop", "illustrator", "seo", "sem", "adwords"
  ];
  const matched = new Set<string>();
  const textLower = resumeText.toLowerCase();
  for (const kw of commonKeywords) {
    const regex = new RegExp(`\\b${kw.replace(".", "\\.")}\\b`, "i");
    if (regex.test(textLower)) {
      matched.add(kw.toUpperCase());
    }
  }
  return Array.from(matched).slice(0, 5);
}

// Helper to clean JSON string from LLMs (in case LLM includes markdown code blocks or conversational text wrapper)
function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  
  // Try to locate the JSON boundaries (braces for object, brackets for array)
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let startIdx = -1;
  let endIdx = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    // Looks like a JSON Object
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf("}");
  } else if (firstBracket !== -1) {
    // Looks like a JSON Array
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf("]");
  }
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return cleaned.substring(startIdx, endIdx + 1);
  }
  
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3).trim();
  }
  return cleaned;
}

// Low-level query function supporting dynamic custom providers and keys
async function queryLLM(
  systemPrompt: string,
  userPrompt: string,
  jsonMode: boolean,
  customProvider?: string | null,
  customApiKey?: string | null
): Promise<string> {
  const provider = customProvider || "groq";
  const finalKey = customApiKey || (provider === "groq" ? process.env.GROQ_API_KEY : process.env.GEMINI_API_KEY);

  const isMock = !finalKey || finalKey === "mock-groq-api-key" || finalKey.trim() === "";

  if (isMock) {
    throw new Error("MOCK_MODE_TRIGGER");
  }

  if (provider === "gemini") {
    // Call Gemini 1.5 Flash API (Free Tier-friendly via REST)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${finalKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: jsonMode ? 0.2 : 0.7,
          ...(jsonMode ? { responseMimeType: "application/json" } : {})
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } else {
    // Default to Groq
    const client = customApiKey ? new Groq({ apiKey: customApiKey }) : groqDefault;
    if (!client) {
      throw new Error("MOCK_MODE_TRIGGER");
    }

    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: jsonMode ? 0.3 : 0.7,
      max_tokens: 2000,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {})
    });
    return response.choices[0]?.message?.content || "";
  }
}

export async function generateQuestions(
  resumeText: string,
  jobRole: string,
  interviewType: string,
  difficulty: string,
  customProvider?: string | null,
  customApiKey?: string | null
): Promise<string[]> {
  const category = getRoleCategory(jobRole);
  let roleSpecificPrompt = "";

  if (category === "software") {
    roleSpecificPrompt = `If the interviewType is "Technical" (or "Mixed"), make sure the generated questions are highly practical, coding, DSA, and system architecture-oriented. Specifically:
- Generate 3-4 coding challenges (e.g. asking them to write, dry-run, or optimize a code snippet using their tech stack).
- Generate 3 Data Structures and Algorithms (DSA) or time/space complexity questions.
- Generate 3-4 System Architecture and Design questions (e.g. database scaling, caching, microservices, reliability, state management) based on projects in their resume.
- AVOID generic theoretical or trivia questions (e.g. do NOT ask "What is React?", "What is inheritance?", or "How does useEffect work?"). Every question must be scenario-based, coding-based, or architecture design-based.`;
  } else if (category === "data") {
    roleSpecificPrompt = `If the interviewType is "Technical" (or "Mixed"), generate questions focused on data manipulation, analytics, databases, and pipelines. Specifically:
- Generate 3-4 SQL or query optimization questions (e.g. writing complex window functions, query optimization, handling data aggregation). Start these questions with [SQL] prefix.
- Generate 3 coding/scripting or statistical analysis questions (e.g. Python pandas/numpy data cleaning, model evaluation metrics, statistical assumptions). Start these questions with [CODING] prefix.
- Generate 3-4 ETL or Data Pipeline architecture questions (e.g. data ingestion architecture, data warehouse modeling, streaming vs batch processing). Start these questions with [ARCHITECTURE] prefix.
- AVOID generic theory questions. Make every question practical, scenario-based, or query-based.`;
  } else if (category === "finance") {
    roleSpecificPrompt = `If the interviewType is "Technical" (or "Mixed"), generate questions focused on corporate finance, accounting, and valuation models. Specifically:
- Generate 3-4 Financial Modeling and forecasting questions (e.g. building three-statement models, capital budgeting scenarios, sensitivity analysis).
- Generate 3 Valuation and investment metrics questions (e.g. DCF modeling details, WACC calculations, comparable company multiples).
- Generate 3-4 Risk management, audit, or business performance scenarios (e.g. variance analysis, capital allocation decisions, corporate governance risks).
- AVOID generic theoretical questions (e.g. do NOT ask "What is accounting?"). Every question must be a realistic scenario, valuation challenge, or model design problem.`;
  } else if (category === "product") {
    roleSpecificPrompt = `If the interviewType is "Technical" (or "Mixed"), generate questions focused on product strategy, roadmap trade-offs, and metrics. Specifically:
- Generate 3-4 Product Design and user experience questions (e.g. designing a feature, detailing user workflows, accessibility).
- Generate 3 Product Metrics and estimation questions (e.g. tracking key product performance metrics, diagnosing dropdowns, sizing a market).
- Generate 3-4 Roadmapping, execution, and engineering trade-offs (e.g. prioritization frameworks, feature launch strategies, scalability impact on product).
- AVOID general theory questions. Every question must be scenario-based and decision-focused.`;
  } else {
    roleSpecificPrompt = `If the interviewType is "Technical" (or "Mixed"), generate questions focused on the specific operational and analytical skills required for this role based on the resume:
- Generate 3-4 technical scenario or workflow questions.
- Generate 3 analytical reasoning or problem-solving case questions.
- Generate 3-4 execution, tool usage, or project implementation questions.
- AVOID general theory questions. Make every question scenario-based.`;
  }

  const systemPrompt = `You are an expert technical interviewer. Based on the candidate's resume and target role (${jobRole}), generate exactly 10 interview questions. Make questions highly specific to their actual projects and experience in the resume. 

${roleSpecificPrompt}

Ensure that this set of questions is unique and covers different aspects than other sessions. (Random session token: ${Math.random().toString(36).substring(7)})

Return ONLY a valid JSON array of exactly 10 question strings. No explanation, no markdown, no extra text. Just the raw JSON array.`;

  const userPrompt = `Target Job Role: ${jobRole}
Interview Type: ${interviewType}
Difficulty Level: ${difficulty}
Candidate Resume Text:
${resumeText}`;

  try {
    const content = await queryLLM(systemPrompt, userPrompt, true, customProvider, customApiKey);
    const cleaned = cleanJsonString(content);
    const questions = JSON.parse(cleaned);
    if (Array.isArray(questions) && questions.length > 0) {
      return questions;
    }
    throw new Error("Invalid format returned by LLM");
  } catch (err: unknown) {
    if (err instanceof Error && err.message !== "MOCK_MODE_TRIGGER") {
      console.warn("LLM generateQuestions error, falling back to smart mock:", err);
    }
    
    const baseQuestions = getMockQuestions(category, difficulty, jobRole, resumeText);
    
    // Add extra pool to ensure randomized questions on consecutive mock attempts
    const diffLower = difficulty ? difficulty.toLowerCase() : "mid";
    const adapt = (jrQ: string, midQ: string, srQ: string) => {
      if (diffLower === "junior") return jrQ;
      if (diffLower === "senior") return srQ;
      return midQ;
    };
    
    const keywords = extractKeywords(resumeText);
    const skillList = keywords.length > 0 ? keywords.join(", ") : "relevant tools and frameworks";

    const extraPool: string[] = [
      adapt("[TECHNICAL] How do you handle configuration management and secret security in your current team?", `How do you secure environment credentials and secrets when developing with ${skillList}?`, "Design a secure pipeline infrastructure for deploying secrets with zero-trust policies."),
      adapt("[TECHNICAL] Tell me about a time you had to adapt to a sudden project deadline shift.", "How do you coordinate with technical partners and cross-functional teams when deliverables are delayed?", "Describe how you resolve technical project blockages between engineering teams and stakeholders."),
      adapt("[CODING] Write a function to check if a list of numbers has any duplicate values.", "[CODING] Write a helper method to debounce scroll event triggers.", "[CODING] Write a custom thread-safe scheduler limiting concurrent executions to N tasks."),
      adapt("What are the key performance metrics you use to measure operational success?", `What metrics do you track to optimize applications built with ${skillList}?`, "Explain your strategy for identifying performance bottlenecks in legacy databases and APIs."),
      adapt(`As a ${jobRole}, how do you approach learning a new tool or framework?`, `As a ${jobRole}, how do you evaluate whether to adopt a new library or tool (like ${skillList}) in your stack?`, `As a ${jobRole}, establish a technology migration roadmap for adopting a new library (like ${skillList}) across multiple legacy repos.`)
    ];

    const combined = [...baseQuestions, ...extraPool];
    // Fisher-Yates shuffle algorithm
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    return combined.slice(0, 10);
  }
}

export interface AnswerEvaluation {
  score: number;
  feedback: string;
  idealAnswer: string;
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  resumeText: string,
  jobRole: string,
  customProvider?: string | null,
  customApiKey?: string | null,
  language?: string | null,
  difficulty?: string | null
): Promise<AnswerEvaluation> {
  const answerTrimmed = answer.trim();
  const questionLower = question.toLowerCase();
  const isSQLQ = questionLower.includes("[sql]") || questionLower.includes("write a query");
  const isCodingQ = isSQLQ || questionLower.includes("[coding]") || 
    questionLower.includes("write a function") || 
    questionLower.includes("implement a") || 
    questionLower.includes("write a custom") ||
    questionLower.includes("write a script") ||
    questionLower.includes("write a utility");

  // --- STRICT PRE-EVALUATION FILTERS ---
  if (isCodingQ) {
    const cleanAnswer = answerTrimmed.replace(/\s+/g, "");
    const isJustTemplate = Object.values(STARTER_TEMPLATES).some(t => {
      const cleanTemplate = t.replace(/\s+/g, "");
      return cleanAnswer === cleanTemplate || cleanAnswer.length <= cleanTemplate.length + 5;
    });

    if (isJustTemplate || answerTrimmed.length < 15) {
      return {
        score: 1.0,
        feedback: "You submitted the starter template or an empty answer without writing any actual code/query. You must implement the logic to get credit.",
        idealAnswer: "A fully working query or implementation that correctly solves the challenge."
      };
    }

    if (isSQLQ) {
      const hasSQLKeywords = /\b(select|from|where|join|group\s+by|order\s+by|insert|update|delete|create|drop|alter|having|with|union|over|partition\s+by)\b/i.test(answerTrimmed);
      if (!hasSQLKeywords) {
        return {
          score: 1.5,
          feedback: "This is a SQL question but your answer contains no query statements. You must write an actual SQL query solution.",
          idealAnswer: "A complete working SQL query addressing the aggregate and joining requirements."
        };
      }
    } else {
      const hasFunction = /function\s+\w+|const\s+\w+\s*=|def\s+\w+|class\s+\w+|public\s+(static\s+)?void|func\s+\w+/i.test(answerTrimmed);
      const hasCodeKeywords = /\b(return|if|else|for|while|const|let|var|import|export|print|console|log|map|filter|reduce|push|pop|new|this|self|null|none|true|false|try|catch|throw|async|await)\b/i.test(answerTrimmed);
      const hasOperators = /[=!<>]{1,3}|&&|\|\||=>|\+\+|--/.test(answerTrimmed);
      const hasBrackets = (answerTrimmed.includes("{") && answerTrimmed.includes("}")) || answerTrimmed.includes(":");

      if (!hasFunction && !hasCodeKeywords && !hasOperators && !hasBrackets) {
        return {
          score: 1.5,
          feedback: "This is a coding question but your answer contains no code syntax. You must write an actual code solution.",
          idealAnswer: "A fully working implementation in the selected language that correctly solves the coding challenge."
        };
      }
    }
  } else {
    // Theory / architecture / DSA questions
    if (answerTrimmed.length < 15) {
      return {
        score: 1.0,
        feedback: "Your answer is too brief to contain any technical substance. Please elaborate and explain your approach in detail.",
        idealAnswer: "A structured, detailed explanation addressing the concepts, practical applications, and trade-offs."
      };
    }
  }

  const systemPrompt = `You are a STRICT expert technical interviewer evaluating a candidate's answer. The candidate is interviewing for a ${difficulty || "Mid"}-level role. 
Grade TOUGH and hold the candidate to ${difficulty || "Mid"}-level standards:
- If difficulty is Junior: expect basic syntax, core logical understanding, and direct functional accuracy.
- If difficulty is Mid: expect debugging awareness, proper code organization, complexity awareness, and clean handling of obvious edge cases.
- If difficulty is Senior/Expert: expect elite architecture knowledge, horizontal scaling, fault tolerance, security protocols, deep time/space complexity analysis (Big-O), and zero-downtime databases. Give very low marks for high-level vague text without concrete code or implementation details.
Follow these rules:
- Score 1-2: Empty, gibberish, off-topic, or no real attempt.
- Score 3-4: Vague, generic, or partially relevant but lacks depth, code, or specifics.
- Score 5-6: Addresses the question with some relevant detail but misses key concepts, edge cases, or depth.
- Score 7-8: Strong answer with good technical depth, relevant examples, and clear reasoning.
- Score 9-10: Outstanding — comprehensive, production-grade code or deep architectural analysis with trade-offs, complexity, and real experience.
For CODING questions: if the answer contains no actual working code, score it 1-3 maximum regardless of text explanation.
Return ONLY valid JSON in exactly this format with no extra text: {score: number from 1 to 10, feedback: one sentence of specific feedback on their answer, idealAnswer: two to three sentences describing what a great answer would include}`;

  const userPrompt = `Target Job Role: ${jobRole}
Difficulty Level: ${difficulty || "Mid"}
Question: ${question}
${language ? `Candidate's Chosen Coding Language: ${language}` : ""}
Candidate's Answer: ${answer}
Candidate's Resume Reference: ${resumeText.substring(0, 1000)}...`;

  try {
    const content = await queryLLM(systemPrompt, userPrompt, true, customProvider, customApiKey);
    const cleaned = cleanJsonString(content);
    return JSON.parse(cleaned) as AnswerEvaluation;
  } catch (err: unknown) {
    if (err instanceof Error && err.message !== "MOCK_MODE_TRIGGER") {
      console.warn("LLM evaluateAnswer error, falling back to smart mock:", err);
    }
    
    // Context-aware STRICT mock evaluator fallback
    const answerLower = answer.toLowerCase().trim();
    const questionLower = question.toLowerCase();
    const words = answerLower.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / (wordCount || 1);
    
    // Detect if this is a coding question
    const isCodingQ = questionLower.includes("[coding]") || 
      questionLower.includes("write a function") || 
      questionLower.includes("implement a") || 
      questionLower.includes("write a custom") ||
      questionLower.includes("write a script") ||
      questionLower.includes("write a utility");
    
    let score = 1.0;
    let feedback = "";
    
    // === HARD FILTERS: instant low scores ===
    
    // Completely empty or near-empty
    if (answerLower.length < 10) {
      return {
        score: 1.0,
        feedback: "Your answer is essentially empty. You must provide a substantive response to receive any credit.",
        idealAnswer: `A strong answer would directly address the question with specific technical details, code examples where applicable, and clear reasoning about trade-offs and design decisions.`
      };
    }
    
    // Gibberish / heavy repetition detection
    if (repetitionRatio < 0.4 && wordCount > 12) {
      return {
        score: 1.0,
        feedback: "Repetitive or incoherent text detected. This appears to be filler content rather than a genuine answer.",
        idealAnswer: `A strong answer would directly address the question with specific technical details, code examples where applicable, and clear reasoning about trade-offs and design decisions.`
      };
    }
    
    // === CODING QUESTION EVALUATION ===
    if (isCodingQ) {
      // Check for actual code patterns
      const hasFunction = /function\s+\w+|const\s+\w+\s*=|def\s+\w+|class\s+\w+|public\s+(static\s+)?void|func\s+\w+/i.test(answer);
      const hasBrackets = (answer.includes("{") && answer.includes("}")) || answer.includes(":");
      const hasCodeKeywords = /\b(return|if|else|for|while|const|let|var|import|export|print|console|log|map|filter|reduce|push|pop|new|this|self|null|none|true|false|try|catch|throw|async|await)\b/i.test(answer);
      const hasOperators = /[=!<>]{1,3}|&&|\|\||=>|\+\+|--/.test(answer);
      const lineCount = answer.split("\n").length;
      const hasMultipleLines = lineCount >= 3;
      
      // Check if answer is just the starter template unchanged
      const isJustTemplate = Object.values(STARTER_TEMPLATES).some(t => {
        const cleanAnswer = answer.replace(/\s+/g, "").trim();
        const cleanTemplate = t.replace(/\s+/g, "").trim();
        return cleanAnswer === cleanTemplate || cleanAnswer.length <= cleanTemplate.length + 5;
      });
      
      if (isJustTemplate) {
        score = 1.0;
        feedback = "You submitted the starter template without writing any actual code. You must implement a solution to receive credit.";
      } else if (!hasFunction && !hasCodeKeywords && !hasOperators && !hasBrackets) {
        // No code at all — just text for a coding question
        score = 2.0;
        feedback = "This is a coding question but your answer contains no code. You need to write actual code with proper syntax, logic, and structure.";
      } else if (!hasFunction && !hasMultipleLines) {
        score = 2.5;
        feedback = "Your answer has minimal code fragments but no complete function or solution. Write a full, working implementation.";
      } else if (hasFunction && !hasMultipleLines) {
        score = 3.5;
        feedback = "You defined a function signature but the implementation is incomplete. Flesh out the logic, handle edge cases, and add comments.";
      } else if (hasFunction && hasCodeKeywords && hasMultipleLines) {
        // Actual code submitted — now grade on depth
        if (lineCount >= 15 && hasOperators) {
          score = 7.5;
          feedback = "Solid implementation with reasonable structure. To score higher, discuss time/space complexity and handle more edge cases.";
        } else if (lineCount >= 8) {
          score = 6.0;
          feedback = "Decent implementation but could be more thorough. Add error handling, edge cases, and explain your approach.";
        } else {
          score = 4.5;
          feedback = "Basic implementation provided. The solution needs more depth — consider edge cases, complexity analysis, and code comments.";
        }
      } else {
        score = 3.0;
        feedback = "Partial code detected but the solution is incomplete. Provide a fully working implementation with proper structure.";
      }
    } 
    // === THEORY / DSA / ARCHITECTURE EVALUATION ===
    else {
      // Build keyword list from question context
      let keywords: string[] = [];
      if (questionLower.includes("react") || questionLower.includes("component") || questionLower.includes("render")) {
        keywords = ["memo", "state", "effect", "callback", "prop", "hook", "dom", "key", "performance", "optimization", "render", "virtual", "reconciliation"];
      } else if (questionLower.includes("next.js") || questionLower.includes("nextjs") || questionLower.includes("router") || questionLower.includes("server")) {
        keywords = ["server", "client", "route", "page", "layout", "static", "render", "ssr", "ssg", "isr", "app", "api", "middleware"];
      } else if (questionLower.includes("database") || questionLower.includes("index") || questionLower.includes("replication") || questionLower.includes("sql")) {
        keywords = ["index", "query", "relation", "table", "sql", "partition", "shard", "replica", "consistency", "key", "join", "normalize"];
      } else if (questionLower.includes("cache") || questionLower.includes("lru") || questionLower.includes("hash")) {
        keywords = ["cache", "evict", "hash", "collision", "bucket", "linked", "map", "o(1)", "load", "probe", "chain", "key", "value"];
      } else if (questionLower.includes("design") || questionLower.includes("architecture") || questionLower.includes("scalab") || questionLower.includes("system")) {
        keywords = ["scale", "load", "balance", "queue", "cache", "database", "microservice", "api", "latency", "throughput", "partition", "replica", "cdn", "failover"];
      } else if (questionLower.includes("tree") || questionLower.includes("bst") || questionLower.includes("graph") || questionLower.includes("sort")) {
        keywords = ["node", "left", "right", "traverse", "recursive", "depth", "breadth", "o(n)", "o(log", "stack", "queue", "binary", "balanced"];
      } else if (questionLower.includes("complexity") || questionLower.includes("dsa") || questionLower.includes("algorithm")) {
        keywords = ["o(n)", "o(1)", "o(log", "time", "space", "sort", "search", "heap", "stack", "queue", "array", "linked", "hash", "tree"];
      } else {
        keywords = ["implement", "design", "trade-off", "complexity", "scale", "optimize", "pattern", "architecture", "test", "edge case", "error", "performance"];
      }
      
      const matchedKeywords = keywords.filter(kw => answerLower.includes(kw));
      const keywordCoverage = matchedKeywords.length / Math.min(5, keywords.length);
      
      if (keywordCoverage === 0) {
        // Zero relevant keywords — answer is off-topic
        if (wordCount < 15) {
          score = 1.5;
          feedback = "Your answer is too short and doesn't address any of the key concepts. Provide a detailed, on-topic explanation.";
        } else {
          score = 2.0;
          feedback = `Your answer does not address the core concepts of the question. You should discuss topics like: ${keywords.slice(0, 4).join(", ")}.`;
        }
      } else if (keywordCoverage < 0.3) {
        // Minimal keyword coverage
        if (wordCount < 30) {
          score = 2.5;
          feedback = "You touched on one or two relevant concepts but the answer lacks depth and breadth. Elaborate significantly.";
        } else {
          score = 3.5;
          feedback = "You mentioned some relevant terms but didn't explain them in sufficient depth. Provide concrete examples and trade-off analysis.";
        }
      } else if (keywordCoverage < 0.6) {
        // Moderate coverage
        if (wordCount < 30) {
          score = 3.5;
          feedback = "Reasonable keyword coverage but the answer is too brief. Expand your explanation with examples and practical scenarios.";
        } else if (wordCount < 80) {
          score = 5.0;
          feedback = "Adequate answer covering some key points. To improve, add concrete examples from projects and discuss trade-offs in more detail.";
        } else {
          score = 6.0;
          feedback = "Good coverage of the topic with reasonable depth. Strengthen your answer by adding specific implementation details and edge cases.";
        }
      } else {
        // High keyword coverage (60%+)
        if (wordCount < 40) {
          score = 4.5;
          feedback = "You used the right terminology but your explanations are too terse. Elaborate on each concept with examples.";
        } else if (wordCount < 100) {
          score = 6.5;
          feedback = "Strong use of relevant concepts with decent explanation. Add concrete project examples and complexity analysis for a higher score.";
        } else {
          score = 7.5;
          feedback = "Comprehensive answer demonstrating strong technical knowledge. To reach a perfect score, include personal project examples and quantitative metrics.";
        }
      }
    }
    
    let difficultyMultiplier = 1.0;
    if (difficulty?.toLowerCase() === "junior") {
      difficultyMultiplier = 1.15; // slightly easier grading for juniors
    } else if (difficulty?.toLowerCase() === "senior") {
      difficultyMultiplier = 0.85; // tougher grading for seniors
    }

    const finalScore = Math.min(10.0, Math.max(1.0, score * difficultyMultiplier));
    
    return {
      score: Number(finalScore.toFixed(1)),
      feedback,
      idealAnswer: `An outstanding response would directly solve the problem with clean, well-structured code (for coding questions) or provide a thorough technical breakdown (for theory questions). It should include specific examples, discuss trade-offs and edge cases, reference complexity analysis (O-notation), and demonstrate real-world experience from projects.`
    };
  }
}

export interface FinalReport {
  overallScore: number;
  communication: number;
  technicalDepth: number;
  clarity: number;
  confidence: number;
  strengths: string[];
  improvements: string[];
}

export async function generateReport(
  answersList: Array<{ question: string; answer: string; score: number; feedback: string; idealAnswer: string }>,
  jobRole: string,
  difficulty: string,
  customProvider?: string | null,
  customApiKey?: string | null
): Promise<FinalReport> {
  const systemPrompt = `You are generating a final interview performance report. Analyze all the answers and scores. Return ONLY valid JSON in exactly this format: {overallScore: number with one decimal, communication: number 1-10, technicalDepth: number 1-10, clarity: number 1-10, confidence: number 1-10, strengths: array of 3 strings, improvements: array of 3 strings}`;

  const userPrompt = `Target Job Role: ${jobRole}
Difficulty: ${difficulty}
Session Answers History:
${JSON.stringify(answersList, null, 2)}`;

  try {
    const content = await queryLLM(systemPrompt, userPrompt, true, customProvider, customApiKey);
    const cleaned = cleanJsonString(content);
    return JSON.parse(cleaned) as FinalReport;
  } catch (err: unknown) {
    if (err instanceof Error && err.message !== "MOCK_MODE_TRIGGER") {
      console.warn("LLM generateReport error, falling back to smart mock:", err);
    }
    
    const sumScores = answersList.reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = answersList.length > 0 ? Number((sumScores / answersList.length).toFixed(1)) : 0;
    
    return {
      overallScore: avgScore,
      communication: Math.min(10, Math.max(1, Math.round(avgScore + (Math.random() * 2 - 1)))),
      technicalDepth: Math.min(10, Math.max(1, Math.round(avgScore - 0.5 + (Math.random() * 2 - 1)))),
      clarity: Math.min(10, Math.max(1, Math.round(avgScore + 0.5 + (Math.random() * 2 - 1)))),
      confidence: Math.min(10, Math.max(1, Math.round(avgScore + (Math.random() * 2 - 1)))),
      strengths: [
        "Strong structural articulation of engineering trade-offs and layout principles.",
        "Demonstrates good familiarity with Next.js App Router and rendering optimizations.",
        "Proactively mentions testing and validation considerations during responses."
      ],
      improvements: [
        "Incorporate more quantitative metrics (e.g. performance percentages, loading time decreases) in project descriptions.",
        "Provide deeper theoretical breakdowns of Javascript event-loop details under pressure.",
        "Ensure concise transitions when wrapping up explanations for behavioural questions."
      ]
    };
  }
}

export function getMockQuestions(category: string, difficulty: string, jobRole: string, resumeText: string): string[] {
  const diffLower = difficulty ? difficulty.toLowerCase() : "mid";
  
  // Adaptive closure to pick question text based on selected difficulty
  const adapt = (jrQ: string, midQ: string, srQ: string) => {
    if (diffLower === "junior") return jrQ;
    if (diffLower === "senior") return srQ;
    return midQ; // default to mid
  };

  // Determine the sub-category based on the actual jobRole string
  const roleLower = jobRole.toLowerCase();
  let subCategory = category;
  if (roleLower.includes("frontend")) subCategory = "frontend";
  else if (roleLower.includes("backend")) subCategory = "backend";
  else if (roleLower.includes("full stack") || roleLower.includes("fullstack")) subCategory = "fullstack";
  else if (roleLower.includes("devops")) subCategory = "devops";
  else if (roleLower.includes("data scientist") || roleLower.includes("science")) subCategory = "datascientist";
  else if (roleLower.includes("data analyst")) subCategory = "dataanalyst";
  else if (roleLower.includes("financial analyst") || roleLower.includes("finance analyst")) subCategory = "financialanalyst";
  else if (roleLower.includes("accountant") || roleLower.includes("accounting")) subCategory = "accountant";
  else if (roleLower.includes("product manager")) subCategory = "product";

  if (subCategory === "frontend") {
    return [
      adapt("[CODING] Write a React component that fetches, parses, and displays a user list from '/api/users'.", "[CODING] Write a custom React hook 'useFetch' that performs async query deduplication and handles caching with an LRU policy.", "[CODING] Write a custom React hook 'useFetch' supporting query-deduplication, auto-retry on 5xx status with exponential backoff, and tab-state synchronization via BroadcastChannel."),
      adapt("[TECHNICAL] Explain the difference between props and state in React components.", "[TECHNICAL] Explain React re-render triggers and how to optimize render loops using React.memo, useMemo, and useCallback.", "[TECHNICAL] Explain React Fiber architecture, task slicing during concurrent rendering, and how startTransition schedules low-priority work under the hood."),
      adapt("[TECHNICAL] How do you build a responsive layout using flexbox and grid?", "[TECHNICAL] Detail how you optimize Core Web Vitals (LCP, CLS, INP) for a Next.js page with dynamic images.", "[TECHNICAL] Design the micro-frontend shell architecture for a dashboard loading federated modules with independent state boundaries."),
      adapt("[CODING] Write a function in JavaScript to check if a string is a palindrome.", "[CODING] Implement a function 'deepClone' in JavaScript that handles nested objects, arrays, Date, and RegExp objects.", "[CODING] Implement a custom Event Emitter class in JavaScript supporting on, off, once, and namespace-based event emitting."),
      adapt("[TECHNICAL] What is the difference between client-side and server-side rendering?", "[TECHNICAL] Explain Next.js server actions and how to prevent security risks like CSRF and unauthorized mutations.", "[TECHNICAL] Design the client-side state machine and synchronization strategy for an offline-first editor resolving conflicts using CRDTs."),
      adapt("[CODING] Write a JavaScript function to reverse an array in-place.", "[CODING] Implement a function to debounce an event handler with immediate-execution options.", "[CODING] Write an async task scheduler in TypeScript that limits concurrent executions to N tasks and handles prioritizations."),
      adapt("[TECHNICAL] How do you store data in the browser (localStorage vs cookies)?", "[TECHNICAL] Compare CSS-in-JS (Styled Components) versus Tailwind CSS regarding performance, bundle size, and build cache.", "[TECHNICAL] Design a client-side routing library from scratch using history.pushState, handling route matching and lazy-loaded assets."),
      adapt("[TECHNICAL] What is the purpose of useEffect hook in React?", "[TECHNICAL] Explain XSS and CSRF vulnerabilities in React/Next.js and how to configure Content Security Policies (CSP).", "[TECHNICAL] Detail how you configure Webpack/Vite module federation, custom loaders, and code-splitting boundaries for a large enterprise app."),
      adapt("[CODING] Write a CSS snippet to center a div both horizontally and vertically.", "[CODING] Write a recursive function to search a nested React component tree for a specific node key.", "[CODING] Write a DOM virtualizer in pure JS/TS that manages scroll event throttle and renders only visible items in a 1M-row list."),
      adapt("[TECHNICAL] What is the difference between null and undefined in JavaScript?", "[TECHNICAL] Detail your workflow for testing React components using Jest and Testing Library. How do you mock context providers?", "[TECHNICAL] Design a client-side authentication flow using access and refresh tokens stored securely in HTTP-only, secure cookies in Next.js.")
    ];
  }

  if (subCategory === "backend") {
    return [
      adapt("[CODING] Write a simple Express API route that returns a list of items.", "[CODING] Write a rate-limiting middleware in Express/Node.js using a Redis token bucket.", "[CODING] Write a distributed rate-limiter in TypeScript using Redis Lua scripts to execute atomic counter evaluations under high concurrency."),
      adapt("[TECHNICAL] What is the difference between GET and POST requests?", "[TECHNICAL] Explain database indexing strategies. What is the difference between B-Tree and Hash indexes?", "[TECHNICAL] Explain database isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable) and how you resolve write skew."),
      adapt("[TECHNICAL] How do you connect a backend application to a database?", "[TECHNICAL] Detail how you handle asynchronous background workers using a job queue like BullMQ.", "[TECHNICAL] Design a highly available, event-driven payment processing architecture using Kafka, handling idempotency and dead-letter queues."),
      adapt("[SQL] Write a SQL query to select all users older than 21.", "[SQL] Write a SQL query with window functions to find the second highest salary in each department.", "[SQL] Write an optimized SQL query and schema design to implement a hierarchical comments tree with fast recursive reads using CTEs."),
      adapt("[TECHNICAL] What is a database schema?", "[TECHNICAL] Explain the difference between SQL and NoSQL databases, and when to use which.", "[TECHNICAL] Detail the trade-offs between database partitioning, horizontal sharding, and master-replica replication."),
      adapt("[CODING] Write a script in Node.js to read lines from a local text file.", "[CODING] Write a Node.js streaming utility to parse a large 2GB CSV file without memory leaks.", "[CODING] Implement a multi-part file upload server in Node.js that pipes uploads directly to AWS S3 using streaming backpressure."),
      adapt("[TECHNICAL] How do you hash passwords before saving them in a database?", "[TECHNICAL] Explain how OAuth2 authorization code flow works and how JWT access/refresh tokens are secure.", "[TECHNICAL] Design an API gateway handling rate-limiting, CORS, authentication, and request routing across microservices."),
      adapt("[TECHNICAL] What is an API endpoint?", "[TECHNICAL] Explain REST vs GraphQL and how you prevent the N+1 query problem in GraphQL.", "[TECHNICAL] Design a high-performance caching layer using Redis for dynamic content with cache-invalidation strategies (TTL vs write-through)."),
      adapt("[CODING] Write a function in JavaScript to check if a string has balanced parentheses.", "[CODING] Implement a binary search algorithm in JavaScript and analyze its complexity.", "[CODING] Implement a custom round-robin load balancer algorithm with health checking and dynamic server weighting in TypeScript."),
      adapt("[TECHNICAL] What is the purpose of Git branches?", "[TECHNICAL] Detail how you set up unit tests and integration tests for a REST API.", "[TECHNICAL] Describe your strategy for database migrations with zero downtime for a table with 50M rows (e.g. Expand/Contract pattern).")
    ];
  }

  if (subCategory === "fullstack") {
    return [
      adapt("[CODING] Write an API endpoint and a fetch call to render items on a page.", "[CODING] Build a search bar with frontend debouncing and backend SQL wildcard query fetching.", "[CODING] Build a real-time multiplayer cursor tracker using WebSockets with client-side interpolation and server-side state synchronization."),
      adapt("[TECHNICAL] What is the difference between client-side and server-side logic?", "[TECHNICAL] Explain React Server Components (RSC) and how they communicate with the server database.", "[TECHNICAL] Design a full-stack file collaboration system (like Google Drive) with upload resuming, file hashing, and real-time edits."),
      adapt("[TECHNICAL] What is the event loop in JavaScript?", "[TECHNICAL] Explain how CORS works and how to configure it securely for a React and Node.js stack.", "[TECHNICAL] Detail how you optimize a full-stack Next.js application to achieve 100/100 Lighthouse scores, including ISR and font/image layouts."),
      adapt("[CODING] Write a function that sums all numbers in an array.", "[CODING] Implement a recursive deepMerge function in JS to merge state updates from the server.", "[CODING] Write a custom GraphQL resolver that batch-fetches relational data to avoid N+1 queries using DataLoaders."),
      adapt("[TECHNICAL] What is the purpose of a database migration?", "[TECHNICAL] Compare using an ORM like Prisma vs raw SQL queries for database scalability.", "[TECHNICAL] Design the complete architecture of a full-stack analytics dashboard handling 10M events/day with real-time stream aggregation."),
      adapt("[CODING] Write a CSS rule to change the layout to flexbox on mobile.", "[CODING] Write a rate-limiting middleware and display remaining request credits on the UI.", "[CODING] Implement an end-to-end encrypted chat system where keys are exchanged via Diffie-Hellman on the client and stored in local IndexedDB."),
      adapt("[TECHNICAL] What is local session storage?", "[TECHNICAL] Detail how you handle server-side session authentication vs client-side JWT authentication.", "[TECHNICAL] Design a rolling deploy pipeline that updates database schema and code files without downtime."),
      adapt("[TECHNICAL] What is a web socket?", "[TECHNICAL] Describe how you implement optimistic updates on the UI for slow database writes.", "[TECHNICAL] Detail how you handle database connection pooling and failover in a serverless full-stack app (e.g. Next.js on Vercel)."),
      adapt("[CODING] Write a simple loop to filter even numbers from an array.", "[CODING] Write a function to check if a binary search tree is valid.", "[CODING] Implement a custom router that matches dynamic path patterns on both client and server, handling wildcard parameters."),
      adapt("[TECHNICAL] What is the difference between package.json and package-lock.json?", "[TECHNICAL] Describe your strategy for testing full-stack apps with Cypress/Playwright.", "[TECHNICAL] Explain how you configure CDN edge functions to render personalized landing pages in 50ms based on user geolocations.")
    ];
  }

  if (subCategory === "devops") {
    return [
      adapt("[CODING] Write a simple Dockerfile to containerize a Node.js web application.", "[CODING] Write a multi-stage Dockerfile that builds and runs a secure, minimal Go binary.", "[CODING] Write a custom script that automates container security scans and denies builds with high-risk vulnerabilities in the CI pipeline."),
      adapt("[TECHNICAL] What is the difference between Docker and a Virtual Machine?", "[TECHNICAL] Explain the stages of a CI/CD pipeline and how you optimize build speeds.", "[TECHNICAL] Design a multi-environment GitOps deployment pipeline using ArgoCD and Kubernetes, explaining sync policies."),
      adapt("[TECHNICAL] What is an IP address and a subnet?", "[TECHNICAL] Explain how Kubernetes Pods communicate and the purpose of a Service.", "[TECHNICAL] Design a secure VPC network architecture with public/private subnets, NAT Gateways, Security Groups, and Bastion Hosts."),
      adapt("[CODING] Write a basic bash script that backups a folder to a target directory.", "[CODING] Write a bash script that polls an API endpoint and restarts a system service on failure.", "[CODING] Write a Python script using AWS SDK (boto3) to automate cleaning up unused EBS volumes, releasing associated elastic IPs."),
      adapt("[TECHNICAL] What is Infrastructure as Code (IaC)?", "[TECHNICAL] Compare Terraform state files management in local storage vs S3 remote backends with dynamo locking.", "[TECHNICAL] Design a disaster recovery plan with multi-region database replication and active-active Route53 failovers."),
      adapt("[CODING] Write a simple YAML file defining a single Kubernetes Nginx deployment.", "[CODING] Write a Kubernetes YAML defining a stateful application with persistent volumes and statefulset configurations.", "[CODING] Write a custom Helm chart containing deployments, services, ingress, and configmaps, including values overrides."),
      adapt("[TECHNICAL] What is a reverse proxy?", "[TECHNICAL] Detail how you configure Nginx to act as a load balancer and SSL terminator.", "[TECHNICAL] Design a zero-downtime rolling update strategy for Kubernetes using ingress controllers, configuring liveness/readiness probes."),
      adapt("[TECHNICAL] What is CPU and memory utilization?", "[TECHNICAL] Explain how Prometheus and Grafana collect and display metrics from backend servers.", "[TECHNICAL] Design a centralized log aggregation and tracing system using Elasticsearch, Logstash, Kibana (ELK) and Jaeger."),
      adapt("[CODING] Write a script to check if a server port is open.", "[CODING] Write a Terraform block to provision an EC2 instance with security groups.", "[CODING] Write a Terraform module that deploys an autoscaling Kubernetes cluster with custom AMIs, configuring launch templates."),
      adapt("[TECHNICAL] What is SSH?", "[TECHNICAL] Explain the difference between monorepos vs polyrepos regarding CI/CD pipeline structures.", "[TECHNICAL] Detail how you secure secrets (like API keys) in a deployment pipeline using HashiCorp Vault with IAM integration.")
    ];
  }

  if (subCategory === "datascientist") {
    return [
      adapt("[CODING] Write a Python snippet to load a CSV file using pandas and show its shape.", "[CODING] Write a Python function to impute missing values in a pandas dataframe using group medians.", "[CODING] Implement a custom pandas data pipeline that handles streaming chunks, outlier capping, and categorical encoding."),
      adapt("[TECHNICAL] What is the difference between supervised and unsupervised learning?", "[TECHNICAL] Explain bias-variance trade-off and how to detect underfitting vs overfitting.", "[TECHNICAL] Detail the mathematical difference between L1 (Lasso) and L2 (Ridge) regularization and their effects on coefficients."),
      adapt("[TECHNICAL] What is a regression model?", "[TECHNICAL] Explain how a Random Forest classifier works and how feature importance is calculated.", "[TECHNICAL] Detail the architecture and training process of a Deep Neural Network (e.g. Transformers), explaining self-attention math."),
      adapt("[CODING] Write a Python loop to calculate the mean squared error (MSE) of predictions.", "[CODING] Write a script to perform grid search cross-validation for a scikit-learn model.", "[CODING] Implement gradient descent from scratch in Python for linear regression, proving mathematically that it converges."),
      adapt("[TECHNICAL] What is training data vs test data?", "[TECHNICAL] Explain ROC-AUC and F1-score, and why accuracy is bad for imbalanced classification.", "[TECHNICAL] Design an A/B testing framework including sample size calculation, statistical power analysis, and t-tests."),
      adapt("[CODING] Write a Python script to filter a column in a dataframe.", "[CODING] Write a custom scikit-learn transformer to encode high-cardinality categorical features.", "[CODING] Write a PyTorch training loop including forward pass, backpropagation, and optimization step with gradient clipping."),
      adapt("[TECHNICAL] What is a correlation matrix?", "[TECHNICAL] Explain PCA (Principal Component Analysis) and how to determine explained variance ratio.", "[TECHNICAL] Detail how you handle multicollinearity and high-dimensionality in predictive modeling, explaining VIF."),
      adapt("[TECHNICAL] What is a decision tree?", "[TECHNICAL] Compare Bagging versus Boosting algorithms (like Random Forest vs XGBoost).", "[TECHNICAL] Explain how you design and deploy a real-time machine learning model inference endpoint on AWS SageMaker with shadow traffic."),
      adapt("[CODING] Write a query in SQL to calculate the average sales per user.", "[CODING] Write a SQL query using window functions to calculate the 7-day moving average of user activity.", "[CODING] Write a PySpark job to join two large datasets and aggregate metrics using window functions, minimizing shuffle partition overhead."),
      adapt("[TECHNICAL] What is standard deviation?", "[TECHNICAL] Explain hyperparameter tuning methods like Random Search vs Bayesian Optimization.", "[TECHNICAL] Detail how you detect and mitigate data drift and concept drift in a production ML pipeline using monitoring metrics.")
    ];
  }

  if (subCategory === "dataanalyst") {
    return [
      adapt("[SQL] Write a simple SQL query to retrieve all columns from a sales table.", "[SQL] Write a SQL query using GROUP BY and HAVING to find regions with total sales > $100k.", "[SQL] Write an optimized SQL query using CTEs and window functions to find month-over-month growth, handling zero-division edge cases."),
      adapt("[TECHNICAL] What is a primary key vs a foreign key in SQL?", "[TECHNICAL] Explain the difference between inner join, left join, and outer join in SQL.", "[TECHNICAL] Compare relational database schemas (OLTP) versus columnar data warehouses (OLAP) schemas regarding indexing and query execution plans."),
      adapt("[TECHNICAL] How do you handle empty cells in an Excel spreadsheet?", "[TECHNICAL] Explain how you perform cohort analysis to understand user retention over time.", "[TECHNICAL] Design the data model and schema for an enterprise business intelligence (BI) dashboard, showing star schema details."),
      adapt("[CODING] Write a Python snippet to load a dataset and print the summary statistics.", "[CODING] Write a Python pandas script to merge two dataframes on a key and count null values.", "[CODING] Write a Python pandas script to perform vectorised string cleanup and parse messy date formats using regex mappings."),
      adapt("[TECHNICAL] What is the difference between average and median?", "[TECHNICAL] Detail how you build a KPI dashboard in Power BI or Tableau. What metrics do you track?", "[TECHNICAL] Describe how you audit and validate database data quality and resolve source mismatches in a data warehouse pipeline."),
      adapt("[SQL] Write a query to count the number of orders in a table.", "[SQL] Write a SQL query to calculate the running total of orders over time using window functions.", "[SQL] Write a SQL query to deduplicate rows in a table using ROW_NUMBER() and partition keys on nested transaction times."),
      adapt("[TECHNICAL] What is a pivot table?", "[TECHNICAL] Explain the concept of correlation vs causation and how you communicate this to stakeholders.", "[TECHNICAL] Explain how you design and run an A/B test analysis, including p-value interpretation and confidence interval mapping."),
      adapt("[TECHNICAL] What is a bar chart used for?", "[TECHNICAL] Detail how you perform variance analysis to explain why quarterly revenue missed projections.", "[TECHNICAL] Design an automated reporting pipeline that pulls SQL data, formats it, and emails a PDF report automatically."),
      adapt("[CODING] Write an Excel formula to sum cells if they match a criteria.", "[CODING] Write a Python script using matplotlib/seaborn to plot a distribution and identify outliers.", "[CODING] Write an optimized SQL query that uses partitioning and indexing to query a column on a billion-row table, avoiding temp spills."),
      adapt("[TECHNICAL] What is the difference between rows and columns?", "[TECHNICAL] Explain data normalization (1NF, 2NF, 3NF) and why it matters for reporting schemas.", "[TECHNICAL] Detail how you present complex analytical insights to executive stakeholders to drive business decisions under metrics ambiguity.")
    ];
  }

  if (subCategory === "financialanalyst") {
    return [
      adapt("[TECHNICAL] Explain the relationship between Net Income, Operating Cash Flow, and Retained Earnings, and how a write-down of inventory affects all three.", "[SPREADSHEET] Build a 3-statement integration model showing how a $10M debt issuance with a 5% interest rate and 20% tax rate flows through Year 1.", "[SPREADSHEET] Model a complex capitalization roll-forward including convertible debt, warrants, and a dividend recapitalization over a 3-year horizon."),
      adapt("[TECHNICAL] Given an outlay of $500k, calculate the NPV of cash flows of $150k, $200k, $250k, $300k at 10% discount rate and explain the decision rule.", "[SPREADSHEET] Calculate the NPV and IRR of a capital project costing $1.2M with uneven cash flows, incorporating a 3% terminal growth rate after Year 5.", "[SPREADSHEET] Design a Monte Carlo simulation model framework for NPV analysis, detailing the probability distribution functions used for sales growth variance."),
      adapt("[TECHNICAL] Explain WACC and calculate the cost of equity using CAPM given a Risk-Free Rate of 3%, Beta of 1.2, and Market Premium of 6%.", "[SPREADSHEET] Calculate WACC for a firm with $600k Equity (beta 1.4) and $400k Debt (6% interest, 25% tax), detailing the unlevering and relevering of beta.", "[SPREADSHEET] Build an optimization spreadsheet to find the capital structure that minimizes WACC, modeling the cost of debt as a function of leverage ratios."),
      adapt("[TECHNICAL] Walk through the steps of a Discounted Cash Flow (DCF) model and how you calculate the Terminal Value.", "[SPREADSHEET] Perform a DCF valuation using a multi-stage model with 15% growth for years 1-3, 8% growth for years 4-5, and a 2.5% terminal growth rate.", "[SPREADSHEET] Build a dynamic DCF model with sensitivity tables (using Excel Data Tables syntax) mapping Enterprise Value across varying WACCs and Terminal Multiples."),
      adapt("[TECHNICAL] Explain the core drivers of returns in a Leveraged Buyout (LBO) transaction.", "[TECHNICAL] Detail the mechanics of an accretion/dilution analysis for a target acquisition, including goodwill allocation and debt interest charges.", "[TECHNICAL] Design a full LBO debt waterfall spreadsheet (Senior Debt, Mezzanine, Equity) modeling covenants, revolving credit facilities, and cash sweeps."),
      adapt("[TECHNICAL] How do you analyze operating metrics (like CAC/LTV or gross margin) to forecast working capital trends?", "[TECHNICAL] Describe a scenario where you performed variance analysis to find drivers of budget deviation.", "[SPREADSHEET] Design a sensitivity analysis table (using Data Tables in Excel) for a project's NPV."),
      adapt("[TECHNICAL] What is the difference between operating leverage and financial leverage?", "[TECHNICAL] Explain the difference between free cash flow to firm (FCFF) vs free cash flow to equity (FCFE).", "[TECHNICAL] Detail how macro-economic changes (like rising inflation) affect your cash flow forecasting models."),
      adapt("[TECHNICAL] Detail the standard items in a company's working capital account.", "[TECHNICAL] Explain how a $10 increase in depreciation flows through the three financial statements.", "[TECHNICAL] Describe how you perform scenario modeling for a company facing a potential liquidity crisis."),
      adapt("[TECHNICAL] What is the difference between NPV and Payback Period?", "[TECHNICAL] Detail how you estimate terminal growth rates and terminal value in a DCF model.", "[TECHNICAL] Explain how you audit a complex spreadsheet model with external links for formula errors."),
      adapt("[TECHNICAL] What is the difference between simple interest and compound interest?", "[TECHNICAL] Explain how you calculate operating leverage and its impact on EBIT forecasting.", "[TECHNICAL] Describe how you evaluate a merger or acquisition (M&A) using accretion/dilution analysis.")
    ];
  }

  if (subCategory === "accountant") {
    return [
      adapt("[TECHNICAL] Perform a basic bank reconciliation for a ledger balance of $50k vs bank balance of $48.5k, detailing outstanding checks.", "[SPREADSHEET] Reconcile a ledger account with multi-currency transactions, accounting for realized and unrealized foreign exchange gains (ASC 830).", "[SPREADSHEET] Reconcile a complex intercompany account balance across three global subsidiaries with currency translations and transfer pricing adjustments."),
      adapt("[TECHNICAL] Explain the five-step revenue recognition model under ASC 606.", "[TECHNICAL] Detail how you allocate transaction prices in a multi-element contract (hardware, software license, and support) under ASC 606.", "[TECHNICAL] Describe how a transaction is recorded under ASC 606 (Revenue from Contracts with Customers)."),
      adapt("[TECHNICAL] What is the differences between GAAP and IFRS regarding inventory valuation methods (LIFO vs FIFO)?", "[TECHNICAL] Describe how to calculate and record the Right-of-Use (ROU) Asset and Lease Liability for an operating lease under ASC 842.", "[SPREADSHEET] Build a lease amortization schedule under ASC 842 including variable lease payments, index escalations, and lease terminations."),
      adapt("[TECHNICAL] What is straight-line depreciation?", "[TECHNICAL] How do you calculate depreciation using the straight-line method vs double-declining balance?", "[TECHNICAL] Explain how you account for fixed asset impairments and disposals under GAAP."),
      adapt("[TECHNICAL] What is an ledger?", "[TECHNICAL] What internal controls would you implement in an accounting department to prevent fraud?", "[TECHNICAL] Design a segregation of duties (SoD) matrix for a mid-sized company's accounting workflows."),
      adapt("[TECHNICAL] What is a trial balance?", "[SPREADSHEET] Walk through an adjusted trial balance correcting for prepaid expense amortizations, accrued liabilities, and unearned revenue.", "[SPREADSHEET] Design an automated closing ledger system that maps consolidation entries, minority interest eliminations, and equity-method investments."),
      adapt("[TECHNICAL] What are accounts receivable?", "[TECHNICAL] How do you analyze accounts receivable aging reports and estimate bad debt provisions?", "[TECHNICAL] Detail how you calculate the allowance for doubtful accounts using the CECL model under GAAP."),
      adapt("[TECHNICAL] What is month-end close?", "[SPREADSHEET] Reconcile the cash ledger balance ($50,000) with the bank statement showing ($48,500) accounting for outstanding checks and deposits.", "[TECHNICAL] Walk through the consolidation process for a parent company with international subsidiaries."),
      adapt("[TECHNICAL] What is a tax expense?", "[TECHNICAL] Explain the concept of materiality in auditing. How does it affect testing?", "[TECHNICAL] Explain how you calculate deferred tax assets (DTAs) and liabilities (DTLs) under ASC 740."),
      adapt("[TECHNICAL] What is a cash flow statement?", "[TECHNICAL] How do you prepare corporate tax provisions and ensure compliance during the close process?", "[TECHNICAL] Describe your role in coordinating with external auditors during an annual financial audit.")
    ];
  }

  if (subCategory === "product") {
    return [
      adapt("[TECHNICAL] What does a Product Manager do?", "[TECHNICAL] How would you design a feature for Spotify to increase retention among children aged 8-12?", "[TECHNICAL] Design a product onboarding strategy for a complex enterprise software to boost 7-day user activation rates."),
      adapt("[TECHNICAL] What is a product roadmap?", "[TECHNICAL] Define the core success metrics (KPIs) you would track for a premium tier ride-sharing service.", "[TECHNICAL] Detail how you configure a dashboard of key metrics to diagnose a sudden 15% drop in user activation, mapping root causes."),
      adapt("[TECHNICAL] What is the difference between a feature and a benefit?", "[TECHNICAL] Explain the RICE prioritization framework and how you apply it to decide feature order.", "[TECHNICAL] Describe how you handle prioritization when engineering, sales, and executives have conflicting goals, citing frameworks."),
      adapt("[TECHNICAL] What is a user story?", "[TECHNICAL] Estimate the annual market size for premium electric bicycle subscriptions in London.", "[TECHNICAL] Walk through how you conduct a competitive analysis to identify market entry gaps for a B2B SaaS tool."),
      adapt("[TECHNICAL] What is the agile methodology?", "[TECHNICAL] How do you manage engineering trade-offs when technical constraints delay a feature release?", "[TECHNICAL] Explain how you evaluate whether to build a new capability in-house, buy a vendor solution, or partner with another platform."),
      adapt("[TECHNICAL] What is a product launch?", "[TECHNICAL] Describe a feature launch that failed to meet expectations. What post-mortem steps did you take?", "[TECHNICAL] Detail your go-to-market (GTM) strategy for launching an enterprise AI product to developers, defining channels."),
      adapt("[TECHNICAL] What is a wireframe?", "[TECHNICAL] How do you conduct user interviews to extract qualitative feedback without introducing bias?", "[TECHNICAL] Design a user feedback loop that automatically translates customer support tickets into product specifications."),
      adapt("[TECHNICAL] What is an MVP (Minimum Viable Product)?", "[TECHNICAL] Compare A/B testing vs feature flags for rolling out new features to users.", "[TECHNICAL] Explain how you establish product-market fit (PMF) metrics for a zero-to-one product, including cohort retention."),
      adapt("[TECHNICAL] What is a user flow?", "[TECHNICAL] Detail how you define and validate user personas for a B2B SaaS platform.", "[TECHNICAL] Explain how you manage a product transition from legacy systems to a modern cloud API architecture without customer churn."),
      adapt("[TECHNICAL] What is product marketing?", "[TECHNICAL] How do you calculate user lifetime value (LTV) and customer acquisition cost (CAC) targets?", "[TECHNICAL] Describe how you manage pricing strategy and packaging adjustments for a multi-tiered SaaS product.")
    ];
  }

  // Fallback templates for custom roles
  const keywords = extractKeywords(resumeText);
  const skillList = keywords.length > 0 ? keywords.join(", ") : "relevant tools and frameworks";
  return [
    adapt(`As a ${jobRole}, how do you approach setting up your core workflows to maximize efficiency?`, `As a ${jobRole}, how do you optimize your workflows using ${skillList} to maximize team efficiency?`, `As a ${jobRole}, design a scalable workflow system using ${skillList} that connects cross-functional teams.`),
    adapt(`Describe a minor project error you faced as a ${jobRole}. How did you resolve it?`, `Describe a major bottleneck you faced as a ${jobRole}. How did you use ${skillList} to resolve it?`, `Describe a critical system failure you managed as a ${jobRole}. Detail your incident response and post-mortem using ${skillList}.`),
    adapt(`What are the basic metrics you monitor to track your success in a ${jobRole} position?`, `What are the most critical performance indicators (KPIs) you monitor to measure your success as a ${jobRole}?`, `Design a quantitative KPI scorecard framework for a ${jobRole} department that links operational metrics to business outcomes.`),
    adapt(`How do you handle disagreement with a coworker during a ${jobRole} project?`, `How do you handle collaboration and align requirements with cross-functional stakeholders when there are conflicting priorities for your ${jobRole} deliverables?`, `Describe how you negotiate and align conflicting product/operational milestones between engineering leads and business executives as a ${jobRole}.`),
    adapt(`Can you walk me through a simple project from your resume where you worked as a ${jobRole}?`, `Can you walk me through a complex project on your resume where you worked as a ${jobRole}? Detail how you used ${skillList} to achieve success.`, `Present a comprehensive case study of your most successful project as a ${jobRole}. Detail the ROI, risk mitigation, and scaling achievements.`),
    adapt(`Explain the main technical concept or tool you use in your daily tasks as a ${jobRole}.`, `Explain a complex technical concept or methodology relevant to ${jobRole} in simple terms for a non-technical business stakeholder.`, `Explain a highly complex architectural pattern or policy in the ${jobRole} field to a non-technical C-level executive to secure budget.`),
    adapt(`How do you manage your daily tasks as a ${jobRole}?`, `How do you balance short-term operational demands against long-term quality and maintenance goals in your daily tasks as a ${jobRole}?`, `Explain your strategic planning framework for balancing technical debt reduction vs shipping business features as a ${jobRole}.`),
    adapt(`How do you check your work for mistakes before turning it in?`, `How do you validate the quality, accuracy, and compliance of your work (especially concerning ${skillList}) before final sign-off or presentation?`, `Design a comprehensive quality assurance (QA) and compliance validation pipeline for a ${jobRole}'s deliverables to ensure zero faults in production.`),
    adapt(`How do you learn about new tools and updates in the ${jobRole} industry?`, `Describe how you keep your skills sharp and stay up-to-date with emerging tools, standards, and methodologies in the ${jobRole} industry.`, `Detail how you lead institutional knowledge sharing and introduce new technology standards within your team as a ${jobRole}.`),
    adapt(`Detail a time you had to change your daily tasks because a project shifted focus.`, `Detail a time you had to manage or adapt to a sudden change in requirements or objectives for a ${jobRole} project. How did you handle it?`, `Describe how you restructured a major project's roadmap, resources, and architecture mid-execution due to a massive change in business objectives.`)
  ];
}
