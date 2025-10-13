#!/usr/bin/env node
// Development Setup Script - Verifies environment and manages ports
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class DevSetup {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..')
    this.ports = {
      landing: 5174,
      app: 5175,
      production: 4174
    }
  }

  // Check if virtual environment is active (Node.js nvm or Python venv)
  checkVirtualEnvironment() {
    console.log('🔍 Checking virtual environment...')

    // Check for Node.js version (nvm)
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim()
      console.log(`✅ Node.js version: ${nodeVersion}`)
    } catch (error) {
      console.error('❌ Node.js not found. Please install Node.js')
      process.exit(1)
    }

    // Check for Python virtual environment
    if (process.env.VIRTUAL_ENV) {
      console.log(`✅ Python virtual environment active: ${process.env.VIRTUAL_ENV}`)
    } else {
      console.log('ℹ️  No Python virtual environment detected')
    }

    // Check if we're in the correct directory
    if (fs.existsSync(path.join(this.projectRoot, 'package.json'))) {
      console.log('✅ Project structure verified')
    } else {
      console.error('❌ Not in project root directory')
      process.exit(1)
    }
  }

  // Check and manage ports
  async checkPorts() {
    console.log('🔍 Checking port availability...')

    const occupiedPorts = []

    for (const [service, port] of Object.entries(this.ports)) {
      try {
        // Check if port is in use (Windows)
        const netstatOutput = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' })

        if (netstatOutput.trim()) {
          console.log(`⚠️  Port ${port} (${service}) is occupied`)

          // Extract PID from netstat output
          const lines = netstatOutput.trim().split('\n')
          for (const line of lines) {
            if (line.includes(`:${port}`)) {
              const parts = line.trim().split(/\s+/)
              const pid = parts[parts.length - 1]

              if (pid && pid !== '0') {
                console.log(`🔍 Found process PID: ${pid} on port ${port}`)

                // Check if it's a development server (likely Node.js)
                try {
                  const taskInfo = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: 'utf8' })
                  if (taskInfo.includes('node.exe') || taskInfo.includes('vite')) {
                    console.log(`🛑 Killing development server (PID: ${pid}) on port ${port}`)
                    execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' })
                    console.log(`✅ Killed process ${pid} on port ${port}`)
                  } else {
                    console.log(`⚠️  Process ${pid} is not a development server, leaving it running`)
                  }
                } catch (error) {
                  console.log(`ℹ️  Could not identify process ${pid}, leaving it running`)
                }
              }
            }
          }

          occupiedPorts.push(port)
        } else {
          console.log(`✅ Port ${port} (${service}) is available`)
        }
      } catch (error) {
        // netstat command failed, port is likely available
        console.log(`✅ Port ${port} (${service}) is available`)
      }
    }

    return occupiedPorts
  }

  // Main setup function
  async setup() {
    console.log('🚀 Anclora Kairon Development Setup')
    console.log('=====================================\n')

    try {
      // Step 1: Check virtual environment
      this.checkVirtualEnvironment()
      console.log('')

      // Step 2: Check and manage ports
      const occupiedPorts = await this.checkPorts()
      console.log('')

      // Step 3: Summary
      if (occupiedPorts.length === 0) {
        console.log('✅ All ports are available')
      } else {
        console.log(`⚠️  Cleaned up ${occupiedPorts.length} occupied port(s)`)
      }

      console.log('\n🎯 Ready for development!')
      console.log(`📖 Check PUERTOS.md for port configuration`)
      console.log(`🔗 Landing Page: http://localhost:${this.ports.landing}`)
      console.log(`🔗 Main App: http://localhost:${this.ports.app}`)

    } catch (error) {
      console.error('❌ Setup failed:', error.message)
      process.exit(1)
    }
  }
}

// Run setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new DevSetup()
  setup.setup()
}

export default DevSetup