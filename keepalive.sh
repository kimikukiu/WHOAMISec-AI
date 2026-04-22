#!/bin/bash
while true; do
  npx next dev -p 3000 2>&1
  echo "[$(date)] Restarting..."
  sleep 2
done
