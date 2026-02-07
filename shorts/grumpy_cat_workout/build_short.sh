#!/bin/bash

# Configuration
PROJECT_DIR="/Users/tube/PG/smart-recorder/shorts/grumpy_cat_workout"
ASSETS_DIR="$PROJECT_DIR/assets"
VOICE_DIR="$PROJECT_DIR/voice_assets"
OUTPUT_FILE="$PROJECT_DIR/grumpy_cat_workout_final.mp4"
FFMPEG="/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"

# Ensure directories exist
mkdir -p "$PROJECT_DIR"

# 1. Combine Audio (Redoing to be 100% sure)
$FFMPEG -y -i "$VOICE_DIR/owner_01.mp3" \
          -i "$VOICE_DIR/cat_01.mp3" \
          -i "$VOICE_DIR/cat_02.mp3" \
          -i "$VOICE_DIR/owner_02.mp3" \
          -i "$VOICE_DIR/cat_03.mp3" \
          -i "$VOICE_DIR/cat_04.mp3" \
          -filter_complex "concat=n=6:v=0:a=1[a]" -map "[a]" "$PROJECT_DIR/full_narration.mp3"

# 2. Main Composition
# Logic: 
# - Scale everything to 720x1280 first.
# - Use simple concatenation or precise xfade with matching timestamps.
# - Subtitles added at the very end.

$FFMPEG -y \
  -stream_loop -1 -i "$ASSETS_DIR/couple_workout.mp4" \
  -stream_loop -1 -i "$ASSETS_DIR/grumpy_cat_chair.mp4" \
  -i "$PROJECT_DIR/full_narration.mp3" \
  -filter_complex "[0:v]scale=720:-1,crop=iw:ih*3/4:0:ih/4,pad=720:1280:0:0:black,fps=30,split=2[v0_a][v0_b]; \
                   [1:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,split=2[v1_a][v1_b]; \
                   [v0_a][v1_a]xfade=transition=fade:duration=0.5:offset=4[xf1]; \
                   [xf1][v0_b]xfade=transition=fade:duration=0.5:offset=10[xf2]; \
                   [xf2][v1_b]xfade=transition=fade:duration=0.5:offset=25[v_nosub]; \
                   [v_nosub]subtitles=filename='$PROJECT_DIR/subtitles.srt':force_style='Alignment=2,MarginV=45,Fontsize=14,PrimaryColour=&H0000FFFF,BorderStyle=1'[v]" \
  -map "[v]" -map 2:a -t 39 -c:v libx264 -pix_fmt yuv420p "$OUTPUT_FILE"

echo "Build complete: $OUTPUT_FILE"
