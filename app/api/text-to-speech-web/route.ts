import { NextRequest, NextResponse } from "next/server";

// Alternative TTS using browser's built-in speech synthesis
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Return instructions for client-side speech synthesis
    return NextResponse.json({
      success: true,
      message: "Use client-side speech synthesis",
      text: text.substring(0, 5000), // Limit text length
      method: "web-speech-api",
    });
  } catch (error) {
    console.error("Web TTS error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
