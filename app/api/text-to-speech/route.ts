import { NextRequest, NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "pNInz6obpgDQGcFmaJgB"; // Mark - Natural Conversation voice ID

// Clean and prepare text for speech synthesis
function cleanTextForSpeech(text: string): string {
  return (
    text
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Replace multiple spaces with single space
      .replace(/\s+/g, " ")
      // Remove special characters that might cause issues
      .replace(/[^\w\s.,!?;:'"()-]/g, "")
      // Trim whitespace
      .trim()
      // Limit length to prevent extremely long audio (optional)
      .substring(0, 5000)
  ); // Limit to ~5000 characters for reasonable audio length
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Clean and prepare the text for speech synthesis
    const textToConvert = cleanTextForSpeech(text);

    if (textToConvert.length === 0) {
      return NextResponse.json(
        { error: "No valid text content found" },
        { status: 400 }
      );
    }

    console.log(
      "Generating audio for article text length:",
      textToConvert.length
    );

    // Check if API key has proper permissions
    if (!ELEVENLABS_API_KEY) {
      console.log("❌ ElevenLabs API key not configured");
      return NextResponse.json(
        {
          error:
            "ElevenLabs API key not configured. Please add ELEVENLABS_API_KEY to your environment variables.",
        },
        { status: 500 }
      );
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: "POST",
          headers: {
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: textToConvert,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
              style: 0.0,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs API error:", errorText);

        // If API key lacks permissions, return clear error
        if (response.status === 401) {
          console.log("❌ API key lacks text_to_speech permissions");
          return NextResponse.json(
            {
              error:
                "ElevenLabs API key lacks text_to_speech permissions. Please check your account settings and API key permissions.",
            },
            { status: 401 }
          );
        }

        return NextResponse.json(
          { error: "Failed to generate audio" },
          { status: response.status }
        );
      }

      const audioBuffer = await response.arrayBuffer();

      console.log(
        "✅ Successfully generated audio:",
        audioBuffer.byteLength,
        "bytes"
      );

      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": audioBuffer.byteLength.toString(),
        },
      });
    } catch (apiError) {
      console.error("ElevenLabs API request failed:", apiError);
      return NextResponse.json(
        {
          error:
            "Failed to connect to ElevenLabs API. Please check your internet connection and API key.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Text-to-speech error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
