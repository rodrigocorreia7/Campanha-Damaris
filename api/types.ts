export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface LawItem {
  id: string;
  number: string;
  title: string;
  year: string;
  category: 'Liberdade Religiosa' | 'Proteção Infantil' | 'Direitos da Mulher' | 'Combate à Violência' | 'Cultura & Voluntariado';
  shortDesc: string;
  fullDesc: string;
  impact: string;
  keyPoints: string[];
}

export interface ProposalItem {
  id: string;
  code: string;
  title: string;
  targetGroup: string;
  summary: string;
  details: string[];
}

export interface VolunteerFormData {
  fullName: string;
  whatsapp: string;
  email: string;
  neighborhood: string;
  city: string;
  interests: string[];
  agreeTerms: boolean;
}
