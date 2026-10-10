/**
 * Vision Extraction Service using Google Gemini API with Automatic Fallback
 */

export const MARK_SHEET_SCHEMA = {
  type: "OBJECT",
  properties: {
    university: { type: "STRING" },
    academicSession: { type: "STRING" },
    yearSemester: { type: "STRING" },
    examination: { type: "STRING" },
    department: { type: "STRING" },
    courseCode: { type: "STRING" },
    courseTitle: { type: "STRING" },
    examinerName: { type: "STRING" },
    examinerDesignation: { type: "STRING" },
    signDate: { type: "STRING" },
    records: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          codeNo: { type: "STRING", description: "Student roll/code number e.g. 321030" },
          q1: { type: "STRING", description: "Mark for Question 1 (number or empty string)" },
          q2: { type: "STRING", description: "Mark for Question 2 (number or empty string)" },
          q3: { type: "STRING", description: "Mark for Question 3 (number or empty string)" },
          q4: { type: "STRING", description: "Mark for Question 4 (number or empty string)" },
          q5: { type: "STRING", description: "Mark for Question 5 (number or empty string)" },
          q6: { type: "STRING", description: "Mark for Question 6 (number or empty string)" },
          q7: { type: "STRING", description: "Mark for Question 7 (number or empty string)" },
          q8: { type: "STRING", description: "Mark for Question 8 (number or empty string)" },
          q9: { type: "STRING", description: "Mark for Question 9 (number or empty string)" },
          q10: { type: "STRING", description: "Mark for Question 10 (number or empty string)" },
          totalMark: { type: "STRING", description: "Total mark stated by the examiner" }
        },
        required: ["codeNo", "totalMark"]
      }
    }
  },
  required: ["courseCode", "records"]
};

// Resilient cascade of verified active multimodal models
const MODEL_CANDIDATES = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest"
];

/**
 * Extracts tabular marksheet data from base64 image with automatic model fallback
 * @param {string} base64Data Base64 image data URL or raw base64 string
 * @param {string} apiKey Gemini API Key
 * @param {number} pageNum Optional page index
 * @param {Function} onStatusUpdate Optional progress status callback
 * @returns {Promise<Object>} Extracted JSON
 */
export async function extractMarksheetWithGemini(
  base64Data,
  apiKey,
  pageNum = 1,
  onStatusUpdate = null
) {
  if (!apiKey) {
    throw new Error("Missing Gemini API Key. Please click the Settings gear icon to provide your API key.");
  }

  // Strip data:image/...;base64, prefix if present
  let cleanBase64 = base64Data;
  let mimeType = "image/jpeg";
  if (base64Data.startsWith("data:")) {
    const parts = base64Data.split(",");
    const meta = parts[0];
    cleanBase64 = parts[1];
    const match = meta.match(/data:([^;]+);/);
    if (match) mimeType = match[1];
  }

  const prompt = `You are an academic OCR specialist for university exam mark sheets.
Extract all handwritten numbers and printed header metadata from this scanned mark sheet (Page ${pageNum}).

Guidelines:
1. Header Information:
   - University name (e.g. BANGAMATA SHEIKH FOJILATUNNESA MUJIB SCIENCE & TECHNOLOGY UNIVERSITY)
   - Academic Session (e.g. 2022-2023)
   - Year & Semester (e.g. 2nd Year 1st Semester)
   - Examination (e.g. Final Examination 2023)
   - Department (e.g. EEE)
   - Course Code (e.g. EEE 2121)
   - Course Title (e.g. Electronic Device and Circuit II)
   - Examiner details if visible.

2. Student Rows:
   - For every student row, extract 'Code no.' (e.g. 321030).
   - Read obtained marks for Questions 1 to 10 (q1 through q10). Blank questions should be "".
   - Read 'Total Mark' as handwritten.
   - Return valid JSON matching the schema.`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: cleanBase64
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: "application/json"
    }
  };

  let lastError = null;

  // Try each model candidate until success
  for (const model of MODEL_CANDIDATES) {
    try {
      if (onStatusUpdate) {
        onStatusUpdate(`Analyzing with model: ${model}...`);
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 28000); // 28s timeout per candidate

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `HTTP ${response.status} (${response.statusText})`;
        try {
          const errJson = JSON.parse(errorText);
          if (errJson.error && errJson.error.message) {
            errorMsg = errJson.error.message;
          }
        } catch (_) {}

        console.warn(`[${model}] failed:`, errorMsg);
        lastError = new Error(`[${model}] ${errorMsg}`);
        continue; // Try next model candidate
      }

      const result = await response.json();
      const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textOutput) {
        throw new Error(`Empty response returned by ${model}`);
      }

      const parsed = JSON.parse(textOutput);
      return parsed; // Successfully extracted!

    } catch (err) {
      console.warn(`[${model}] error:`, err.message);
      lastError = err;
      // Continue to next fallback model
    }
  }

  // If all candidates failed
  throw new Error(
    `Extraction failed across all available Gemini models. Last error: ${lastError?.message || 'Network timeout'}. Please verify your API key and network connection.`
  );
}
