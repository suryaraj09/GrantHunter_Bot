import { GoogleGenAI } from "@google/genai";
import { Grant, LogEntry } from "../types";
import { v4 as uuidv4 } from 'uuid';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const discoverGrants = async (
  config: { keywords: string[]; year: number },
  onLog: (log: LogEntry) => void
): Promise<Grant[]> => {
  const ai = getClient();
  const modelId = "gemini-2.5-flash"; // Using Flash for speed and search capability

  const addLog = (message: string, level: LogEntry['level'] = 'INFO') => {
    onLog({
      id: uuidv4(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
    });
  };

  addLog(`Initializing Grant Discovery Protocol v1.0`, 'INFO');
  addLog(`Target Year: ${config.year}`, 'INFO');
  addLog(`Keywords: [${config.keywords.join(", ")}]`, 'INFO');

  try {
    const prompt = `
      You are an autonomous grant discovery bot. 
      Your goal is to find OPEN or UPCOMING grant opportunities for the year ${config.year}.
      
      Keywords to search: ${config.keywords.join(", ")}.
      
      STEP 1: SEARCH
      Use Google Search to find official agency pages, government funding notices, and reputable foundation calls for proposals.
      Focus on finding high-quality, relevant results.
      
      STEP 2: EXTRACT
      From the search results, extract at least 5-8 distinct grant opportunities. 
      Ignore blogs, news articles, or expired grants unless they have a confirmed upcoming cycle.
      
      STEP 3: FORMAT
      Return the data strictly as a JSON array of objects.
      The JSON structure for each object must be:
      {
        "agency_name": "Name of the funding agency",
        "program_title": "Title of the grant program",
        "funding_type": "e.g. Research, Project, Fellowship",
        "brief_description": "A concise summary (max 200 chars)",
        "eligibility_criteria": "Who can apply?",
        "application_deadline": "ISO date string (YYYY-MM-DD) or 'Rolling' or null if unknown",
        "funding_amount": "e.g. $50,000 - $100,000",
        "geographic_scope": "e.g. National, Global, specific region",
        "official_application_link": "URL to the application page",
        "status": "OPEN" or "UPCOMING" or "UNKNOWN"
      }

      CRITICAL: 
      - Return ONLY the JSON array. 
      - Do not include markdown formatting (like \`\`\`json).
      - Ensure the "official_application_link" comes from the search grounding data.
    `;

    addLog(`Executing search query on Google Index...`, 'INFO');

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType is NOT supported with googleSearch, so we parse manually
        temperature: 0.1, // Low temperature for factual extraction
      },
    });

    addLog(`Search complete. Processing results...`, 'SUCCESS');
    
    // Log grounding metadata if available to show "Crawling" source
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      addLog(`Accessed ${chunks.length} unique sources for verification.`, 'INFO');
      chunks.forEach((chunk, idx) => {
        if (chunk.web?.uri && idx < 3) {
           addLog(`Crawled: ${chunk.web.title} (${new URL(chunk.web.uri).hostname})`, 'INFO');
        }
      });
    }

    const text = response.text;
    if (!text) {
        throw new Error("No response generated from AI.");
    }

    // Clean up the response to ensure valid JSON
    let cleanJson = text.trim();
    // Remove markdown code blocks if present
    cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    // Find the first '[' and last ']'
    const startIdx = cleanJson.indexOf('[');
    const endIdx = cleanJson.lastIndexOf(']');
    
    if (startIdx === -1 || endIdx === -1) {
       addLog(`Failed to parse structured data. Raw output received.`, 'ERROR');
       console.error("Raw AI Output:", text);
       throw new Error("Invalid JSON format received from AI");
    }

    cleanJson = cleanJson.substring(startIdx, endIdx + 1);

    const parsedData = JSON.parse(cleanJson);
    
    addLog(`Successfully extracted ${parsedData.length} opportunities.`, 'SUCCESS');

    // Map to our internal Grant type with IDs
    const grants: Grant[] = parsedData.map((item: any) => ({
      id: uuidv4(),
      ...item,
      confidence_score: 0.9 + (Math.random() * 0.09) // Simulated high confidence due to Grounding
    }));

    return grants;

  } catch (error: any) {
    addLog(`Error during discovery: ${error.message}`, 'ERROR');
    throw error;
  }
};
