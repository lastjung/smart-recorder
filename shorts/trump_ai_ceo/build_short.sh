#!/bin/bash

# FFmpeg Path
FFMPEG="/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"

# Project Paths
PROJECT_DIR="/Users/tube/PG/smart-recorder/shorts/trump_ai_ceo"
ASSETS_DIR="$PROJECT_DIR/assets"
VOICE_DIR="$PROJECT_DIR/voice_assets"
OUTPUT_FILE="$PROJECT_DIR/trump_ai_ceo_final.mp4"

# 1. Combine Voice Assets
$FFMPEG -y \
  -i "$VOICE_DIR/voice_01.mp3" \
  -i "$VOICE_DIR/voice_02.mp3" \
  -i "$VOICE_DIR/voice_03.mp3" \
  -i "$VOICE_DIR/voice_04.mp3" \
  -i "$VOICE_DIR/voice_05.mp3" \
  -i "$VOICE_DIR/voice_06.mp3" \
  -filter_complex "concat=n=6:v=0:a=1,atempo=1.05[a]" \
  -map "[a]" "$PROJECT_DIR/combined_voice.mp3"

# 2. Final Composition
$FFMPEG -y \
  -i "$ASSETS_DIR/ai_interview_01.mp4" \
  -i "$ASSETS_DIR/ceo_talking_01.mp4" \
  -i "$ASSETS_DIR/ai_robot_01_new.mp4" \
  -i "$ASSETS_DIR/ceo_talking_02.mp4" \
  -i "$ASSETS_DIR/office_conversation.mp4" \
  -i "$ASSETS_DIR/ceo_talking_03.mp4" \
  -i "$PROJECT_DIR/combined_voice.mp3" \
  -i "$ASSETS_DIR/satire_bgm.mp3" \
  -filter_complex " \
    [0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,trim=duration=8.3,setpts=PTS-STARTPTS[v0]; \
    [1:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,trim=duration=12.7,setpts=PTS-STARTPTS[v1]; \
    [2:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,trim=duration=3.8,setpts=PTS-STARTPTS[v2]; \
    [3:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,trim=duration=12.7,setpts=PTS-STARTPTS[v3]; \
    [4:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,trim=duration=5.6,setpts=PTS-STARTPTS[v4]; \
    [5:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,trim=duration=14.2,setpts=PTS-STARTPTS[v5]; \
    [v0][v1][v2][v3][v4][v5]concat=n=6:v=1:a=0[v_raw]; \
    [7:a]volume=0.15,aloop=loop=-1:size=2e9[bgm]; \
    [6:a][bgm]amix=inputs=2:duration=first[a_final]; \
    [v_raw]subtitles=filename='/Users/tube/PG/smart-recorder/shorts/trump_ai_ceo/subtitles.srt':force_style='Alignment=2,MarginV=45,Fontsize=14,PrimaryColour=&H0000FFFF,BorderStyle=1'[v_sub] \
  " \
  -map "[v_sub]" -map "[a_final]" -t 57.3 -c:v libx264 -pix_fmt yuv420p "$OUTPUT_FILE"
