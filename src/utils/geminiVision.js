/**
 * Vision Extraction Service using Google Gemini 2.0 Flash API
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

/**
 * Extracts tabular marksheet data from a base64 image using Gemini 2.0 Flash
 * @param {string} base64Data Base64 image data URL or raw base64 string
 * @param {string} apiKey Gemini API Key
 * @param {number} pageNum Optional page index
 * @returns {Promise<Object>} Extracted JSON
 */
export async function extractMarksheetWithGemini(base64Data, apiKey, pageNum = 1) {
  if (!apiKey) {
    throw new Error("Missing Gemini API Key. Please provide an API key in Settings.");
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

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `You are a high-precision academic OCR specialist for university examination mark sheets.
Extract all handwritten numbers and printed header metadata from this scanned exam mark sheet page (Page ${pageNum}).

Guidelines:
1. Extract Header Information:
   - University name (e.g. BANGAMATA SHEIKH FOJILATUNNESA MUJIB SCIENCE & TECHNOLOGY UNIVERSITY)
   - Academic Session (e.g. 2022-2023)
   - Year & Semester (e.g. 2nd Year 1st Semester)
   - Examination (e.g. Final Examination 2023)
   - Department (e.g. EEE)
   - Course Code (e.g. EEE 2121)
   - Course Title (e.g. Electronic Device and Circuit II)
   - Examiner Name & designation from seal/signature if present (e.g. Shuvo Dev, Lecturer).

2. Extract Mark Sheet Table Rows:
   - For every student row, read 'Code no.' (usually a 6-digit number like 321030).
   - Read obtained marks against Question Numbers 1 through 10 (q1 through q10). If a question is blank or has a dash ('-'), output empty string ("").
   - Read 'Total Mark' column exactly as handwritten by the examiner.
   - Do NOT omit rows. Include all rows that have a Code number or marks. If a row has zeros across (e.g. absent 0 0 0 0 -> total 00), record it with 0.
   - Return valid JSON strictly adhering to the schema.`;

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

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    let msg = `Gemini API error (${response.status}): ${response.statusText}`;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.error && errJson.error.message) {
        msg = errJson.error.message;
      }
    } catch (_) {
      // ignore
    }
    throw new Error(msg);
  }

  const result = await response.json();
  const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOutput) {
    throw new Error("No data returned by Gemini Vision model.");
  }

  try {
    const parsed = JSON.parse(textOutput);
    return parsed;
  } catch (err) {
    throw new Error("Failed to parse AI output into valid JSON: " + err.message);
  }
}
