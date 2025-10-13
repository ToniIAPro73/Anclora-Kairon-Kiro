#!/usr/bin/env node
// Port Killer Script - Force kills processes on specified ports
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class PortKiller {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..')
    this.ports = {
      landing: 5174,
      app: 5175,
      production: 4174
    }
  }

  // Get all PIDs using specified ports
  getPortPIDs(port) {
    try {
      console.log(`🔍 Checking port ${port}...`)
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' })
      const pids = new Set()

      console.log(`Debug: netstat output for port ${port}:`, output.trim() || '(empty)')

      if (output && output.trim()) {
        const lines = output.trim().split('\n')
        console.log(`Debug: Found ${lines.length} lines in netstat output`)

        for (const line of lines) {
          console.log(`Debug: Processing line: "${line}"`)

          if (line.includes(`:${port}`)) {
            const parts = line.trim().split(/\s+/)
            const pid = parts[parts.length - 1]
            console.log(`Debug: Extracted PID: "${pid}" from parts:`, parts)

            if (pid && pid !== '0' && !isNaN(parseInt(pid))) {
              console.log(`✅ Found valid PID: ${pid} on port ${port}`)
              pids.add(pid)
            } else {
              console.log(`❌ Invalid PID: "${pid}"`)
            }
          }
        }
      } else {
        console.log(`✅ Port ${port} is available`)
      }

      return Array.from(pids)
    } catch (error) {
      console.log(`✅ Port ${port} is available (netstat command failed/returned empty)`)
      return []
    }
  }

  // Kill process by PID
  killPID(pid) {
    try {
      // First try graceful termination
      execSync(`taskkill /PID ${pid} /T`, { stdio: 'inherit' })
      console.log(`✅ Gracefully terminated PID: ${pid}`)
      return true
    } catch (error) {
      try {
        // Force kill if graceful fails
        execSync(`taskkill /PID ${pid} /F /T`, { stdio: 'inherit' })
        console.log(`🔨 Force killed PID: ${pid}`)
        return true
      } catch (forceError) {
        console.error(`❌ Failed to kill PID: ${pid}`)
        return false
      }
    }
  }

  // Main function to kill all project ports
  async killAllPorts() {
    console.log('🔪 Anclora Kairon Port Killer')
    console.log('==============================\n')

    let killedCount = 0
    const errors = []

    for (const [service, port] of Object.entries(this.ports)) {
      console.log(`🔍 Checking port ${port} (${service})...`)

      const pids = this.getPortPIDs(port)

      if (pids.length === 0) {
        console.log(`✅ Port ${port} is already free`)
      } else {
        console.log(`🛑 Found ${pids.length} process(es) on port ${port}: ${pids.join(', ')}`)

        for (const pid of pids) {
          // Get process info before killing
          try {
            const taskInfo = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: 'utf8' })
            console.log(`📋 Process info: ${taskInfo.trim()}`)
          } catch (error) {
            console.log(`📋 Could not get process info for PID ${pid}`)
          }

          // Kill the process
          if (this.killPID(pid)) {
            killedCount++
          } else {
            errors.push(pid)
          }
        }
      }
      console.log('')
    }

    // Summary
    console.log('📊 Summary:')
    console.log(`✅ Successfully killed: ${killedCount} process(es)`)

    if (errors.length > 0) {
      console.log(`❌ Failed to kill: ${errors.length} process(es) - ${errors.join(', ')}`)
    }

    if (killedCount === 0) {
      console.log('ℹ️  All ports were already free')
    } else {
      console.log('\n🎯 All project ports are now available!')
    }

    return errors.length === 0
  }

  // Kill specific port only
  async killPort(port) {
    console.log(`🔪 Killing processes on port ${port}...`)

    const pids = this.getPortPIDs(port)

    if (pids.length === 0) {
      console.log(`✅ Port ${port} is already free`)
      return true
    }

    let successCount = 0
    for (const pid of pids) {
      if (this.killPID(pid)) {
        successCount++
      }
    }

    console.log(`✅ Successfully killed ${successCount}/${pids.length} process(es) on port ${port}`)
    return successCount === pids.length
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const killer = new PortKiller()

  if (args.length === 0) {
    // Kill all project ports
    await killer.killAllPorts()
  } else if (args[0] === '--port' && args[1]) {
    // Kill specific port
    const port = parseInt(args[1])
    if (isNaN(port)) {
      console.error('❌ Invalid port number')
      process.exit(1)
    }
    await killer.killPort(port)
  } else {
    console.log('Usage:')
    console.log('  node src/scripts/kill-ports.js          # Kill all project ports')
    console.log('  node src/scripts/kill-ports.js --port 5174  # Kill specific port')
    process.exit(1)
  }
}

// Run if executed directly
if (process.argv[1] && process.argv[1].includes('kill-ports.js')) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  })
}

export default PortKiller