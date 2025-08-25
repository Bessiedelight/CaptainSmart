// Test script to check ElevenLabs API key status and permissions
const ELEVENLABS_API_KEY = "your_new_api_key_here"; // Replace with your new API key

async function checkElevenLabsStatus() {
  console.log("🔍 Checking ElevenLabs API Status...\n");

  try {
    // 1. Check API key validity and user info
    console.log("1️⃣ Checking API key and user info...");
    const userResponse = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log("✅ API Key is valid!");
      console.log("👤 User:", userData.first_name, userData.last_name);
      console.log("📧 Email:", userData.email);
      console.log("💰 Subscription:", userData.subscription?.tier || "Free");
      console.log(
        "🎯 Character Count:",
        userData.subscription?.character_count || 0
      );
      console.log(
        "🔄 Character Limit:",
        userData.subscription?.character_limit || 10000
      );
    } else {
      console.log("❌ API Key invalid or expired");
      const errorText = await userResponse.text();
      console.log("Error:", errorText);
      return;
    }

    console.log("\n2️⃣ Checking available voices...");
    // 2. Check available voices
    const voicesResponse = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    });

    if (voicesResponse.ok) {
      const voicesData = await voicesResponse.json();
      console.log("✅ Voices accessible!");
      console.log("🎤 Available voices:", voicesData.voices.length);

      // Find Mark voice
      const markVoice = voicesData.voices.find((v) =>
        v.name.toLowerCase().includes("mark")
      );
      if (markVoice) {
        console.log(
          "🎯 Mark voice found:",
          markVoice.name,
          "(ID:",
          markVoice.voice_id + ")"
        );
      } else {
        console.log("⚠️ Mark voice not found, available voices:");
        voicesData.voices.slice(0, 5).forEach((voice) => {
          console.log("  -", voice.name, "(ID:", voice.voice_id + ")");
        });
      }
    }

    console.log("\n3️⃣ Testing text-to-speech permission...");
    // 3. Test actual TTS generation with minimal text
    const testText = "Hello, this is a test.";
    const voiceId = "pNInz6obpgDQGcFmaJgB"; // Mark voice ID

    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: testText,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (ttsResponse.ok) {
      const audioBuffer = await ttsResponse.arrayBuffer();
      console.log("🎉 SUCCESS! Text-to-speech is working!");
      console.log("🎵 Generated audio size:", audioBuffer.byteLength, "bytes");
      console.log("\n✅ Your ElevenLabs integration is ready to use!");
    } else {
      const errorText = await ttsResponse.text();
      console.log("❌ Text-to-speech failed");
      console.log("📄 Error response:", errorText);

      if (ttsResponse.status === 401) {
        console.log(
          "\n🔧 SOLUTION: Your API key lacks text_to_speech permission"
        );
        console.log("📋 Steps to fix:");
        console.log("   1. Go to https://elevenlabs.io");
        console.log("   2. Check your subscription plan");
        console.log("   3. Go to Profile → API Keys");
        console.log("   4. Create new API key with text_to_speech permission");
        console.log("   5. Update your .env.local file");
      }
    }
  } catch (error) {
    console.error("💥 Error during API check:", error.message);
  }
}

// Run the check
checkElevenLabsStatus();
