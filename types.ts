export interface Grant {
  id: string;
  agency_name: string;
  program_title: string;
  funding_type: string;
  brief_description: string;
  eligibility_criteria: string;
  application_deadline: string | null;
  funding_amount: string | null;
  geographic_scope: string;
  official_application_link: string;
  status: 'OPEN' | 'UPCOMING' | 'CLOSED' | 'UNKNOWN';
  confidence_score: number; // Simulated AI confidence
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
}

export interface SearchConfig {
  keywords: string[];
  year: number;
  emailRecipient: string;
  notificationEnabled: boolean;
}