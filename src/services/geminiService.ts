import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DEFAULT_MODEL = "gemini-3-flash-preview";

async function safeGenerateContent(parameters: any) {
  try {
    return await ai.models.generateContent(parameters);
  } catch (error: any) {
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      throw new Error("QUOTA_EXCEEDED: Our intelligence engine is cooling down. Please wait 60s.");
    }
    throw error;
  }
}

const SYSTEM_PROMPT = `
You are NBZ FIN APP conversational assistant, an advanced AI financial partner for NRI users managing personal and business finances between UAE and India.

Primary Responsibilities:
1. Act as personal finance advisor and business finance analyst.
2. Answer questions like: "Can I afford this purchase?", "How much should I save?", "Is my business profitable?", "Should I lend money?"
3. Detect if a transaction is personal or business.
4. Support AED and INR currencies.
5. Provide financial insights, alerts, and risk warnings.

Rules for Interaction:
- Simple explanations: Avoid complex financial jargon.
- Practical advice: Give suggestions the user can actually use.
- Short answers: Keep responses concise and to the point.
- Actionable steps: Always end with 1-2 specific things the user can do.
- Be polite but firm.
- Never hallucinate unknown values.
`;

export async function getFinancialInsights(transactions: Transaction[]) {
  const context = JSON.stringify(transactions.slice(-20), null, 2);

  const prompt = `
    ${SYSTEM_PROMPT}
    
    Analyze these transactions and provide 3 actionable insights (mix of personal/business if applicable):
    ${context}
  `;

  try {
    const response = await safeGenerateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
    });
    return response.text || "I'm sorry, I couldn't generate insights at this time.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message.startsWith("QUOTA_EXCEEDED")) return error.message;
    return "Error connecting to NBZ AI. Please check your connection.";
  }
}

export async function chatWithAdvisor(message: string, transactions: Transaction[]) {
  const context = JSON.stringify(transactions.slice(-15), null, 2);
  
  const prompt = `
    ${SYSTEM_PROMPT}
    
    User transactions Context (latest 15):
    ${context}
    
    User Question: "${message}"
    
    Remember: Simple, practical, short, and actionable.
  `;

  try {
    const response = await safeGenerateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
    });
    return response.text || "I'm not sure how to respond to that.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message.startsWith("QUOTA_EXCEEDED")) return error.message;
    return "Something went wrong with the AI assistant.";
  }
}

export async function parseTransactionWithAI(input: string): Promise<Partial<Transaction> | null> {
  const prompt = `
    ${SYSTEM_PROMPT}
    
    Parse the following user input into a formal transaction record.
    Input: "${input}"
    
    Return ONLY a JSON object in this format:
    {
      "type": "income | expense | lent | borrowed | transfer | emi | gold_loan",
      "category": "string",
      "amount": number,
      "currency": "AED | INR",
      "merchant": "string | null",
      "person": "string | null",
      "date": "YYYY-MM-DD",
      "payment_method": "string | null",
      "domain": "personal | business",
      "ledger_type": "string | null",
      "ai_suggestion": "string"
    }
  `;

  try {
    const response = await safeGenerateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
    });
    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error: any) {
    console.error("Parsing Error:", error);
    if (error.message.startsWith("QUOTA_EXCEEDED")) {
      // Potentially show a toast or notification in UI
    }
    return null;
  }
}

export async function analyzeImageWithAI(base64Data: string, mimeType: string): Promise<Partial<Transaction> | null> {
  const prompt = `
    ${SYSTEM_PROMPT}
    
    Analyze the uploaded image (receipt, invoice, or screenshot) and extract all financial data.
    Detect currency (AED or INR) automatically.
    Categorize the transaction intelligently.
    Detect if it is personal or business.
    If it's a UAE merchant, identify it correctly.
    
    Return ONLY a JSON object in this format:
    {
      "type": "income | expense | lent | borrowed | transfer | emi | gold_loan",
      "merchant": "string | null",
      "amount": number,
      "currency": "AED | INR",
      "date": "YYYY-MM-DD",
      "vat": number | null,
      "payment_method": "string | null",
      "category": "string",
      "domain": "personal | business",
      "confidence_score": number,
      "ai_suggestion": "string"
    }
  `;

  try {
    const response = await safeGenerateContent({
      model: DEFAULT_MODEL,
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error: any) {
    console.error("Image Analysis Error:", error);
    throw error; // Let UI handle it
  }
}

export async function analyzeLedgerWithAI(input: string): Promise<any | null> {
  const prompt = `
    ${SYSTEM_PROMPT}
    
    Determine whether the text describes money lending or borrowing.
    If user gave money -> lent.
    If user received money -> borrowed.
    
    Input: "${input}"
    
    Return ONLY a JSON object in this format:
    {
      "ledger_type": "lent | borrowed | emi | gold_loan",
      "person_name": "string (for emi/gold_loan use bank or entity name)",
      "amount": number,
      "currency": "AED | INR",
      "due_date": "YYYY-MM-DD | null",
      "recommended_reminder_days": number,
      "risk_level": "low | medium | high",
      "ai_note": "string"
    }
  `;

  try {
    const response = await safeGenerateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error: any) {
    console.error("Ledger Analysis Error:", error);
    return null;
  }
}

export async function generateReminderWithAI(person: string, amount: number, currency: string, dueDate?: string): Promise<any | null> {
  const prompt = `
    ${SYSTEM_PROMPT}
    
    Generate friendly financial reminder messages for the following lending situation:
    Person: ${person}
    Amount: ${amount}
    Currency: ${currency}
    ${dueDate ? `Due Date: ${dueDate}` : ''}
    
    The tone should be professional, polite, and non-aggressive.
    Suitable for UAE/India business and personal communication.
    
    Return ONLY a JSON object in this format:
    {
      "whatsapp_message": "string",
      "email_message": "string",
      "notification_text": "string"
    }
  `;

  try {
    const response = await safeGenerateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error: any) {
    console.error("Reminder Generation Error:", error);
    return null;
  }
}

export async function performMasterAuditWithAI(transactions: Transaction[]): Promise<any | null> {
  const context = JSON.stringify(transactions.slice(-50), null, 2);
  
  const prompt = `
    ${SYSTEM_PROMPT}
    
    Perform a comprehensive Master Audit on these transactions for an NRI user:
    ${context}

    Your response must be a single JSON object containing 4 distinct audits:
    1. Spending Behavior (monthly score, overspending, savings suggestions)
    2. Business Finances (profit status, cashflow, cost reduction)
    3. NRI specialized insights (remittance, currency strategy, tax hints)
    4. Financial Risk (risk level, problems, impact, actions)

    Return ONLY a JSON object in this format:
    {
      "behavior": {
        "monthly_health_score": number,
        "overspending_category": "string | null",
        "risk_alert": "string | null",
        "savings_suggestion": "string | null",
        "ai_advice": "string"
      },
      "business": {
        "profit_status": "string",
        "cashflow_health": "string",
        "risk_level": "low | medium | high",
        "cost_reduction_tip": "string",
        "ai_business_advice": "string"
      },
      "nri": {
        "remittance_advice": "string",
        "currency_strategy": "string",
        "investment_hint": "string",
        "risk_warning": "string"
      },
      "risk": {
        "risk_level": "low | medium | high",
        "problem": "string",
        "impact": "string",
        "recommended_action": "string"
      }
    }
  `;

  try {
    const response = await safeGenerateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error: any) {
    console.error("Master Audit Error:", error);
    throw error;
  }
}

export async function generateSavingsPlanWithAI(goalAmount: number, deadline: string, income: number, currency: string): Promise<any | null> {
  const prompt = `
    ${SYSTEM_PROMPT}
    
    Create a detailed savings plan for the following goal:
    Goal Amount: ${goalAmount} ${currency}
    Deadline: ${deadline}
    Monthly Income: ${income} ${currency}
    
    Return ONLY a JSON object in this format:
    {
      "monthly_saving_required": number,
      "feasibility": "high | medium | low",
      "adjustment_advice": "string",
      "goal_strategy": "string"
    }
  `;

  try {
    const response = await safeGenerateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error: any) {
    console.error("Savings Plan Error:", error);
    return null;
  }
}

export async function scanFinancialDocument(base64Image: string): Promise<any | null> {
  const prompt = `
    ${SYSTEM_PROMPT}

    You are NBZ_SCAN_ENGINE. Analyze this financial document (receipt, invoice, or screenshot).
    
    Tasks:
    - Extract: date, amount, currency (AED or INR), category, merchant/description.
    - Classify: personal or business.
    - Intelligence: Is this a lending situation (borrowed or lent)?
    - Requirement: if lending, specify the person involved.
    
    Return ONLY a JSON object in this format:
    {
      "date": "ISO-8601 string",
      "amount": number,
      "currency": "AED | INR",
      "category": "string",
      "description": "string",
      "type": "income | expense | lent | borrowed | transfer | emi | gold_loan",
      "domain": "personal | business",
      "person": "string | null",
      "ledger_type": "string | null",
      "ai_suggestion": "string"
    }
  `;

  try {
    const response = await safeGenerateContent({
      model: DEFAULT_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error: any) {
    console.error("Scan Error:", error);
    throw error;
  }
}
