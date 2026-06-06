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
  incentiveTime?: string;
  incentiveDesc?: string;
  resources?: { id?: string; name: string; url: string; description?: string }[];
  planGoals?: string;
  planOutcomes?: string;
}

export interface WizardStation {
  id: string;
  icon: string;
  name: string;
  description: string;
  generalNotes?: string;
  secretResourcesNotes?: string;
  riddleDetails?: string;
  riddleAnswer?: string;
  riddleHint?: string;
  secretResourcesRiddleDetails?: string;
  secretResourcesRiddleAnswer?: string;
  secretResourcesRiddleHint?: string;
  secretResources?: { id: string; name: string; url: string; description?: string; puzzle?: string; puzzleAnswer?: string; puzzleHint?: string }[];
  targetDate: string;
  tasks: WizardTask[];
}

export interface WizardTask {
  id: string;
  title: string;
  type: 'main' | 'sub' | 'side' | 'practical' | 'project';
  parentId?: string;
  description?: string;
  learningResources?: string;
  youtubeUrl?: string;
  googleDriveUrl?: string;
  youglishKeyword?: string;
  startMessage?: string;
  endMessage?: string;
  activities?: any[];
  riddleDetails?: string;
  riddleAnswer?: string;
  riddleHint?: string;
  hiddenRiddleDetails?: string;
  hiddenRiddleAnswer?: string;
  hiddenRiddleHint?: string;
  taskGoals?: string;
  taskOutcomes?: string;
}

export interface LearningResourceItem {
  id: string;
  name: string;
  url: string;
  description?: string;
}

export function parseLearningResources(raw?: string): LearningResourceItem[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          id: item.id || Math.random().toString(36).substring(7),
          name: item.name || '',
          url: item.url || '',
          description: item.description || ''
        }));
      }
    } catch (e) {
      // fallback
    }
  }
  
  // Backward compatibility with raw URL strings
  const items: LearningResourceItem[] = [];
  const list = trimmed.split(/[\s,،\n]+/).filter(Boolean);
  for (const item of list) {
    const isUrl = item.startsWith('http://') || item.startsWith('https://');
    items.push({
      id: Math.random().toString(36).substring(7),
      name: isUrl ? '' : item,
      url: isUrl ? item : '',
      description: ''
    });
  }
  return items;
}

export function serializeLearningResources(items: LearningResourceItem[]): string {
  return JSON.stringify(items.map(({ name, url, description }) => ({ name: name.trim(), url: url.trim(), description: (description || '').trim() })));
}
