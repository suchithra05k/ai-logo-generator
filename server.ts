import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for logo generation
  app.post("/api/generate-logo", async (req, res) => {
    const { companyName, description, style, fontPreference, letterSpacing } = req.body;

    if (!companyName || !description) {
      return res.status(400).json({ error: "Company name and description are required." });
    }

    try {
      const prompt = `
        Create a professional, modern, and minimalist SVG logo for a company named "${companyName}".
        Company Description: ${description}
        Preferred Style: ${style || "Modern Minimalist"}
        Typography Preference: ${fontPreference || "Matching the style"}
        Letter Spacing: ${letterSpacing || "Normal"}
        
        Guidelines:
        1. Output ONLY a valid JSON object.
        2. The JSON must contain:
           - "svg": The full SVG code as a string. Use viewBox="0 0 512 512" and ensure it has NO fixed width/height. Set fill="currentColor" on paths if they should inherit color, or use the generated palette. Include the company name text using a SVG <text> element.
           - "explanation": A 2-sentence explanation of the design symbols.
           - "colors": Array of primary color hex codes used.
           - "fontSuggestion": A font vibe (e.g. "Sleek Sans-Serif", "Bold Geometric").
        3. Break the logo into clear <g> (group) or <path> elements so they can be animated independently by CSS selectors.
        4. Keep it modern, vector-clean, and professional.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              svg: { type: Type.STRING },
              explanation: { type: Type.STRING },
              colors: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              fontSuggestion: { type: Type.STRING }
            },
            required: ["svg", "explanation", "colors", "fontSuggestion"]
          }
        }
      });

      const result = JSON.parse(response.text);
      res.json(result);
    } catch (error) {
      console.error("Logo generation error:", error);
      res.status(500).json({ error: "Failed to generate logo." });
    }
  });

  // API Route for color harmonization
  app.post("/api/harmonize-colors", async (req, res) => {
    const { colors, style } = req.body;

    if (!colors || !Array.isArray(colors)) {
      return res.status(400).json({ error: "Colors array is required." });
    }

    try {
      const prompt = `
        Given the following hex color palette: ${colors.join(", ")}
        And the brand style: ${style}
        
        Generate 3 different harmonious color variations. 
        Each variation should have the same number of colors as the input (${colors.length}).
        
        Output ONLY a valid JSON array of objects, where each object has:
        - "palette": Array of hex codes.
        - "description": Short name for this variation (e.g., "Muted Professional", "Vibrant Tech").
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                palette: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                description: { type: Type.STRING }
              },
              required: ["palette", "description"]
            }
          }
        }
      });

      const result = JSON.parse(response.text);
      res.json(result);
    } catch (error) {
      console.error("Harmonization error:", error);
      res.status(500).json({ error: "Failed to harmonize colors." });
    }
  });

  // API Route for font suggestions
  app.post("/api/suggest-fonts", async (req, res) => {
    const { description, style, customInput, letterSpacing } = req.body;

    if (!description) {
      return res.status(400).json({ error: "Description is required." });
    }

    try {
      const prompt = `
        As an expert brand typographer, suggest 4 specific and unique font pairings or typography styles for a company.
        
        CONTEXT:
        - Company Description: "${description}"
        - Brand Trajectory (Visual Style): "${style}"
        ${customInput ? `- User's Specific Request/Vibe: "${customInput}"` : ""}
        ${letterSpacing ? `- Preferred Letter Spacing: "${letterSpacing}"` : ""}
        
        Your suggestions must strictly align with the "${style}" trajectory while reflecting the specific nature of the business described as "${description}".
        ${customInput ? `Crucially, refine your suggestions to match or complement the user's specific request: "${customInput}".` : ""}
        ${letterSpacing ? `The user prefers a "${letterSpacing}" letter spacing. Reflect this in your rationale and preview specifications.` : ""}
        
        Output ONLY a valid JSON array of objects, where each object has:
        - "pairName": A specific combination (e.g., "Mabry Pro & Cardinal", "Neue Haas Grotesk & Crimson Text").
        - "rationale": 1-2 sentences explaining the technical and emotional suitability.
        - "visualVibe": A 2-3 word phrase characterizing the aesthetic (e.g., "Swiss Precision", "Warm Humanist").
        - "previewStyle": A design specification object for a visual mock:
            - "fontCategory": "serif" | "sans-serif" | "mono" | "display"
            - "weight": "light" | "normal" | "bold" | "black"
            - "letterSpacing": "tight" | "normal" | "wide"
            - "textTransform": "uppercase" | "lowercase" | "none"
            - "slant": "none" | "italic"
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                pairName: { type: Type.STRING },
                rationale: { type: Type.STRING },
                visualVibe: { type: Type.STRING },
                previewStyle: {
                  type: Type.OBJECT,
                  properties: {
                    fontCategory: { type: Type.STRING },
                    weight: { type: Type.STRING },
                    letterSpacing: { type: Type.STRING },
                    textTransform: { type: Type.STRING },
                    slant: { type: Type.STRING }
                  },
                  required: ["fontCategory", "weight", "letterSpacing", "textTransform", "slant"]
                }
              },
              required: ["pairName", "rationale", "visualVibe", "previewStyle"]
            }
          }
        }
      });

      const result = JSON.parse(response.text);
      res.json(result);
    } catch (error) {
      console.error("Font suggestion error:", error);
      res.status(500).json({ error: "Failed to suggest fonts." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
