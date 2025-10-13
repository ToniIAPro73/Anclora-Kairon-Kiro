// Email Service for Beta Signup
export default class EmailService {
  constructor() {
    this.endpoint = this.getEmailEndpoint()
    this.apiKey = this.getApiKey()
  }

  getEmailEndpoint() {
    // Check for environment variable or use default
    return process.env.VITE_EMAIL_SERVICE_ENDPOINT || 'https://api.emailservice.com/send'
  }

  getApiKey() {
    // Check for environment variable or use default
    return process.env.VITE_EMAIL_SERVICE_API_KEY || ''
  }

  async sendBetaConfirmationEmail(email, userName = '') {
    try {
      const emailData = {
        to: email,
        subject: '¡Bienvenido a la Beta de Anclora Kairon! 🎉',
        template: 'beta-confirmation',
        variables: {
          userName: userName || email.split('@')[0],
          appName: 'Anclora Kairon',
          betaAccessDate: this.getEstimatedBetaDate(),
          supportEmail: 'beta@anclorakairon.com'
        }
      }

      // For now, simulate API call
      // In production, this would make an actual HTTP request
      if (this.shouldUseRealEmailService()) {
        const response = await this.makeEmailRequest(emailData)
        return this.handleEmailResponse(response)
      } else {
        // Development mode - simulate successful email sending
        return this.simulateEmailSending(email, emailData)
      }
    } catch (error) {
      console.error('Error sending beta confirmation email:', error)
      throw new Error('Failed to send confirmation email')
    }
  }

  shouldUseRealEmailService() {
    // Check if we have valid credentials for real email service
    return this.apiKey && this.endpoint !== 'https://api.emailservice.com/send'
  }

  async makeEmailRequest(emailData) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Service': 'anclora-kairon-beta'
      },
      body: JSON.stringify(emailData)
    })

    if (!response.ok) {
      throw new Error(`Email service error: ${response.status}`)
    }

    return response.json()
  }

  handleEmailResponse(response) {
    if (response.success) {
      console.log('✅ Beta confirmation email sent successfully')
      return {
        success: true,
        messageId: response.messageId,
        timestamp: new Date().toISOString()
      }
    } else {
      throw new Error(response.error || 'Unknown email service error')
    }
  }

  simulateEmailSending(email, emailData) {
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('📧 [SIMULATED] Beta confirmation email sent to:', email)
        console.log('📧 [SIMULATED] Email data:', emailData)

        resolve({
          success: true,
          messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          simulated: true
        })
      }, 1000)
    })
  }

  getEstimatedBetaDate() {
    // Calculate estimated beta launch date (30 days from now)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)

    return futureDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Static method for easy access
  static async sendBetaEmail(email, userName = '') {
    const emailService = new EmailService()
    return await emailService.sendBetaConfirmationEmail(email, userName)
  }
}