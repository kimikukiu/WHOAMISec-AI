#!/bin/bash
while true; do
  cd /home/z/my-project
  node --max-old-space-size=4096 .next/standalone/server.js &
  PID=$!
  sleep 3
  # Only warmup lightweight API, NOT the main page
  curl -s --max-time 10 http://localhost:3000/api/auth/check > /dev/null 2>&1
  # Keep alive with lightweight ping every 3s
  while kill -0 $PID 2>/dev/null; do
    curl -s --max-time 3 http://localhost:3000/api/auth/check > /dev/null 2>&1
    sleep 3
  done
  sleep 1
done
