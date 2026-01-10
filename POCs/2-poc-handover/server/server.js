import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json({ limit: "2mb" }));
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- helpers ----------------------------------------------------

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

// Simple Retry (z.B. bei transienten Netz/Timeout-Themen)
async function withRetry(fn, { retries = 2, baseDelay = 400 } = {}) {
    let lastErr;
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (e) {
            lastErr = e;
            await sleep(baseDelay * (i + 1));
        }
    }
    throw lastErr;
}

// Baut den "User"-Text zusammen (Prompt + Payload)
// (Payload wird als JSON in den Input gegeben, so wie du es schon gemacht hast.)
function buildUserInput(prompt, payload) {
    return `${prompt}

INPUT_JSON:
${JSON.stringify(payload)}
`;
}

// --- route ------------------------------------------------------

app.post("/api/generate", async (req, res) => {
    try {
        const { prompt, payload } = req.body || {};
        if (!prompt || !payload) {
            return res.status(400).send("Missing prompt or payload");
        }

        const response = await withRetry(async () => {
            return await client.responses.create({
                model: "gpt-5.2",

                // "system"-Rolle: harte Leitplanken
                input: [
                    {
                        role: "system",
                        content:
                            "You are a frontend code generator. Return ONLY JSON that matches the provided schema. No extra text."
                    },
                    {
                        role: "user",
                        content: buildUserInput(prompt, payload)
                    }
                ],

                // Strict Structured Output: garantiert { code: string }
                text: {
                    format: {
                        type: "json_schema",
                        name: "code_response",
                        strict: true,
                        schema: {
                            type: "object",
                            properties: {
                                code: { type: "string" }
                            },
                            required: ["code"],
                            additionalProperties: false
                        }
                    }
                }
            });
        });

        // response.output_text enthält bei json_schema einen JSON-String, z.B.:
        // {"code":"..."}
        let code = "";
        try {
            const parsed = JSON.parse(response.output_text || "{}");
            code = typeof parsed.code === "string" ? parsed.code : "";
        } catch {
            code = "";
        }

        // Fallback falls leer
        if (!code.trim()) {
            return res.json({ code: "/* empty model response */\n" });
        }

        // Popup bekommt NUR den Code-String (keinen Erklärtext)
        return res.json({ code });
    } catch (e) {
        // Fehler sichtbar machen (Popup zeigt dann API Error)
        return res.status(500).send(e?.message || "Server error");
    }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => console.log(`Proxy running on http://localhost:${port}`));
