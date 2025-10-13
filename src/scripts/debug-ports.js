#!/usr/bin/env node
// Debug script to understand port issues
import { execSync } from 'child_process'

console.log('🔍 DEBUG: Checking ports manually...\n')

const ports = [5174, 5175, 5176]

for (const port of ports) {
  console.log(`=== Checking port ${port} ===`)

  try {
    // Check netstat output
    console.log(`Running: netstat -ano | findstr :${port}`)
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' })
    console.log('Netstat output:', output.trim() || '(empty)')

    if (output.trim()) {
      const lines = output.trim().split('\n')
      for (const line of lines) {
        if (line.includes(`:${port}`)) {
          const parts = line.trim().split(/\s+/)
          const pid = parts[parts.length - 1]
          console.log(`Found PID: ${pid}`)

          if (pid && pid !== '0') {
            try {
              console.log(`Running: tasklist /FI "PID eq ${pid}" /FO CSV /NH`)
              const taskInfo = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: 'utf8' })
              console.log('Task info:', taskInfo.trim())
            } catch (error) {
              console.log('Error getting task info:', error.message)
            }
          }
        }
      }
    } else {
      console.log('Port is free')
    }
  } catch (error) {
    console.log('Error or port is free:', error.message)
  }

  console.log('')
}