import i18n from '../utils/i18n.js';

/**
 * Rapid Onboarding Wizard - 60 seconds flow
 * Guides new users through project setup with templates and sample data
 */
export default class OnboardingWizard {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.isOpen = false;
    this.wizardElement = null;
    this.backdropElement = null;
    this.translations = i18n.getTranslations();
    this.userData = {
      name: '',
      role: '',
      projectTemplate: '',
      teamMembers: [],
      skipAdvanced: false
    };
    this.setupLanguageListener();
  }

  /**
   * Open the onboarding wizard
   */
  open() {
    this.isOpen = true;
    this.currentStep = 1;
    this.render();
    this.setupEventListeners();
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close the wizard
   */
  close() {
    this.isOpen = false;
    document.body.style.overflow = 'unset';
    if (this.backdropElement) {
      this.backdropElement.remove();
      this.backdropElement = null;
      this.wizardElement = null;
    }
  }

  /**
   * Move to next step
   */
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.render();
      this.setupEventListeners();
    }
  }

  /**
   * Move to previous step
   */
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.render();
      this.setupEventListeners();
    }
  }

  /**
   * Skip to final step
   */
  skipToEnd() {
    this.userData.skipAdvanced = true;
    this.currentStep = this.totalSteps;
    this.render();
    this.setupEventListeners();
  }

  /**
   * Complete onboarding
   */
  complete() {
    // Generate sample data based on selected template
    this.generateSampleData();
    
    // Save user preferences
    this.saveUserData();
    
    // Close wizard and redirect to dashboard
    this.close();
    window.location.href = '/app/dashboard';
  }

  /**
   * Render the wizard
   */
  render() {
    // Remove existing wizard if any
    if (this.backdropElement) {
      this.backdropElement.remove();
    }

    // Create backdrop
    this.backdropElement = document.createElement('div');
    this.backdropElement.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4';

    // Create wizard content
    this.wizardElement = document.createElement('div');
    this.wizardElement.className = 'relative w-full max-w-2xl bg-[#162032] rounded-2xl shadow-2xl overflow-hidden border border-[#2EAFC4]/30 max-h-[90vh] overflow-y-auto';

    this.wizardElement.innerHTML = this.renderWizardContent();

    this.backdropElement.appendChild(this.wizardElement);
    document.body.appendChild(this.backdropElement);
  }

  /**
   * Render wizard content based on current step
   */
  renderWizardContent() {
    const progressPercentage = (this.currentStep / this.totalSteps) * 100;

    return `
      <!-- Progress Header -->
      <div class="bg-[#202837] p-6 border-b border-[#2EAFC4]/30">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-2xl font-bold text-[#F6F7F9]">
            ${this.translations.onboardingWelcome || 'Bienvenido a Anclora Kairon'}
          </h1>
          <button id="skip-onboarding" class="text-[#2EAFC4] hover:text-[#FFC979] text-sm font-medium transition-colors">
            ${this.translations.onboardingSkip || 'Saltar configuración'}
          </button>
        </div>
        
        <!-- Progress Bar -->
        <div class="w-full bg-[#162032] rounded-full h-2">
          <div class="bg-gradient-to-r from-[#2EAFC4] to-[#FFC979] h-2 rounded-full transition-all duration-500" style="width: ${progressPercentage}%"></div>
        </div>
        <p class="text-[#F6F7F9]/70 text-sm mt-2">
          ${this.translations.onboardingStep || 'Paso'} ${this.currentStep} ${this.translations.onboardingOf || 'de'} ${this.totalSteps}
        </p>
      </div>

      <!-- Step Content -->
      <div class="p-8">
        ${this.renderStepContent()}
      </div>

      <!-- Navigation Footer -->
      <div class="bg-[#202837] p-6 border-t border-[#2EAFC4]/30 flex justify-between">
        <button 
          id="prev-step" 
          class="px-6 py-3 border border-[#2EAFC4]/30 text-[#F6F7F9] rounded-lg hover:bg-[#2EAFC4]/10 transition-colors ${this.currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
          ${this.currentStep === 1 ? 'disabled' : ''}
        >
          ${this.translations.onboardingPrevious || 'Anterior'}
        </button>
        
        <button 
          id="next-step" 
          class="px-6 py-3 bg-gradient-to-r from-[#2EAFC4] to-[#FFC979] text-[#162032] font-bold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
        >
          ${this.currentStep === this.totalSteps ? 
            (this.translations.onboardingComplete || 'Completar') : 
            (this.translations.onboardingNext || 'Siguiente')
          }
        </button>
      </div>
    `;
  }

  /**
   * Render content for current step
   */
  renderStepContent() {
    switch (this.currentStep) {
      case 1:
        return this.renderWelcomeStep();
      case 2:
        return this.renderTemplateStep();
      case 3:
        return this.renderTeamStep();
      case 4:
        return this.renderCompleteStep();
      default:
        return this.renderWelcomeStep();
    }
  }

  /**
   * Step 1: Welcome and basic info
   */
  renderWelcomeStep() {
    return `
      <div class="text-center mb-8">
        <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-[#2EAFC4] to-[#FFC979] rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-[#162032]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 class="text-3xl font-bold text-[#F6F7F9] mb-4">
          ${this.translations.onboardingWelcomeTitle || '¡Empecemos tu viaje!'}
        </h2>
        <p class="text-[#F6F7F9]/80 text-lg max-w-md mx-auto">
          ${this.translations.onboardingWelcomeDesc || 'Te ayudaremos a configurar tu espacio de trabajo en menos de 60 segundos.'}
        </p>
      </div>

      <div class="max-w-md mx-auto space-y-6">
        <div>
          <label class="block text-sm font-semibold text-[#F6F7F9] mb-2">
            ${this.translations.onboardingYourName || '¿Cómo te llamas?'}
          </label>
          <input
            type="text"
            id="user-name"
            class="w-full px-4 py-3 text-sm border-2 border-[#2EAFC4]/30 rounded-lg focus:ring-2 focus:ring-[#2EAFC4] focus:border-[#2EAFC4] transition-all duration-200 bg-[#202837] placeholder-[#F6F7F9]/50 text-[#F6F7F9]"
            placeholder="${this.translations.onboardingNamePlaceholder || 'Tu nombre'}"
            value="${this.userData.name}"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-[#F6F7F9] mb-2">
            ${this.translations.onboardingYourRole || '¿Cuál es tu rol?'}
          </label>
          <select
            id="user-role"
            class="w-full px-4 py-3 text-sm border-2 border-[#2EAFC4]/30 rounded-lg focus:ring-2 focus:ring-[#2EAFC4] focus:border-[#2EAFC4] transition-all duration-200 bg-[#202837] text-[#F6F7F9]"
          >
            <option value="">${this.translations.onboardingSelectRole || 'Selecciona tu rol'}</option>
            <option value="developer">${this.translations.onboardingDeveloper || 'Desarrollador'}</option>
            <option value="designer">${this.translations.onboardingDesigner || 'Diseñador'}</option>
            <option value="manager">${this.translations.onboardingManager || 'Project Manager'}</option>
            <option value="marketing">${this.translations.onboardingMarketing || 'Marketing'}</option>
            <option value="founder">${this.translations.onboardingFounder || 'Fundador/CEO'}</option>
            <option value="other">${this.translations.onboardingOther || 'Otro'}</option>
          </select>
        </div>
      </div>
    `;
  }

  /**
   * Step 2: Project template selection
   */
  renderTemplateStep() {
    const templates = [
      {
        id: 'software',
        name: this.translations.templateSoftware || 'Desarrollo de Software',
        description: this.translations.templateSoftwareDesc || 'Sprints, bugs, features y releases',
        icon: '💻',
        color: 'from-blue-500 to-purple-600'
      },
      {
        id: 'marketing',
        name: this.translations.templateMarketing || 'Marketing',
        description: this.translations.templateMarketingDesc || 'Campañas, contenido y análisis',
        icon: '📈',
        color: 'from-green-500 to-teal-600'
      },
      {
        id: 'design',
        name: this.translations.templateDesign || 'Diseño',
        description: this.translations.templateDesignDesc || 'UI/UX, branding y assets creativos',
        icon: '🎨',
        color: 'from-pink-500 to-rose-600'
      },
      {
        id: 'general',
        name: this.translations.templateGeneral || 'Proyecto General',
        description: this.translations.templateGeneralDesc || 'Tareas, objetivos y seguimiento',
        icon: '📋',
        color: 'from-gray-500 to-gray-600'
      }
    ];

    return `
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-[#F6F7F9] mb-4">
          ${this.translations.onboardingTemplateTitle || 'Elige tu template de proyecto'}
        </h2>
        <p class="text-[#F6F7F9]/80">
          ${this.translations.onboardingTemplateDesc || 'Selecciona el tipo de proyecto que mejor se adapte a tu trabajo'}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${templates.map(template => `
          <div class="template-card p-6 border-2 border-[#2EAFC4]/30 rounded-xl hover:border-[#2EAFC4] transition-all duration-200 cursor-pointer ${this.userData.projectTemplate === template.id ? 'border-[#2EAFC4] bg-[#2EAFC4]/10' : 'hover:bg-[#202837]/50'}" data-template="${template.id}">
            <div class="text-4xl mb-4">${template.icon}</div>
            <h3 class="text-lg font-bold text-[#F6F7F9] mb-2">${template.name}</h3>
            <p class="text-[#F6F7F9]/70 text-sm">${template.description}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Step 3: Team invitation (optional)
   */
  renderTeamStep() {
    return `
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-[#F6F7F9] mb-4">
          ${this.translations.onboardingTeamTitle || 'Invita a tu equipo'}
        </h2>
        <p class="text-[#F6F7F9]/80">
          ${this.translations.onboardingTeamDesc || 'Puedes invitar colaboradores ahora o hacerlo más tarde'}
        </p>
      </div>

      <div class="max-w-md mx-auto space-y-4">
        <div id="team-members-list">
          ${this.userData.teamMembers.map((member, index) => `
            <div class="flex items-center gap-3 p-3 bg-[#202837] rounded-lg">
              <input
                type="email"
                class="flex-1 px-3 py-2 text-sm border border-[#2EAFC4]/30 rounded bg-[#162032] text-[#F6F7F9] placeholder-[#F6F7F9]/50"
                placeholder="${this.translations.onboardingEmailPlaceholder || 'email@ejemplo.com'}"
                value="${member}"
              />
              <button class="remove-member text-red-400 hover:text-red-300 p-1" data-index="${index}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          `).join('')}
        </div>

        <button id="add-member" class="w-full p-3 border-2 border-dashed border-[#2EAFC4]/50 rounded-lg text-[#2EAFC4] hover:border-[#2EAFC4] hover:bg-[#2EAFC4]/5 transition-colors">
          <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          ${this.translations.onboardingAddMember || 'Agregar miembro del equipo'}
        </button>

        <div class="text-center pt-4">
          <button id="skip-team" class="text-[#F6F7F9]/70 hover:text-[#F6F7F9] text-sm transition-colors">
            ${this.translations.onboardingSkipTeam || 'Saltar por ahora, lo haré después'}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Step 4: Completion and summary
   */
  renderCompleteStep() {
    return `
      <div class="text-center">
        <div class="w-20 h-20 mx-auto mb-6 bg-green-900/20 rounded-full flex items-center justify-center border-4 border-green-400/30">
          <svg class="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 class="text-3xl font-bold text-[#F6F7F9] mb-4">
          ${this.translations.onboardingCompleteTitle || '¡Todo listo!'}
        </h2>
        
        <p class="text-[#F6F7F9]/80 text-lg mb-8 max-w-md mx-auto">
          ${this.translations.onboardingCompleteDesc || 'Hemos preparado tu espacio de trabajo con datos de ejemplo para que puedas empezar inmediatamente.'}
        </p>

        <div class="bg-[#202837] rounded-xl p-6 mb-8 max-w-md mx-auto">
          <h3 class="text-lg font-bold text-[#F6F7F9] mb-4">
            ${this.translations.onboardingSetupSummary || 'Resumen de configuración:'}
          </h3>
          <div class="space-y-3 text-left">
            <div class="flex justify-between">
              <span class="text-[#F6F7F9]/70">${this.translations.onboardingName || 'Nombre'}:</span>
              <span class="text-[#F6F7F9]">${this.userData.name || 'Usuario'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#F6F7F9]/70">${this.translations.onboardingRole || 'Rol'}:</span>
              <span class="text-[#F6F7F9]">${this.userData.role || 'No especificado'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#F6F7F9]/70">${this.translations.onboardingTemplate || 'Template'}:</span>
              <span class="text-[#F6F7F9]">${this.getTemplateName(this.userData.projectTemplate)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#F6F7F9]/70">${this.translations.onboardingTeamSize || 'Equipo'}:</span>
              <span class="text-[#F6F7F9]">${this.userData.teamMembers.length + 1} ${this.translations.onboardingMembers || 'miembros'}</span>
            </div>
          </div>
        </div>

        <div class="text-[#F6F7F9]/60 text-sm">
          ${this.translations.onboardingReadyMessage || 'Tu proyecto está listo con tareas de ejemplo y estructura inicial.'}
        </div>
      </div>
    `;
  }

  /**
   * Get template name by ID
   */
  getTemplateName(templateId) {
    const templates = {
      software: this.translations.templateSoftware || 'Desarrollo de Software',
      marketing: this.translations.templateMarketing || 'Marketing',
      design: this.translations.templateDesign || 'Diseño',
      general: this.translations.templateGeneral || 'Proyecto General'
    };
    return templates[templateId] || this.translations.templateGeneral || 'Proyecto General';
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Navigation buttons
    const nextBtn = document.getElementById('next-step');
    const prevBtn = document.getElementById('prev-step');
    const skipBtn = document.getElementById('skip-onboarding');

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentStep === this.totalSteps) {
          this.complete();
        } else {
          this.collectStepData();
          this.nextStep();
        }
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevStep());
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skipToEnd());
    }

    // Step-specific event listeners
    this.setupStepEventListeners();

    // Close on backdrop click
    this.backdropElement.addEventListener('click', (e) => {
      if (e.target === this.backdropElement) {
        // Don't close onboarding on backdrop click - user should complete it
      }
    });
  }

  /**
   * Setup event listeners for current step
   */
  setupStepEventListeners() {
    switch (this.currentStep) {
      case 1:
        this.setupWelcomeStepListeners();
        break;
      case 2:
        this.setupTemplateStepListeners();
        break;
      case 3:
        this.setupTeamStepListeners();
        break;
    }
  }

  /**
   * Setup listeners for welcome step
   */
  setupWelcomeStepListeners() {
    const nameInput = document.getElementById('user-name');
    const roleSelect = document.getElementById('user-role');

    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        this.userData.name = e.target.value;
      });
    }

    if (roleSelect) {
      roleSelect.addEventListener('change', (e) => {
        this.userData.role = e.target.value;
      });
      roleSelect.value = this.userData.role;
    }
  }

  /**
   * Setup listeners for template step
   */
  setupTemplateStepListeners() {
    const templateCards = document.querySelectorAll('.template-card');
    
    templateCards.forEach(card => {
      card.addEventListener('click', () => {
        // Remove selection from all cards
        templateCards.forEach(c => {
          c.classList.remove('border-[#2EAFC4]', 'bg-[#2EAFC4]/10');
          c.classList.add('border-[#2EAFC4]/30');
        });
        
        // Add selection to clicked card
        card.classList.remove('border-[#2EAFC4]/30');
        card.classList.add('border-[#2EAFC4]', 'bg-[#2EAFC4]/10');
        
        this.userData.projectTemplate = card.dataset.template;
      });
    });
  }

  /**
   * Setup listeners for team step
   */
  setupTeamStepListeners() {
    const addMemberBtn = document.getElementById('add-member');
    const skipTeamBtn = document.getElementById('skip-team');

    if (addMemberBtn) {
      addMemberBtn.addEventListener('click', () => {
        this.userData.teamMembers.push('');
        this.render();
        this.setupEventListeners();
      });
    }

    if (skipTeamBtn) {
      skipTeamBtn.addEventListener('click', () => {
        this.nextStep();
      });
    }

    // Remove member buttons
    const removeButtons = document.querySelectorAll('.remove-member');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this.userData.teamMembers.splice(index, 1);
        this.render();
        this.setupEventListeners();
      });
    });

    // Email inputs
    const emailInputs = document.querySelectorAll('#team-members-list input[type="email"]');
    emailInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        this.userData.teamMembers[index] = e.target.value;
      });
    });
  }

  /**
   * Collect data from current step
   */
  collectStepData() {
    switch (this.currentStep) {
      case 1:
        const nameInput = document.getElementById('user-name');
        const roleSelect = document.getElementById('user-role');
        if (nameInput) this.userData.name = nameInput.value;
        if (roleSelect) this.userData.role = roleSelect.value;
        break;
    }
  }

  /**
   * Generate sample data based on selected template
   */
  generateSampleData() {
    const templates = {
      software: {
        project: 'Mi Aplicación Web',
        tasks: [
          { title: 'Configurar entorno de desarrollo', status: 'done', priority: 'high' },
          { title: 'Diseñar base de datos', status: 'in-progress', priority: 'high' },
          { title: 'Implementar autenticación', status: 'todo', priority: 'medium' },
          { title: 'Crear API REST', status: 'todo', priority: 'medium' },
          { title: 'Desarrollar frontend', status: 'todo', priority: 'low' }
        ]
      },
      marketing: {
        project: 'Campaña de Lanzamiento',
        tasks: [
          { title: 'Investigación de mercado', status: 'done', priority: 'high' },
          { title: 'Crear buyer personas', status: 'in-progress', priority: 'high' },
          { title: 'Diseñar landing page', status: 'todo', priority: 'medium' },
          { title: 'Configurar Google Ads', status: 'todo', priority: 'medium' },
          { title: 'Analizar métricas', status: 'todo', priority: 'low' }
        ]
      },
      design: {
        project: 'Rediseño de Marca',
        tasks: [
          { title: 'Investigación de usuarios', status: 'done', priority: 'high' },
          { title: 'Crear wireframes', status: 'in-progress', priority: 'high' },
          { title: 'Diseñar sistema de colores', status: 'todo', priority: 'medium' },
          { title: 'Crear componentes UI', status: 'todo', priority: 'medium' },
          { title: 'Prototipo interactivo', status: 'todo', priority: 'low' }
        ]
      },
      general: {
        project: 'Mi Primer Proyecto',
        tasks: [
          { title: 'Definir objetivos', status: 'done', priority: 'high' },
          { title: 'Planificar tareas', status: 'in-progress', priority: 'high' },
          { title: 'Asignar responsabilidades', status: 'todo', priority: 'medium' },
          { title: 'Ejecutar plan', status: 'todo', priority: 'medium' },
          { title: 'Revisar resultados', status: 'todo', priority: 'low' }
        ]
      }
    };

    const selectedTemplate = templates[this.userData.projectTemplate] || templates.general;
    
    // Store sample data in localStorage for the app to use
    localStorage.setItem('onboarding_sample_data', JSON.stringify({
      project: selectedTemplate.project,
      tasks: selectedTemplate.tasks,
      user: this.userData
    }));
  }

  /**
   * Save user data
   */
  saveUserData() {
    localStorage.setItem('user_onboarding_data', JSON.stringify(this.userData));
    localStorage.setItem('onboarding_completed', 'true');
  }

  /**
   * Setup language change listener
   */
  setupLanguageListener() {
    window.addEventListener('languageChanged', (e) => {
      this.translations = e.detail.translations || i18n.getTranslations(e.detail.language);
      if (this.isOpen) {
        this.render();
        this.setupEventListeners();
      }
    });
  }
}

// Create singleton instance
export const onboardingWizard = new OnboardingWizard();