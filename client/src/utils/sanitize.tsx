/**
 * HTML Sanitization Utilities
 * 
 * Protecție împotriva atacurilor XSS (Cross-Site Scripting) folosind DOMPurify.
 * Conform OWASP XSS Prevention Cheat Sheet.
 * 
 * IMPORTANT: Acest modul trebuie folosit ÎNTOTDEAUNA când se randează HTML dinamic
 * provenit de la utilizatori sau surse externe.
 */

import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Configurări DOMPurify predefinite pentru diferite contexte
 */

// Type pentru config DOMPurify
type DOMPurifyConfig = {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  KEEP_CONTENT?: boolean;
  RETURN_DOM?: boolean;
  RETURN_DOM_FRAGMENT?: boolean;
  ALLOWED_URI_REGEXP?: RegExp;
  ADD_ATTR?: string[];
  FORBID_TAGS?: string[];
  FORBID_ATTR?: string[];
  ALLOW_DATA_ATTR?: boolean;
};

// Configurare strictă - doar text formatat simplu
const STRICT_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false
};

// Configurare moderată - permite liste și heading-uri
const MODERATE_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false
};

// Configurare pentru rich content - permite link-uri și imagini
const RICH_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'b', 'i', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 
    'a', 'img', 'span', 'div',
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|xxx):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  // Forțează target="_blank" și rel="noopener noreferrer" pentru link-uri externe
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
};

// Configurare pentru email campaigns - cel mai permisiv dar tot sigur
const EMAIL_CAMPAIGN_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'strike', 's', 'del',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'a', 'img', 'span', 'div', 'section', 'article', 'header', 'footer',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
    'hr', 'center', 'font'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style', 'id',
    'width', 'height', 'align', 'valign', 'border', 'cellpadding', 'cellspacing',
    'bgcolor', 'color', 'size', 'face'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onmousemove', 'onfocus', 'onblur']
};

/**
 * Sanitizează HTML cu configurare strictă
 * Folosește această funcție pentru conținut general de la utilizatori.
 * 
 * @param dirty - HTML-ul nesanitizat
 * @returns HTML sanitizat (doar text formatat simplu)
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  return String(DOMPurify.sanitize(dirty, STRICT_CONFIG));
}

/**
 * Sanitizează HTML cu configurare moderată
 * Permite heading-uri și liste pentru documentație și comentarii.
 * 
 * @param dirty - HTML-ul nesanitizat
 * @returns HTML sanitizat (cu heading-uri și liste)
 */
export function sanitizeHtmlModerate(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  return String(DOMPurify.sanitize(dirty, MODERATE_CONFIG));
}

/**
 * Sanitizează HTML cu configurare rich
 * Permite link-uri, imagini și tabele pentru conținut complex.
 * 
 * @param dirty - HTML-ul nesanitizat
 * @returns HTML sanitizat (cu link-uri, imagini, tabele)
 */
export function sanitizeHtmlRich(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  
  let clean = String(DOMPurify.sanitize(dirty, RICH_CONFIG));
  
  // Post-procesare: adaugă rel="noopener noreferrer" la toate link-urile externe
  clean = clean.replace(
    /<a\s+([^>]*href=["']https?:\/\/[^"']*["'][^>]*)>/gi,
    (match: string, attrs: string) => {
      if (!attrs.includes('rel=')) {
        return `<a ${attrs} rel="noopener noreferrer">`;
      }
      return match;
    }
  );
  
  return clean;
}

/**
 * Sanitizează HTML pentru campanii de marketing/email
 * Configurare permisivă dar sigură pentru conținut de marketing.
 * 
 * @param dirty - HTML-ul nesanitizat
 * @returns HTML sanitizat pentru email campaigns
 */
export function sanitizeEmailCampaign(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  return String(DOMPurify.sanitize(dirty, EMAIL_CAMPAIGN_CONFIG));
}

/**
 * Sanitizează doar text (elimină toate tag-urile HTML)
 * Folosește pentru preview-uri scurte sau când nu este nevoie de formatare.
 * 
 * @param dirty - HTML-ul nesanitizat
 * @returns Text simplu fără HTML
 */
export function sanitizeToPlainText(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  
  const clean = String(DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
  }));
  
  // Înlocuiește entități HTML
  return clean
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Verifică dacă un string conține HTML potențial periculos
 * Util pentru logging sau alertare.
 * 
 * @param content - Conținutul de verificat
 * @returns true dacă conține HTML periculos
 */
export function containsDangerousHtml(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
    /javascript:/gi,
    /data:text\/html/gi
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(content));
}

/**
 * Hook React pentru sanitizare HTML
 * Poate fi folosit în componente pentru sanitizare automată.
 * 
 * @example
 * const sanitizedContent = useSanitizedHtml(campaign.contentHtml, 'email');
 */
export function useSanitizedHtml(
  html: string | undefined,
  type: 'strict' | 'moderate' | 'rich' | 'email' = 'strict'
): string {
  if (!html) return '';
  
  switch (type) {
    case 'moderate':
      return sanitizeHtmlModerate(html);
    case 'rich':
      return sanitizeHtmlRich(html);
    case 'email':
      return sanitizeEmailCampaign(html);
    case 'strict':
    default:
      return sanitizeHtml(html);
  }
}

/**
 * Componenta React pentru randare sigură de HTML
 * Alternative la dangerouslySetInnerHTML
 * 
 * @example
 * <SafeHtml html={campaign.contentHtml} type="email" />
 */
export interface SafeHtmlProps {
  html: string;
  type?: 'strict' | 'moderate' | 'rich' | 'email';
  className?: string;
  fallback?: React.ReactNode;
}

export function SafeHtml({ html, type = 'strict', className, fallback }: SafeHtmlProps): React.ReactElement | null {
  const sanitized = useSanitizedHtml(html, type);
  
  if (!sanitized && fallback) {
    return <>{fallback}</> as React.ReactElement;
  }
  
  if (!sanitized) {
    return null;
  }
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

