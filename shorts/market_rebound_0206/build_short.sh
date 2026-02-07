#!/bin/bash
PROJECT_DIR="/Users/tube/PG/smart-recorder/shorts/market_rebound_0206"
cd "$PROJECT_DIR"

FFMPEG="/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"

# Combine voice assets
$FFMPEG -y \
  -i voice_assets/voice_01.mp3 \
  -i voice_assets/voice_02.mp3 \
  -i voice_assets/voice_03.mp3 \
  -i voice_assets/voice_04.mp3 \
  -i voice_assets/voice_05.mp3 \
  -i voice_assets/voice_06.mp3 \
  -i voice_assets/voice_07.mp3 \
  -filter_complex "concat=n=7:v=0:a=1" \
  combined_voice.mp3

# Use existing assets for demo
SRC_DIR="/Users/tube/PG/smart-recorder/shorts/trump_ai_ceo/assets"
CAT_DIR="/Users/tube/PG/smart-recorder/shorts/grumpy_cat_workout/assets"

$FFMPEG -y \
  -stream_loop -1 -i "$SRC_DIR/abstract_tech.mp4" \
  -stream_loop -1 -i "$SRC_DIR/office_conversation.mp4" \
  -stream_loop -1 -i "$SRC_DIR/ai_robot_01.mp4" \
  -stream_loop -1 -i "$CAT_DIR/grumpy_cat_chair.mp4" \
  -i combined_voice.mp3 \
  -i "$SRC_DIR/satire_bgm.mp3" \
  -filter_complex \
  "[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,split=3[v0a][v0b][v0c]; \
   [1:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,split=1[v1a]; \
   [2:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,split=1[v2a]; \
   [3:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,split=1[v3a]; \
   [v0a][v1a]xfade=transition=fade:duration=0.5:offset=6[xf1]; \
   [xf1][v0b]xfade=transition=fade:duration=0.5:offset=16[xf2]; \
   [xf2][v2a]xfade=transition=fade:duration=0.5:offset=23[xf3]; \
   [xf3][v3a]xfade=transition=fade:duration=0.5:offset=33[xf4]; \
   [xf4][v0c]xfade=transition=fade:duration=0.5:offset=41[v_nosub]; \
   [v_nosub]subtitles=filename='$PROJECT_DIR/subtitles.srt':force_style='Alignment=2,MarginV=45,Fontsize=14,PrimaryColour=&H0000FFFF,BorderStyle=1'[v]; \
   [5:a]volume=0.2[bgm]; \
   [4:a][bgm]amix=inputs=2:duration=first[a]" \
  -map "[v]" -map "[a]" -t 50 -c:v libx264 -pix_fmt yuv420p market_rebound_final.mp4
