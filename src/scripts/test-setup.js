#!/usr/bin/env node
// Test Setup Script - Simple verification that everything works
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🧪 Anclora Kairon Setup Test')
console.log('============================\n')

const tests = []
const errors = []

// Test 1: Check if we're in the right directory
console.log('1️⃣  Testing project directory...')
try {
  if (fs.existsSync('package.json') && fs.existsSync('PUERTOS.md')) {
    console.log('   ✅ Project files found')
    tests.push('✅ Project directory')
  } else {
    console.log('   ❌ Project files missing')
    errors.push('Project files not found')
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`)
  errors.push('Directory test failed')
}

// Test 2: Check Node.js
console.log('\n2️⃣  Testing Node.js...')
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim()
  console.log(`   ✅ Node.js: ${nodeVersion}`)
  tests.push('✅ Node.js available')
} catch (error) {
  console.log('   ❌ Node.js not found')
  errors.push('Node.js not installed')
}

// Test 3: Check NPM
console.log('\n3️⃣  Testing NPM...')
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
  console.log(`   ✅ NPM: ${npmVersion}`)
  tests.push('✅ NPM available')
} catch (error) {
  console.log('   ❌ NPM not found')
  errors.push('NPM not available')
}

// Test 4: Check ports
console.log('\n4️⃣  Testing port availability...')
try {
  const portTest = execSync('netstat -ano | findstr :5174', { encoding: 'utf8' })
  if (portTest.trim()) {
    console.log('   ⚠️  Port 5174 is occupied')
    console.log('   💡 Run: npm run kill-ports')
  } else {
    console.log('   ✅ Port 5174 is available')
    tests.push('✅ Port 5174 free')
  }
} catch (error) {
  console.log('   ✅ Port 5174 is available')
  tests.push('✅ Port 5174 free')
}

// Test 5: Check scripts exist
console.log('\n5️⃣  Testing script files...')
const scripts = ['dev-setup.js', 'kill-ports.js', 'auto-setup.js']
scripts.forEach(script => {
  const scriptPath = path.join(__dirname, script)
  if (fs.existsSync(scriptPath)) {
    console.log(`   ✅ ${script}`)
    tests.push(`✅ Script: ${script}`)
  } else {
    console.log(`   ❌ ${script} missing`)
    errors.push(`Script missing: ${script}`)
  }
})

// Summary
console.log('\n📊 Test Summary:')
console.log(`✅ Passed: ${tests.length}`)
console.log(`❌ Failed: ${errors.length}`)

tests.forEach(test => console.log(`   ${test}`))
errors.forEach(error => console.log(`   ❌ ${error}`))

console.log('\n🎯 Next Steps:')
if (errors.length === 0) {
  console.log('✅ Everything looks good!')
  console.log('🚀 Run: npm run dev:landing')
} else {
  console.log('❌ Please fix the errors above')
  console.log('🔧 Common solutions:')
  console.log('   - Install Node.js from nodejs.org')
  console.log('   - Run: npm install')
  console.log('   - Run: npm run kill-ports')
}

console.log('\n📖 For more info, see:')
console.log('   - PUERTOS.md')
console.log('   - src/scripts/README.md')
console.log('   - src/scripts/VERIFICACION-AUTOMATIZACION.md')