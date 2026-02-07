import asyncio
import os
import edge_tts

async def generate_voiceovers():
    project_dir = "/Users/tube/PG/smart-recorder/shorts/grumpy_cat_workout/voice_assets"
    os.makedirs(project_dir, exist_ok=True)
    
    script = [
        ("owner_01", "Alright! Day 4 of the home workout challenge! Feeling great!", "en-US-GuyNeural"),
        ("cat_01", "Oh, look at them. Flailing on the rug like landed fish. Pathetic.", "en-GB-SoniaNeural"),
        ("cat_02", "Time to initiate phase one: The Trip Hazard. If I sit here, they can't lunge. Tactical genius.", "en-GB-SoniaNeural"),
        ("owner_02", "Uh... kitty? Can you move just a bit? I'm trying to— Oof!", "en-US-GuyNeural"),
        ("cat_03", "I don't see any treats falling out of those squats. Abort the mission? Never.", "en-GB-SoniaNeural"),
        ("cat_04", "Victory is mine. Now, human... where is my salmon?", "en-GB-SoniaNeural")
    ]
    
    for filename, text, voice in script:
        output_path = os.path.join(project_dir, f"{filename}.mp3")
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)
        print(f"Generated: {output_path}")

    # Combine narration
    inputs = " ".join([f"-i {project_dir}/{item[0]}.mp3" for item in script])
    filter_complex = "".join([f"[{i}:a]" for i in range(len(script))]) + f"concat=n={len(script)}:v=0:a=1[out]"
    # Use absolute path for ffmpeg if possible, or assume it's in PATH
    os.system(f"ffmpeg -y {inputs} -filter_complex '{filter_complex}' -map '[out]' /Users/tube/PG/smart-recorder/shorts/grumpy_cat_workout/full_narration.mp3")

if __name__ == "__main__":
    asyncio.run(generate_voiceovers())
