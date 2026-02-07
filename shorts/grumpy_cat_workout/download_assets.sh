#!/bin/bash

# Project Directory
PROJECT_DIR="/Users/tube/PG/smart-recorder/shorts/grumpy_cat_workout"
ASSETS_DIR="$PROJECT_DIR/assets"

mkdir -p "$ASSETS_DIR"

# Video 1: Grumpy Cat on Chair
curl -L "https://videos.pexels.com/video-files/4566126/4566126-uhd_2560_1440_24fps.mp4" -o "$ASSETS_DIR/grumpy_cat_chair.mp4"

# Video 2: Couple Workout (sabotage target)
curl -L "https://videos.pexels.com/video-files/4158864/4158864-hd_1080_1920_24fps.mp4" -o "$ASSETS_DIR/couple_workout.mp4"

# Additional sources can be added here
echo "Assets download initiated."
