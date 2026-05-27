/**
 * Centralized layering system for Aura Journey
 * Using high ranges to ensure UI elements always display correctly over standard content
 */

export const LAYERS = {
  // Base UI elements
  BOTTOM_NAV: 1000,
  
  // Sidebars and standard overlays
  SIDEBAR_BASE: 100000,
  GAMIFICATION_SIDEBAR: 110000,
  ROUTINE_POPUP: 120000,
  
  // Modals and critical flow dialogs
  MODAL_BASE: 200000,
  TASK_REVIEW: 300000,
  TASK_REFLECTION: 400000,
  
  // Analytics and logs (Evaluation Log mentioned by user)
  // We want this to be extremely high as it might be opened from other sidebars
  EVALUATION_LOG: 5000000,
  ANALYTICS_DIALOG: 5100000,
  
  // Critical system overlays
  STUMBLE_FORM: 6000000,
  EXIT_CONFIRMATION: 7000000,
  
  // Topmost elements
  TOAST: 2147483647
};
