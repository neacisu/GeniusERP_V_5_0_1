/**
 * useInboxAI Hook
 * 
 * Acest hook este utilizat pentru a interacționa cu API-ul Inbox AI.
 * Oferă funcționalități pentru analiza sentimentelor, categorisirea
 * emailurilor, generarea de răspunsuri și prioritizarea conversațiilor.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Interfețe pentru datele Inbox AI
export interface EmailMessage {
  id: string;
  subject: string;
  sender: string;
  recipients: string[];
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  category: 'inquiry' | 'complaint' | 'feedback' | 'request' | 'other';
  priority: 'high' | 'medium' | 'low';
  receivedAt: string;
  isRead: boolean;
  hasAttachments: boolean;
  aiProcessed: boolean;
  suggestedResponse?: string;
}

export interface EmailAnalysisResponse {
  success: boolean;
  data?: {
    messages: EmailMessage[];
    totalCount: number;
    unreadCount: number;
    priorityCount: {
      high: number;
      medium: number;
      low: number;
    }
  };
  message?: string;
}

export interface SuggestionResponse {
  success: boolean;
  data?: {
    messageId: string;
    suggestedResponse: string;
    suggestedActions: string[];
    relatedDocuments?: string[];
    tokenCount: number;
  };
  message?: string;
}

export interface SentimentAnalysisResponse {
  success: boolean;
  data?: {
    messageId: string;
    sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
    sentimentScore: number;
    keyPhrases: string[];
    entities: Array<{
      text: string;
      type: string;
      confidence: number;
    }>;
  };
  message?: string;
}

export interface EmailCategoryResponse {
  success: boolean;
  data?: {
    messageId: string;
    category: 'inquiry' | 'complaint' | 'feedback' | 'request' | 'other';
    confidence: number;
    suggestedTags: string[];
  };
  message?: string;
}

// Hook pentru obținerea emailurilor analizate
export const useEmailAnalysis = (filters?: { priority?: string; category?: string; sentiment?: string }) => {
  return useQuery<EmailAnalysisResponse>({
    queryKey: ['/api/ai/inbox/messages', filters],
    staleTime: 2 * 60 * 1000, // 2 minute
    placeholderData: {
      success: true,
      data: {
        messages: [
          {
            id: '1',
            subject: 'Solicitare ofertă servicii contabilitate',
            sender: 'office@firma-client.ro',
            recipients: ['contact@companiadta.ro'],
            content: 'Bună ziua, Suntem interesați de serviciile dumneavoastră de contabilitate pentru firma noastră cu 15 angajați. Puteți să ne trimiteți o ofertă detaliată? Mulțumesc anticipat. Cu stimă, Alexandru Popescu',
            sentiment: 'positive',
            category: 'inquiry',
            priority: 'high',
            receivedAt: '2025-04-10T09:30:00Z',
            isRead: false,
            hasAttachments: false,
            aiProcessed: true,
            suggestedResponse: 'Bună ziua domnule Popescu, Vă mulțumim pentru interesul arătat serviciilor noastre. Vom pregăti o ofertă personalizată pentru firma dumneavoastră în cel mai scurt timp. Pentru a vă oferi cele mai potrivite servicii, aș dori să vă întreb ce domeniu de activitate are firma și dacă aveți cerințe specifice? Cu stimă, [Numele tău]'
          },
          {
            id: '2',
            subject: 'Eroare în factura nr. FF2025-1234',
            sender: 'contabilitate@partener.ro',
            recipients: ['facturare@companiadta.ro'],
            content: 'Bună ziua, Am identificat o eroare în factura FF2025-1234 emisă de dumneavoastră în data de 5 aprilie. Cantitatea livrată a fost de 8 bucăți, nu 10 cum apare în factură. Vă rugăm să emiteți o factură corectată cât mai curând posibil. Mulțumesc, Departament Contabilitate',
            sentiment: 'negative',
            category: 'complaint',
            priority: 'high',
            receivedAt: '2025-04-09T14:15:00Z',
            isRead: true,
            hasAttachments: false,
            aiProcessed: true,
            suggestedResponse: 'Bună ziua, Vă mulțumim pentru semnalarea erorii. Vom verifica imediat situația și vom emite o factură corectată în cursul zilei. Ne cerem scuze pentru inconvenientul creat. Vă vom confirma prin email când noua factură va fi disponibilă. Cu stimă, Departamentul Facturare'
          },
          {
            id: '3',
            subject: 'Mulțumiri pentru serviciile oferite',
            sender: 'maria.ionescu@client-fericit.ro',
            recipients: ['support@companiadta.ro'],
            content: 'Bună ziua, Doresc să vă mulțumesc pentru profesionalismul și promptitudinea cu care ne-ați oferit serviciile de consultanță. Echipa dumneavoastră a fost extraordinară și am reușit să implementăm toate recomandările cu succes. Vom continua colaborarea cu siguranță și în viitor. Cu apreciere, Maria Ionescu',
            sentiment: 'positive',
            category: 'feedback',
            priority: 'medium',
            receivedAt: '2025-04-08T11:20:00Z',
            isRead: true,
            hasAttachments: false,
            aiProcessed: true
          },
          {
            id: '4',
            subject: 'Programare întâlnire săptămâna viitoare',
            sender: 'vasile.georgescu@potential-client.ro',
            recipients: ['sales@companiadta.ro'],
            content: 'Bună ziua, În urma discuției telefonice de ieri, aș dori să stabilim o întâlnire săptămâna viitoare pentru a discuta în detaliu despre posibila colaborare. Sunt disponibil marți sau joi între orele 10-14. Vă rog să îmi confirmați când v-ar conveni. Mulțumesc, Vasile Georgescu',
            sentiment: 'neutral',
            category: 'request',
            priority: 'medium',
            receivedAt: '2025-04-07T15:45:00Z',
            isRead: false,
            hasAttachments: false,
            aiProcessed: true,
            suggestedResponse: 'Bună ziua domnule Georgescu, Vă mulțumim pentru mesaj. Putem programa întâlnirea pentru joi, 17 aprilie, la ora 11:00, la sediul nostru. Vă rog să îmi confirmați dacă această dată vă convine. Așteptăm cu interes discuția despre potențiala noastră colaborare. Cu stimă, [Numele tău]'
          },
          {
            id: '5',
            subject: 'URGENT: Probleme cu accesarea platformei',
            sender: 'adrian.neagu@client-major.ro',
            recipients: ['support@companiadta.ro', 'it@companiadta.ro'],
            content: 'Bună ziua, Nu putem accesa platforma de raportare de peste 2 ore, iar avem o scadență importantă astăzi! Vă rugăm să rezolvați problema de urgență și să ne contactați telefonic la 0722.123.456. Este extrem de urgent! Adrian Neagu, Director Financiar',
            sentiment: 'urgent',
            category: 'complaint',
            priority: 'high',
            receivedAt: '2025-04-10T08:15:00Z',
            isRead: false,
            hasAttachments: false,
            aiProcessed: true
          }
        ],
        totalCount: 5,
        unreadCount: 3,
        priorityCount: {
          high: 3,
          medium: 2,
          low: 0
        }
      }
    }
  });
};

// Hook pentru obținerea sugestiilor de răspuns
export const useResponseSuggestion = (messageId: string) => {
  return useQuery<SuggestionResponse>({
    queryKey: ['/api/ai/inbox/suggest-response', messageId],
    enabled: Boolean(messageId),
    staleTime: 10 * 60 * 1000, // 10 minute
  });
};

// Hook pentru generarea unei analize de sentiment pentru un email
export const useSentimentAnalysis = () => {
  return useMutation({
    mutationFn: async (content: { messageId: string; text: string }) => {
      return apiRequest('/api/ai/inbox/analyze-sentiment', {
        method: 'POST',
        body: JSON.stringify(content)
      });
    }
  });
};

// Hook pentru categorizarea unui email
export const useEmailCategorization = () => {
  return useMutation({
    mutationFn: async (content: { messageId: string; text: string; subject: string }) => {
      return apiRequest('/api/ai/inbox/categorize', {
        method: 'POST',
        body: JSON.stringify(content)
      });
    }
  });
};