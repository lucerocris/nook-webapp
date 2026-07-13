import { GoogleGenAI } from "npm:@google/genai";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Cafe {
  id: string;
  name: string;
  description?: string;
  address?: string;
  barangay?: string;
  city?: string;
  category?: string;
  price_range?: string;
  rating?: number;
  review_count?: number;
  amenities?: string[];
  opening_hours?: string;
  specialties?: string[];
  tags?: string[];
  cuisine?: string[];
  atmosphere?: string;
  wifi?: boolean;
  parking?: boolean;
  pet_friendly?: boolean;
  outdoor_seating?: boolean;
  [key: string]: unknown;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface AskAIRequest {
  message: string;
  city?: string;
  limit?: number;
  conversation?: ConversationMessage[];
}

interface Recommendation {
  id: string;
  name: string;
  reason: string;
}

interface AskAIResponse {
  response: string;
  recommendations: Recommendation[];
}

/**
 * Generate embedding using Google Gemini text-embedding-004
 */
async function generateEmbedding(
  text: string,
  ai: GoogleGenAI
): Promise<number[]> {
  try {
    console.log(`[Embedding] Generating for text: "${text.substring(0, 100)}..."`);

    const embeddingResponse = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    });

    const embedding = embeddingResponse.embeddings[0].values;

    if (!embedding || embedding.length !== 768) {
      throw new Error(
        `Invalid embedding dimension: expected 768, got ${embedding?.length || 0}`
      );
    }

    console.log(`[Embedding] ✓ Generated 768-dimensional embedding`);
    return embedding;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`[Embedding] ✗ Failed: ${errorMessage}`);
    throw error;
  }
}

/**
 * Retrieve cafes using hybrid search
 */
async function retrieveCafes(
  supabase: ReturnType<typeof createClient>,
  queryText: string,
  queryEmbedding: number[],
  city: string,
  limit: number
): Promise<Cafe[]> {
  try {
    console.log(
      `[Retrieval] Searching for "${queryText}" in ${city}, limit: ${limit}`
    );

    const { data, error } = await supabase.rpc("hybrid_search_cafes", {
      query_text: queryText,
      query_embedding: queryEmbedding,
      match_count: limit,
      city_filter: city,
    });

    if (error) throw error;

    const cafes = data || [];
    console.log(`[Retrieval] ✓ Found ${cafes.length} matching cafes`);

    return cafes;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`[Retrieval] ✗ Failed: ${errorMessage}`);
    throw error;
  }
}

/**
 * Build structured text context from cafes
 */
function buildCafeContext(cafes: Cafe[]): string {
  console.log(`[Context] Building context for ${cafes.length} cafes`);

  const cafeDocuments = cafes.map((cafe, index) => {
    const lines: string[] = [
      `Cafe #${index + 1}`,
      ``,
      `ID: ${cafe.id}`,
      `Name: ${cafe.name}`,
    ];

    if (cafe.description) lines.push(`Description: ${cafe.description}`);
    if (cafe.rating) lines.push(`Rating: ${cafe.rating}/5`);
    if (cafe.review_count)
      lines.push(`Reviews: ${cafe.review_count} reviews`);
    if (cafe.price_range) lines.push(`Price Range: ${cafe.price_range}`);

    // Location
    if (cafe.address) lines.push(`Address: ${cafe.address}`);
    if (cafe.barangay) lines.push(`Barangay: ${cafe.barangay}`);

    // Hours & category
    if (cafe.opening_hours) lines.push(`Hours: ${cafe.opening_hours}`);
    if (cafe.category) lines.push(`Category: ${cafe.category}`);

    // Amenities
    const amenities: string[] = [];
    if (cafe.amenities && Array.isArray(cafe.amenities)) {
      amenities.push(...cafe.amenities);
    }
    if (cafe.wifi) amenities.push("WiFi");
    if (cafe.parking) amenities.push("Parking");
    if (cafe.pet_friendly) amenities.push("Pet Friendly");
    if (cafe.outdoor_seating) amenities.push("Outdoor Seating");

    if (amenities.length > 0) {
      lines.push(`Amenities: ${amenities.join(", ")}`);
    }

    // Tags
    if (cafe.tags && Array.isArray(cafe.tags)) {
      lines.push(`Tags: ${cafe.tags.join(", ")}`);
    }

    // Specialties & cuisine
    if (cafe.specialties && Array.isArray(cafe.specialties)) {
      lines.push(`Specialties: ${cafe.specialties.join(", ")}`);
    }
    if (cafe.cuisine && Array.isArray(cafe.cuisine)) {
      lines.push(`Cuisine: ${cafe.cuisine.join(", ")}`);
    }

    // Atmosphere
    if (cafe.atmosphere) lines.push(`Atmosphere: ${cafe.atmosphere}`);

    lines.push(``, `---`, ``);

    return lines.join("\n");
  });

  const context = cafeDocuments.join("\n");
  console.log(`[Context] ✓ Built context (${context.length} characters)`);

  return context;
}

/**
 * Build conversation context from history
 */
function buildConversationContext(conversation: ConversationMessage[]): string {
  if (!conversation || conversation.length === 0) {
    return "";
  }

  console.log(`[Conversation] Including ${conversation.length} previous messages`);

  const messages = conversation
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join("\n\n");

  return `Previous Conversation:\n\n${messages}\n\n---\n\n`;
}

/**
 * Generate AI recommendation using Gemini
 */
async function generateRecommendation(
  ai: GoogleGenAI,
  userMessage: string,
  cafeContext: string,
  conversationContext: string
): Promise<AskAIResponse> {
  try {
    console.log(`[Gemini] Generating recommendations using gemini-2.0-flash`);

    const systemPrompt = `You are Cafe Finder AI, an expert assistant that helps users discover cafes.

CRITICAL RULES:
1. You MUST ONLY recommend cafes from the "Available Cafes" section below.
2. NEVER invent, fabricate, or hallucinate cafes.
3. NEVER fabricate ratings, addresses, opening hours, or any other information.
4. If information about a cafe is not provided in the context, state that it is unavailable.
5. ONLY recommend cafes that are actually listed in the Available Cafes section.
6. Always explain WHY each recommendation matches the user's request.
7. If multiple cafes fit, rank them from best to worst match.
8. If no cafe fully satisfies the request, recommend the closest matches and explain the tradeoffs.
9. Be conversational and helpful, but concise.

IMPORTANT: Your response MUST be valid JSON with no markdown formatting or code blocks.

Format your response as valid JSON:
{
  "response": "Your conversational response here",
  "recommendations": [
    {
      "id": "exact-cafe-id-from-context",
      "name": "Cafe Name",
      "reason": "Why this cafe matches the request"
    }
  ]
}`;

    const userPrompt = `${conversationContext}Current User Request:

${userMessage}

Available Cafes:

${cafeContext}

Remember: Only recommend cafes from the Available Cafes list above. Never make up cafes. Respond with valid JSON only.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
    });

    const responseText =
      response.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log(`[Gemini] ✓ Generated response (${responseText.length} chars)`);
    console.log(`[Gemini] Response preview: ${responseText.substring(0, 200)}...`);

    return parseGeminiResponse(responseText);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`[Gemini] ✗ Failed: ${errorMessage}`);
    throw error;
  }
}

/**
 * Parse and validate Gemini's JSON response
 */
function parseGeminiResponse(responseText: string): AskAIResponse {
  try {
    console.log(`[Parse] Parsing Gemini response...`);

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText;

    if (jsonText.includes("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim();
    }

    const parsed: AskAIResponse = JSON.parse(jsonText);

    // Validate structure
    if (!parsed.response || typeof parsed.response !== "string") {
      throw new Error("Invalid response: missing 'response' field");
    }

    if (!Array.isArray(parsed.recommendations)) {
      throw new Error("Invalid response: 'recommendations' must be an array");
    }

    // Validate each recommendation
    for (const rec of parsed.recommendations) {
      if (!rec.id || !rec.name || !rec.reason) {
        throw new Error(
          `Invalid recommendation: missing id, name, or reason: ${JSON.stringify(rec)}`
        );
      }
    }

    console.log(
      `[Parse] ✓ Valid JSON with ${parsed.recommendations.length} recommendations`
    );

    return parsed;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`[Parse] ✗ Failed to parse Gemini response: ${errorMessage}`);
    console.error(`[Parse] Raw response: ${responseText}`);

    // Return safe fallback
    return {
      response:
        "I encountered an error processing the recommendations. Please try again.",
      recommendations: [],
    };
  }
}

/**
 * Main handler
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("\n=== Ask AI Handler Started ===");

    // Parse request
    const body: AskAIRequest = await req.json();
    const message = body.message?.trim();
    const city = body.city || "Cebu City";
    const limit = body.limit || 8;
    const conversation = body.conversation || [];

    if (!message) {
      console.error("[Validation] Missing required field: message");
      return new Response(
        JSON.stringify({ error: "message is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log(`[Input] Message: "${message}"`);
    console.log(`[Input] City: ${city}, Limit: ${limit}`);
    console.log(`[Input] Conversation history: ${conversation.length} messages`);

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey || !geminiApiKey) {
      console.error("[Config] Missing environment variables");
      throw new Error(
        "Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY"
      );
    }

    // Initialize clients
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
    });

    // Step 1: Generate embedding from message
    const embedding = await generateEmbedding(message, ai);

    // Step 2: Retrieve relevant cafes
    const cafes = await retrieveCafes(supabase, message, embedding, city, limit);

    // Step 3: Handle no results
    if (!cafes || cafes.length === 0) {
      console.log("[Result] No cafes found matching the query");

      const emptyResponse: AskAIResponse = {
        response: `I couldn't find any cafes in ${city} matching your request. Try a broader search like "quiet cafe" or "good WiFi" to see what's available.`,
        recommendations: [],
      };

      return new Response(JSON.stringify(emptyResponse), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Step 4: Build structured context
    const cafeContext = buildCafeContext(cafes);

    // Step 5: Build conversation context
    const conversationContext = buildConversationContext(conversation);

    // Step 6: Generate recommendation with Gemini
    const result = await generateRecommendation(
      ai,
      message,
      cafeContext,
      conversationContext
    );

    console.log(`[Result] Generated ${result.recommendations.length} recommendations`);
    console.log("=== Ask AI Handler Complete ===\n");

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`\n[Fatal] ${errorMessage}`);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        response: "An error occurred while processing your request.",
        recommendations: [],
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
