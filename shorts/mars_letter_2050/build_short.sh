#!/bin/bash
PROJECT_DIR="/Users/tube/PG/smart-recorder/shorts/mars_letter_2050"
ASSETS_DIR="$PROJECT_DIR/assets"
cd "$PROJECT_DIR"

mkdir -p assets

# Download videos
curl -L "https://videos.pexels.com/video-files/854278/854278-sd_640_360_30fps.mp4" -o assets/mars_view.mp4
curl -L "https://videos.pexels.com/video-files/8474689/8474689-sd_360_640_30fps.mp4" -o assets/astronaut_walking.mp4
curl -L "https://videos.pexels.com/video-files/33430409/14227667_640_360_24fps.mp4" -o assets/mars_rotation.mp4
curl -L "https://videos.pexels.com/video-files/8474624/8474624-sd_360_640_30fps.mp4" -o assets/astronaut_close.mp4

# Combine voice assets
ffmpeg -y \
  -i voice_assets/voice_01.mp3 \
  -i voice_assets/voice_02.mp3 \
  -i voice_assets/voice_03.mp3 \
  -i voice_assets/voice_04.mp3 \
  -i voice_assets/voice_05.mp3 \
  -i voice_assets/voice_06.mp3 \
  -filter_complex "concat=n=6:v=0:a=1" \
  combined_voice.mp3

# Build final video
FFMPEG="/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"

$FFMPEG -y \
  -stream_loop -1 -i assets/mars_view.mp4 \
  -stream_loop -1 -i assets/astronaut_walking.mp4 \
  -stream_loop -1 -i assets/mars_rotation.mp4 \
  -stream_loop -1 -i assets/astronaut_close.mp4 \
  -i combined_voice.mp3 \
  -i "/Users/tube/PG/smart-recorder/shorts/trump_ai_ceo/assets/satire_bgm.mp3" \
  -filter_complex \
  "[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,split=2[v0a][v0b]; \
   [1:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,split=2[v1a][v1b]; \
   [2:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,split=1[v2a]; \
   [3:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,split=1[v3a]; \
   [v0a][v1a]xfade=transition=fade:duration=0.5:offset=5[xf1]; \
   [xf1][v2a]xfade=transition=fade:duration=0.5:offset=12[xf2]; \
   [xf2][v1b]xfade=transition=fade:duration=0.5:offset=20[xf3]; \
   [xf3][v3a]xfade=transition=fade:duration=0.5:offset=28[xf4]; \
   [xf4][v0b]xfade=transition=fade:duration=0.5:offset=35[v_nosub]; \
   [v_nosub]subtitles=filename='subtitles.srt':force_style='Alignment=2,MarginV=45,Fontsize=14,PrimaryColour=&H0000FFFF,BorderStyle=1'[v]; \
   [5:a]volume=0.15[bgm]; \
   [4:a][bgm]amix=inputs=2:duration=first[a]" \
  -map "[v]" -map "[a]" -t 43 -c:v libx264 -pix_fmt yuv420p mars_letter_final.mp4
