/**
 * Empathetic AI Conversational Engine for Hitha
 * Provides offline-first therapeutic dialogue based on CBT (Cognitive Behavioral Therapy)
 * and reflective listening principles, with support for live Gemini API calls if configured.
 */

export interface AIMessage {
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

// Safety trigger keywords
const SAFETY_TRIGGERS = [
  'suicide', 'kill myself', 'end my life', 'hurt myself', 'self harm', 
  'cutting myself', 'don\'t want to live', 'want to die', 'suicidal'
];

// Topic category keywords
const TOPICS = {
  education: ['study', 'exam', 'test', 'fail', 'career', 'job', 'university', 'college', 'school', 'grade', 'degree', 'study pressure', 'homework'],
  family: ['parents', 'mother', 'father', 'mom', 'dad', 'brother', 'sister', 'family', 'expectation', 'relative', 'home conflicts'],
  relationships: ['breakup', 'heartbroken', 'relationship', 'girlfriend', 'boyfriend', 'ex', 'love', 'cheated', 'divorce', 'dating'],
  finance: ['money', 'debt', 'broke', 'loan', 'poor', 'financial', 'rent', 'cost', 'expensive', 'bankrupt'],
  mentalPressure: ['anxious', 'depressed', 'anxiety', 'stress', 'overthinking', 'lonely', 'overwhelmed', 'sad', 'scared', 'panic', 'lost'],
};

// Empathy response patterns
const EMPATHY_OPENERS = [
  "I hear you, and I'm really glad you shared that with me. It takes strength to open up.",
  "It sounds like you're carrying a lot of weight on your shoulders right now.",
  "I'm sorry you are going through this. It's completely valid to feel this way.",
  "That sounds like a really challenging situation to navigate. Let's look at this together.",
  "I am here to listen and support you. You don't have to carry this alone."
];

const REFLECTIVE_QUESTIONS = {
  education: [
    "It sounds like there's a lot of pressure around your career or studies. What is the most stressful part of it for you right now?",
    "When expectations get high, it's easy to feel overwhelmed. How does this study/work pressure affect your daily energy?",
    "Sometimes we tie our self-worth to our achievements. If you could take just 10 minutes off, what is one small thing you would do to breathe?"
  ],
  family: [
    "Family relationships can be deeply complicated. Do you feel like you can communicate your true thoughts to them, or does it feel unsafe?",
    "It is hard when we feel we can't meet family expectations. How do you usually handle these conflicts when they arise?",
    "Remember that your emotional boundary is important. What would a healthy space or boundary look like for you in this situation?"
  ],
  relationships: [
    "Navigating relationship pain can be incredibly draining. What part of this feels the heaviest or most confusing for you today?",
    "When relationships shift or end, it feels like a part of us goes with it. How are you taking care of yourself amidst this hurt?",
    "It is okay to grieve a relationship. What is one small way you can show yourself some gentleness today?"
  ],
  finance: [
    "Financial stress is incredibly heavy and affects every part of life. What is the immediate concern that's on your mind today?",
    "When we worry about money, the future can feel very uncertain. Can we focus on just one small issue that we can organize or write down?",
    "You are doing your best in a difficult system. Is there any trusted person or local support resource you feel comfortable reaching out to?"
  ],
  mentalPressure: [
    "Overthinking can feel like a loop that's hard to escape. What's the main thought that keeps repeating in your mind?",
    "When anxiety or stress peaks, our bodies feel it too. Let's take a deep breath together. What is one thing you can see and one thing you can touch right now?",
    "It's completely okay to not have it all figured out. Can we list just one tiny action that could make today 1% more manageable?"
  ],
  general: [
    "What feels like the heaviest part of this situation for you today?",
    "When did you start noticing these feelings coming up?",
    "If you could describe what you need most in this moment (comfort, space, a plan), what would it be?",
    "It is natural to feel lost sometimes. What is one small thing that usually brings you comfort when you're overwhelmed?"
  ]
};

/**
 * Checks if the text contains severe distress markers
 */
export const checkSafetyStatus = (text: string): boolean => {
  const normalizedText = text.toLowerCase();
  return SAFETY_TRIGGERS.some(trigger => normalizedText.includes(trigger));
};

/**
 * Extracts the core subject or feeling from the user's input message
 */
const extractTopic = (message: string): string => {
  const clean = message.toLowerCase().trim();
  
  // Clean up basic punctuation
  const cleanMsg = clean.replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

  // Capture content after verbal qualifiers
  const patterns = [
    /(?:i feel|i'm|i am|feeling)\s+(.+)/i,
    /(?:i hate|dislike|don't like)\s+(.+)/i,
    /(?:worried about|stressed about|anxious about|sad about)\s+(.+)/i,
    /(?:how to|how do i|how can i)\s+(.+)/i,
    /(?:problem with|issue with|trouble with)\s+(.+)/i,
    /(?:thinking about|overthinking)\s+(.+)/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback to last few words if sentence is long
  const words = cleanMsg.split(/\s+/);
  if (words.length > 5) {
    return words.slice(-4).join(" ");
  }

  return cleanMsg || "what is on your mind";
};

/**
 * Local empathetic responder that acts as an offline counselor and action solver
 */
const generateLocalResponse = (message: string, history: AIMessage[]): string => {
  const normalized = message.toLowerCase().trim();

  // 1. Safety check
  if (checkSafetyStatus(normalized)) {
    return "I hear how much pain you are in right now, and I want you to be safe. Because I am an AI companion, I cannot replace professional care or immediate crisis support. Please consider reaching out to a trusted friend, family member, or a professional counselor. You can also view crisis support lines in your Profile screen. Please stay safe.";
  }

  // 2. Extract key topic/feeling
  const topic = extractTopic(message);

  // 3. Classify category for custom tips
  let matchedTopic: keyof typeof TOPICS | null = null;
  for (const [key, keywords] of Object.entries(TOPICS)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      matchedTopic = key as keyof typeof TOPICS;
      break;
    }
  }

  // 4. Generate structured ChatGPT-like solutions
  const solutions: Record<string, string[]> = {
    education: [
      "Break your work/study into 20-minute sessions with 5-minute deep breathing breaks.",
      "List the single most difficult task and commit to reviewing it for just 5 minutes today.",
      "Talk to a classmate, mentor, or advisor to seek advice or clarify instructions."
    ],
    family: [
      "Take 3 slow deep breaths before responding to family comments to stay centered.",
      "Communicate your boundaries gently: 'I hear you, but I need some quiet time to reflect right now.'",
      "Focus purely on elements within your immediate control (e.g. self-care, your schedule, your response)."
    ],
    relationships: [
      "Write down all your thoughts and feelings in a private, un-sent journal entry to release them.",
      "Take a complete 1-hour break from social media and chat apps to clear your head.",
      "Treat yourself to a small comfort (like your favorite tea or a walk outside) to refocus."
    ],
    finance: [
      "Write down your essential expenses for this week on a sheet of paper to create visual clarity.",
      "Focus only on today's budget; avoid worrying about long-term scenarios for the next 2 hours.",
      "Reach out to a trusted advisor, student support office, or check for community relief resources."
    ],
    mentalPressure: [
      "Practice the 3-3-3 rule: name 3 things you can see, 3 things you can hear, and move 3 joints.",
      "Do a progressive muscle relaxation: squeeze your shoulders tight for 5 seconds, then let go.",
      "Write down the racing thought on a piece of paper, fold it up, and place it in a drawer to set it aside."
    ],
    general: [
      "Pause whatever you are doing and take a slow sip of water.",
      "Divide your current challenge into three tiny steps and write down only the first one.",
      "Do a quick physical stretch or take a short walk to reset your physical and mental state."
    ]
  };

  const key: keyof typeof solutions = matchedTopic || 'general';
  const steps = solutions[key];

  const opener = `I understand you are dealing with "${topic}". It's completely natural to feel overwhelmed by this, but we can take it one step at a time.

Here is a structured, action-oriented plan to help you address this:`;

  const body = steps.map((step, idx) => `${idx + 1}. **${step.split(':')[0]}**: ${step.split(':')[1] || step}`).join('\n');

  const closer = `\n\nWould you like to try taking one of these micro-steps today? You can add them to your Small Steps Planner on the Home Dashboard to track your progress!`;

  return `${opener}\n\n${body}${closer}`;
};

/**
 * Main AI Service Entrypoint
 */
export const AIService = {
  /**
   * Generates response based on current context and configuration
   */
  async getResponse(
    message: string, 
    history: AIMessage[], 
    apiKey?: string | null,
    provider?: 'gemini' | 'chatgpt' | null
  ): Promise<string> {
    // Simulate thinking delay (CBT therapist response lag feels more natural and premium)
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (apiKey && apiKey.trim().length > 0) {
      if (provider === 'chatgpt') {
        try {
          // Format chat history for OpenAI API requirements
          const openAiHistory = history.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }));

          const response = await fetch(
            'https://api.openai.com/v1/chat/completions',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  {
                    role: 'system',
                    content: `You are Hitha, a highly empathetic mental wellness and life support companion.
Your goal is to provide supportive, non-judgmental conversations.
Apply reflective listening, ask gentle open-ended questions, and suggest very small, manageable steps.
Never give medical advice or diagnose.
Keep your response supportive, brief, and gentle (max 3-4 sentences).`
                  },
                  ...openAiHistory,
                  {
                    role: 'user',
                    content: message
                  }
                ]
              })
            }
          );

          if (!response.ok) throw new Error('OpenAI API request failed');
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) return text.trim();
        } catch (err) {
          console.error('OpenAI API call failed, falling back to local empathy engine:', err);
        }
      } else {
        // Default Google Gemini implementation
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [
                      {
                        text: `You are Hitha, a highly empathetic mental wellness and life support companion.
Your goal is to provide supportive, non-judgmental conversations.
Apply reflective listening, ask gentle open-ended questions, and suggest very small, manageable steps.
Never give medical advice or diagnose.
Here is the user's message: "${message}".
Keep your response supportive, brief, and gentle (max 3-4 sentences).`
                      }
                    ]
                  }
                ]
              })
            }
          );

          if (!response.ok) throw new Error('API request failed');
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        } catch (err) {
          console.error('Gemini API call failed, falling back to local empathy engine:', err);
        }
      }
    }

    // Default to the local empathetic rules-based engine
    return generateLocalResponse(message, history);
  }
};
