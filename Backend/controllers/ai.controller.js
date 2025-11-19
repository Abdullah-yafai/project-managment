import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiResponse.js";
import axios from "axios";

const HF_ENDPOINT_BASE = "https://router.huggingface.co/hf-inference/models";
const WORKING_MODEL = "facebook/bart-large-cnn";
const WORKING_PIPELINE = "summarization";

const callHf = (modelPath, pipeline, prompt) => {
  const url = `${HF_ENDPOINT_BASE}/${modelPath}/pipeline/${pipeline}`;
  // parameters: low temperature / no sampling to increase determinism
  return axios.post(
    url,
    { inputs: prompt, parameters: { max_new_tokens: 500, temperature: 0.2, do_sample: false } },
    {
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    }
  );
};

const makeMockPlan = (topic) => ({
  ideas: [
    `${topic} — Quick Tip #1`,
    `${topic} — Did you know?`,
    `${topic} — How-to Short`,
    `${topic} — Behind the Scenes`,
    `${topic} — Challenge Post`,
  ],
  captions: [
    `Start with this: ${topic} — make it a habit.`,
    `Level up your ${topic} in 3 steps.`,
    `Small actions > Big results. ${topic} tips.`,
    `Why ${topic} matters — short guide.`,
    `Join the ${topic} challenge today.`,
  ],
  hashtags: ["#trending", "#protips", "#daily", "#learn", "#growth", "#howto", "#guide", "#motivation", "#tips", "#now"],
  outline: `1. Intro to ${topic}\n2. Why it matters\n3. 5 practical steps\n4. Examples\n5. Conclusion & CTA`,
});

const extractJsonBetweenMarkers = (text) => {
  if (!text || typeof text !== "string") return null;
  // Strong marker approach
  const startMarker = "###JSON_START###";
  const endMarker = "###JSON_END###";
  const iStart = text.indexOf(startMarker);
  const iEnd = text.indexOf(endMarker);
  if (iStart !== -1 && iEnd !== -1 && iEnd > iStart) {
    const jsonText = text.substring(iStart + startMarker.length, iEnd).trim();
    try {
      return JSON.parse(jsonText);
    } catch (e) {
      return null;
    }
  }
  // fallback: try extract first JSON object/array found
  const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/m);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const aiController = asyncHandler(async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) throw new ApiError(400, "Topic is required");

    // Strong prompt with explicit markers and a strict 'JSON only' instruction
    const prompt = `
You are an expert social media content planner. Produce ONLY valid JSON inside the markers below.
Do NOT repeat the prompt, do NOT add any explanation or commentary, output EXACTLY one JSON object.

###JSON_START###
{
  "ideas": ["idea1", "idea2", "..."],
  "captions": ["caption1", "caption2", "..."],
  "hashtags": ["#tag1", "#tag2", "..."],
  "outline": "A single string containing the blog outline with sections (use \\n for new lines)"
}
###JSON_END###

Now create the content plan for the topic: "${topic}"
`;

    const hfRes = await callHf(WORKING_MODEL, WORKING_PIPELINE, prompt);
    const body = hfRes.data;

    // Candidate text extraction (many router responses embed generated text differently)
    let candidateText = "";
    if (body?.outputs && Array.isArray(body.outputs) && body.outputs[0]?.generated_text) {
      candidateText = body.outputs[0].generated_text;
    } else if (Array.isArray(body) && body[0]?.generated_text) {
      candidateText = body[0].generated_text;
    } else if (typeof body === "string") {
      candidateText = body;
    } else {
      candidateText = JSON.stringify(body);
    }

    // Try extracting JSON between markers or first JSON block
    const parsed = extractJsonBetweenMarkers(candidateText);

    if (parsed) {
      // Normalize result
      const normalized = {
        ideas: Array.isArray(parsed.ideas) ? parsed.ideas : [],
        captions: Array.isArray(parsed.captions) ? parsed.captions : [],
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
        outline: parsed.outline ? String(parsed.outline) : "",
        rawParsed: parsed,
      };
      return res.status(200).json(new ApiResponse(normalized, 200, "Content generated (parsed JSON)"));
    }

    // If parsing failed, return raw text (frontend can display) and a mock if empty
    const raw = candidateText || "";
    if (!raw || raw.length < 20) {
      // fallback to mock
      const mock = makeMockPlan(topic);
      return res.status(200).json(new ApiResponse({ ...mock, _mock: true }, 200, "HF returned nothing — mock returned (dev)"));
    }

    return res.status(200).json(new ApiResponse({ raw }, 200, "Content generated (raw text)"));

  } catch (err) {
    console.error("[AI ERROR]", err?.response?.status, err?.response?.data || err.message);
    // dev-friendly: return mock so frontend continues; remove in production
    const mock = makeMockPlan(req.body?.topic || "topic");
    return res.status(200).json(new ApiResponse({ ...mock, _mock: true }, 200, "HF unavailable — returned mock (dev)"));
  }
});

export { aiController };
