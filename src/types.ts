// ─── Tablia Types ───────────────────────────────────────────────

// ─── Venue (Restaurant/Bar) ─────────────────────────────────────

export interface Venue {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  address?: string;
  cuisine_type?: string;
  created_at: string;
  updated_at: string;
}

// ─── Menu ───────────────────────────────────────────────────────

export type MenuSourceType = 'url' | 'pdf' | 'image' | 'text';
export type MenuStatus = 'draft' | 'parsing' | 'review' | 'published';

export interface Menu {
  id: string;
  venue_id: string;
  name: string;
  source_type: MenuSourceType;
  source_content?: string; // original URL, text, or file path
  status: MenuStatus;
  qr_code_url?: string;
  public_url?: string;
  created_at: string;
  updated_at: string;
}

// ─── Category & Items ───────────────────────────────────────────

export interface MenuCategory {
  id: string;
  menu_id: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_visible: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  menu_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  image_url?: string;
  tags: string[]; // ['vegano', 'sin-tacc', 'picante', etc.]
  is_available: boolean;
  sort_order: number;
}

// ─── Dynamic Sections ───────────────────────────────────────────

export type DynamicSectionType = 'chef_picks' | 'daily_promo' | 'pairing';

export interface DynamicSection {
  id: string;
  menu_id: string;
  type: DynamicSectionType;
  title: string;
  content?: string;
  item_ids: string[]; // references to menu items
  is_active: boolean;
  sort_order: number;
}

// ─── Chat ───────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  referenced_items?: string[]; // item IDs mentioned in response
}

export interface ChatSession {
  id: string;
  menu_id: string;
  messages: ChatMessage[];
  customer_email?: string;
  created_at: string;
}

// ─── Analytics ──────────────────────────────────────────────────

export type AnalyticsEventType =
  | 'menu.scan'
  | 'menu.section.view'
  | 'menu.item.view'
  | 'chat.message.sent'
  | 'chat.item.recommended'
  | 'customer.email.captured';

export interface AnalyticsEvent {
  id: string;
  menu_id: string;
  venue_id: string;
  event_type: AnalyticsEventType;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ─── Customer (CRM) ────────────────────────────────────────────

export interface Customer {
  id: string;
  venue_id: string;
  email: string;
  name?: string;
  first_seen: string;
  last_seen: string;
  visit_count: number;
}

// ─── Menu Parsing (AI Import) ───────────────────────────────────

export interface ParsedMenu {
  categories: {
    name: string;
    description?: string;
    items: {
      name: string;
      description?: string;
      price: number;
      currency: string;
      tags: string[];
    }[];
  }[];
  metadata?: {
    restaurant_name?: string;
    cuisine_type?: string;
    confidence: number; // 0-1 parsing confidence score
  };
}
