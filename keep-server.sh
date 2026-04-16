#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting server..."
  npm run dev >> dev.log 2>&1
  echo "[$(date)] Server died, restarting in 3s..."
  sleep 3
done
