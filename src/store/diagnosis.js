import { defineStore } from 'pinia';
import { DIAGNOSIS_QUESTIONS, calculateBusinessStage } from '../data/diagnosisQuestions';
import { BUSINESS_STAGES, getStageById } from '../data/businessStages';

export const useDiagnosisStore = defineStore('diagnosis', {
  state: () => ({
    // Current diagnosis session
    currentAnswers: {},
    currentStep: 0,
    isCompleted: false,
    
    // Results
    currentStage: null,
    stageScores: {},
    confidence: 0,
    
    // History
    diagnosisHistory: [],
    
    // UI state
    loading: false,
    error: null,
  }),
  
  getters: {
    // Get current question
    currentQuestion: (state) => {
      return DIAGNOSIS_QUESTIONS[state.currentStep] || null;
    },
    
    // Get total questions
    totalQuestions: () => {
      return DIAGNOSIS_QUESTIONS.length;
    },
    
    // Get progress percentage
    progress: (state) => {
      return Math.round((state.currentStep / DIAGNOSIS_QUESTIONS.length) * 100);
    },
    
    // Check if current step has answer
    hasCurrentAnswer: (state) => {
      const question = DIAGNOSIS_QUESTIONS[state.currentStep];
      return question ? !!state.currentAnswers[question.id] : false;
    },
    
    // Check if can go to next step
    canProceed: (state) => {
      const question = DIAGNOSIS_QUESTIONS[state.currentStep];
      if (!question) return false;
      
      const hasAnswer = !!state.currentAnswers[question.id];
      return hasAnswer;
    },
    
    // Get current stage details
    currentStageDetails: (state) => {
      return state.currentStage ? getStageById(state.currentStage) : null;
    },
    
    // Get all available stages
    allStages: () => {
      return Object.values(BUSINESS_STAGES);
    },
    
    // Check if diagnosis is in progress
    isInProgress: (state) => {
      return state.currentStep > 0 && !state.isCompleted;
    },
    
    // Get completion status
    completionStatus: (state) => {
      if (state.isCompleted) return 'completed';
      if (state.currentStep > 0) return 'in_progress';
      return 'not_started';
    }
  },
  
  actions: {
    // Start new diagnosis
    startDiagnosis() {
      this.currentAnswers = {};
      this.currentStep = 0;
      this.isCompleted = false;
      this.currentStage = null;
      this.stageScores = {};
      this.confidence = 0;
      this.error = null;
      
      console.log('🎯 Starting new business diagnosis');
    },
    
    // Set answer for current question
    setAnswer(questionId, value) {
      this.currentAnswers[questionId] = value;
      console.log(`📝 Answer set for ${questionId}:`, value);
    },
    
    // Go to next question
    nextQuestion() {
      if (this.currentStep < DIAGNOSIS_QUESTIONS.length - 1) {
        this.currentStep++;
        console.log(`➡️ Moving to question ${this.currentStep + 1}/${DIAGNOSIS_QUESTIONS.length}`);
      } else {
        this.completeDiagnosis();
      }
    },
    
    // Go to previous question
    previousQuestion() {
      if (this.currentStep > 0) {
        this.currentStep--;
        console.log(`⬅️ Moving back to question ${this.currentStep + 1}/${DIAGNOSIS_QUESTIONS.length}`);
      }
    },
    
    // Jump to specific question
    goToQuestion(stepIndex) {
      if (stepIndex >= 0 && stepIndex < DIAGNOSIS_QUESTIONS.length) {
        this.currentStep = stepIndex;
        console.log(`🎯 Jumping to question ${stepIndex + 1}/${DIAGNOSIS_QUESTIONS.length}`);
      }
    },
    
    // Complete diagnosis and calculate results
    completeDiagnosis() {
      this.loading = true;
      
      try {
        console.log('🔄 Calculating diagnosis results...');
        
        // Calculate business stage
        const result = calculateBusinessStage(this.currentAnswers);
        
        this.currentStage = result.stage;
        this.stageScores = result.scores;
        this.confidence = Math.round(result.confidence);
        this.isCompleted = true;
        
        // Save to history
        const diagnosisRecord = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          answers: { ...this.currentAnswers },
          result: {
            stage: this.currentStage,
            scores: { ...this.stageScores },
            confidence: this.confidence
          }
        };
        
        this.diagnosisHistory.unshift(diagnosisRecord);
        
        // Keep only last 10 diagnoses
        if (this.diagnosisHistory.length > 10) {
          this.diagnosisHistory = this.diagnosisHistory.slice(0, 10);
        }
        
        console.log('✅ Diagnosis completed:', {
          stage: this.currentStage,
          confidence: this.confidence
        });
        
        // Save to localStorage
        this.saveDiagnosisData();
        
      } catch (error) {
        console.error('❌ Error completing diagnosis:', error);
        this.error = 'Terjadi kesalahan saat memproses hasil diagnosis';
      } finally {
        this.loading = false;
      }
    },
    
    // Reset diagnosis
    resetDiagnosis() {
      this.currentAnswers = {};
      this.currentStep = 0;
      this.isCompleted = false;
      this.currentStage = null;
      this.stageScores = {};
      this.confidence = 0;
      this.error = null;
      
      console.log('🔄 Diagnosis reset');
    },
    
    // Load diagnosis data from localStorage
    loadDiagnosisData() {
      try {
        const saved = localStorage.getItem('sinak_diagnosis');
        if (saved) {
          const data = JSON.parse(saved);
          this.diagnosisHistory = data.history || [];
          
          // Load last completed diagnosis if exists
          if (data.lastDiagnosis && data.lastDiagnosis.isCompleted) {
            this.currentStage = data.lastDiagnosis.stage;
            this.stageScores = data.lastDiagnosis.scores;
            this.confidence = data.lastDiagnosis.confidence;
            this.isCompleted = true;
          }
          
          console.log('📂 Diagnosis data loaded from localStorage');
        }
      } catch (error) {
        console.error('❌ Error loading diagnosis data:', error);
      }
    },
    
    // Save diagnosis data to localStorage
    saveDiagnosisData() {
      try {
        const dataToSave = {
          history: this.diagnosisHistory,
          lastDiagnosis: this.isCompleted ? {
            stage: this.currentStage,
            scores: this.stageScores,
            confidence: this.confidence,
            isCompleted: this.isCompleted,
            date: new Date().toISOString()
          } : null
        };
        
        localStorage.setItem('sinak_diagnosis', JSON.stringify(dataToSave));
        console.log('💾 Diagnosis data saved to localStorage');
      } catch (error) {
        console.error('❌ Error saving diagnosis data:', error);
      }
    },
    
    // Clear all diagnosis data
    clearDiagnosisData() {
      this.diagnosisHistory = [];
      this.resetDiagnosis();
      localStorage.removeItem('sinak_diagnosis');
      console.log('🗑️ All diagnosis data cleared');
    },
    
    // Get diagnosis by ID from history
    getDiagnosisById(id) {
      return this.diagnosisHistory.find(d => d.id === id);
    },
    
    // Set error message
    setError(message) {
      this.error = message;
    },
    
    // Clear error
    clearError() {
      this.error = null;
    }
  }
});
