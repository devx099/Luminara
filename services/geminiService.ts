import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import type { Agent, Task } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const markTasksAsCompleteTool: FunctionDeclaration = {
  name: 'markTasksAsComplete',
  description: 'Marks one or more tasks as complete based on the user stating they have finished them.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskTitles: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: 'An array of titles of the tasks that the user has completed.',
      },
    },
    required: ['taskTitles'],
  },
};

export const detectCompletedTasksFromChat = async (message: string, tasks: Task[]): Promise<string[] | null> => {
  if (tasks.length === 0) return null;

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  if (pendingTasks.length === 0) return null;

  const taskTitles = pendingTasks.map(t => `"${t.title}"`).join(', ');

  const prompt = `The user sent this message: "${message}".
Review the message to determine if the user is stating they have completed one or more of the following pending tasks: [${taskTitles}].
If they have, call the 'markTasksAsComplete' function with an array containing the titles of all completed tasks.
If the message is not about completing a task, do not call any function.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ functionDeclarations: [markTasksAsCompleteTool] }],
      }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];
      if (functionCall.name === 'markTasksAsComplete') {
        const titles = functionCall.args.taskTitles;
        return Array.isArray(titles) && titles.length > 0 ? titles : null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error in task detection function call:', error);
    return null;
  }
};

const planResponseSchema = {
  type: Type.OBJECT,
  properties: {
    agent_name: { type: Type.STRING, description: "A creative and relevant name for the agent, under 50 characters." },
    description: { type: Type.STRING, description: "A concise, one-sentence summary of the agent's purpose." },
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "A short, action-oriented title for the task (3-8 words)." },
          description: { type: Type.STRING, description: "A detailed description of what the task involves." },
          priority: { type: Type.NUMBER, description: "A priority score from 1 (lowest) to 5 (highest)." },
          duration_mins: { type: Type.NUMBER, description: "Estimated time in minutes to complete the task (must be 15 or more for most tasks)." },
          due: { type: Type.STRING, description: "An estimated due date in YYYY-MM-DDTHH:mm:ss format, or null if not applicable." },
          action_type: { type: Type.STRING, description: "The type of action, e.g., 'calendar_event', 'task', or 'reminder'." },
          source_urls: { 
            type: Type.ARRAY, 
            description: "If web research was conducted for this task, provide up to 2 source URLs.",
            items: { 
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "The title of the source web page." },
                uri: { type: Type.STRING, description: "The full URL of the source web page." },
              },
              required: ['title', 'uri'],
            }
          },
        },
          required: ['title', 'description', 'priority', 'duration_mins', 'due', 'action_type'],
      },
    },
    confidence: { type: Type.NUMBER, description: "A score from 0 to 1 indicating the confidence in the plan's success." },
    explanation: { type: Type.STRING, description: "A brief explanation of the plan's strategy." },
  },
  required: ['agent_name', 'description', 'tasks', 'confidence', 'explanation'],
};


export const generateAgentPlan = async (
  goal: string,
  constraints: {
    deadline: string;
    daily_hours: string;
    granularity: 'minimal' | 'balanced' | 'detailed';
    useWebSearch: boolean;
  }
) => {
  const limits = {
    minimal: { min: 1, max: 3 },
    balanced: { min: 4, max: 8 },
    detailed: { min: 9, max: 15 },
  };
  const limit = limits[constraints.granularity || 'balanced'];

  const prompt = `You are Luminara Meta-Agent. Create a detailed, actionable plan for the user's goal.
Goal: "${goal}"

CONSTRAINTS:
- Produce between ${limit.min} and ${limit.max} tasks. This is a strict rule based on the user's selected granularity of "${constraints.granularity}".
- Each task should represent a meaningful step and have a minimum duration of 15 minutes, unless it's a very quick reminder.
- Group smaller, related actions into a single, larger task.
${constraints.deadline ? `- The final deadline for the overall goal is: ${constraints.deadline}` : '- There is no strict deadline, so schedule tasks with a reasonable, relative timeline.'}
${constraints.daily_hours ? `- The user has indicated they can dedicate approximately ${constraints.daily_hours} hours per day to this goal.` : ''}
${constraints.useWebSearch ? '- If the goal requires current, real-world information (e.g., planning a trip, market research), you MUST use the Google Search tool to find relevant data. Include source URLs for tasks based on research.' : '- Do not use any external tools.'}

The response MUST be a valid JSON object matching the provided schema. Do not include any markdown formatting or explanatory text outside of the JSON structure.
`;

  try {
    // FIX: Dynamically construct config to avoid providing responseSchema and responseMimeType when using googleSearch tool, as per API guidelines.
    const config: any = {};
    if (constraints.useWebSearch) {
      config.tools = [{googleSearch: {}}];
    } else {
      config.responseMimeType = "application/json";
      config.responseSchema = planResponseSchema;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config,
    });

    const jsonString = response.text;
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Error generating agent plan with Gemini:", error);
    throw new Error("Failed to generate a plan. The AI model might be unavailable or the request was invalid.");
  }
};


export const reviseAgentPlan = async (
  goal: string,
  previousPlan: any,
  userFeedback: string
) => {
  const prompt = `You are Luminara Meta-Agent. You previously created a plan for a user, but they have requested revisions.

Original Goal: "${goal}"

Previous Plan (as JSON string):
${JSON.stringify(previousPlan, null, 2)}

User's Revision Feedback: "${userFeedback}"

Your task is to generate a new, revised plan that incorporates the user's feedback while still adhering to the original goal and constraints. Pay close attention to what the user is asking for (e.g., more detail, different tasks, combining steps).

The response MUST be a valid JSON object matching the provided schema. Do not include any markdown formatting or explanatory text outside of the JSON structure.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: planResponseSchema,
      },
    });
    
    const jsonString = response.text;
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Error revising agent plan with Gemini:", error);
    throw new Error("Failed to revise the plan. The AI model might be unavailable or the request was invalid.");
  }
}


export const generateChatMessage = async (agent: Agent, message: string): Promise<string> => {
  const taskSummary = agent.tasks.map(t => `- ${t.title} (${t.status})`).join('\n');
  const chatHistory = agent.chat.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');

  const prompt = `You are the AI agent "${agent.name}". Your primary goal is: "${agent.goal}".
You are having a conversation with the user to help them achieve this goal.

Current Task Status:
${taskSummary}

Recent Conversation History:
${chatHistory}

User's new message: "${message}"

Your task is to respond to the user's message in a natural, helpful, and concise manner (under 150 words). Stay in character as their dedicated agent. Do not respond in JSON.
`;

  try {
     const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
     });
     return response.text.trim();
  } catch (error) {
    console.error("Error generating chat message with Gemini:", error);
    return "I'm sorry, I'm having trouble responding right now. Please try again in a moment.";
  }
};
