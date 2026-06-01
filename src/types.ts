export interface WizardState {
  learningGoal: string;
  psychology: {
    reason: string;
    motivation: string;
    target: string;
    anxieties: string;
  };
  stations: WizardStation[];
  dailyDuration?: number;
  learningDays?: number[];
  theme?: 'cards' | 'calendar';
  role?: 'free' | 'premium' | 'admin';
}

export interface WizardStation {
  id: string;
  icon: string;
  name: string;
  description: string;
  targetDate: string;
  tasks: WizardTask[];
  isPractical?: boolean;
  isPremium?: boolean;
  completionMessage?: string;
}

export interface WizardTask {
  id: string;
  title: string;
  type: 'main' | 'sub' | 'side';
  parentId?: string;
  description?: string;
}
