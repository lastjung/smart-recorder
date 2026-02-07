import asyncio
import edge_tts
import os

segments = [
    ("voice_01", "en-US-GuyNeural", "Day five hundred and forty-two on the Red Planet."),
    ("voice_02", "en-US-GuyNeural", "The dust has finally settled, and for the first time in weeks, I can see home."),
    ("voice_03", "en-US-GuyNeural", "Earth is just a tiny blue dot from here. It's strange how much you miss the small things."),
    ("voice_04", "en-US-GuyNeural", "The smell of rain, the taste of real coffee... and the sound of wind that doesn't scream."),
    ("voice_05", "en-US-GuyNeural", "But then I look at this sunset. It's blue, you know. A blue sunset on a red world."),
    ("voice_06", "en-US-GuyNeural", "We're actually here. We made it. Tell everyone... it's beautiful.")
]

async def generate_tts():
    for name, voice, text in segments:
        output_path = f"voice_assets/{name}.mp3"
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)
        print(f"Generated: {output_path}")

if __name__ == "__main__":
    if not os.path.exists("voice_assets"):
        os.makedirs("voice_assets")
    asyncio.run(generate_tts())
