#!/usr/bin/env node
// Auto Setup Script - Runs automatically on terminal initialization
import DevSetup from './dev-setup.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class AutoSetup {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..')
  }

  // Check if this is a project terminal (has package.json)
  isProjectTerminal() {
    return fs.existsSync(path.join(this.projectRoot, 'package.json'))
  }

  // Main auto-setup function
  async run() {
    if (!this.isProjectTerminal()) {
      console.log('ℹ️  Not in a project directory, skipping auto-setup')
      return
    }

    console.log('🚀 Auto-setup: Anclora Kairon Development Environment')
    console.log('====================================================\n')

    try {
      const devSetup = new DevSetup()
      await devSetup.setup()

      console.log('\n🎯 Environment ready!')
      console.log('💡 Tip: Use "npm run dev:landing" to start the landing page')
      console.log('💡 Tip: Use "npm run dev:app" to start the main application')
      console.log('💡 Tip: Use "npm run dev:clean" for a fresh start')

    } catch (error) {
      console.error('❌ Auto-setup failed:', error.message)
      console.log('\n🔧 Manual setup required:')
      console.log('   npm run setup    # Check environment and ports')
      console.log('   npm run kill-ports # Force kill occupied ports')
    }
  }
}

// Run auto-setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const autoSetup = new AutoSetup()
  autoSetup.run().catch(error => {
    console.error('❌ Auto-setup script failed:', error.message)
    process.exit(1)
  })
}

export default AutoSetup