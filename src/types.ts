// ─── Tablia Types ───────────────────────────────────────────────

// ─── Landing Links ──────────────────────────────────────────────

export type LandingLinkType = 'menu' | 'wifi' | 'url' | 'phone' | 'whatsapp';
export type LandingLinkIcon =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'twitter'
  | 'calendar'
  | 'star'
  | 'phone'
  | 'wifi'
  | 'globe'
  | 'map-pin'
  | 'mail'
  | 'whatsapp';

export interface LandingLink {
  type: LandingLinkType;
  label: string;
  url?: string; // for 'url', 'phone', 'whatsapp' types
  value?: string; // for 'wifi' (password)
  icon?: LandingLinkIcon;
  isPrimary?: boolean; // "Ver Menú" button — visually prominent
}

// ─── Chat Persona ───────────────────────────────────────────────

export type ChatPersonaId =
  | 'curator'
  | 'friendly'
  | 'sommelier'
  | 'concise'
  | 'premium';

export interface ChatPersona {
  id: ChatPersonaId;
}

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
  landing_links?: LandingLink[];
  chat_persona?: ChatPersona;
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

// ─── Customer Memory & Loyalty ─────────────────────────────────

export type CustomerIdentityType = 'email' | 'phone' | 'whatsapp';
export type ConsentChannel = 'email' | 'sms' | 'whatsapp' | 'web_push';
export type ConsentStatus = 'opted_in' | 'opted_out';
export type LoyaltyProgramType = 'stamps' | 'points' | 'visits';
export type LoyaltyProgramStatus = 'draft' | 'active' | 'paused' | 'archived';
export type LoyaltyRewardStatus = 'earned' | 'redeemed' | 'expired';
export type CampaignType = 'flash_promo' | 'announcement' | 'event';
export type CampaignChannel = 'in_app' | 'web_push' | 'whatsapp' | 'email' | 'all';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface LoyaltyProgressSummary {
  programId: string;
  name: string;
  type: LoyaltyProgramType;
  visitCount: number;
  visitsRequired: number;
  visitsUntilReward: number;
  rewardLabel: string;
}

export interface CustomerRewardSummary {
  id: string;
  rewardLabel: string;
  status: LoyaltyRewardStatus;
}

export interface CustomerCampaignSummary {
  id: string;
  type: CampaignType;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface CustomerMemorySummary {
  ok: boolean;
  deviceKey: string;
  customerProfileId: string;
  venueId: string;
  visitCount: number;
  isFirstVisit: boolean;
  countIncremented: boolean;
  loyalty?: LoyaltyProgressSummary;
  reward?: CustomerRewardSummary;
  campaign?: CustomerCampaignSummary;
}

export interface LoyaltyProgram {
  id: string;
  venue_id: string;
  name: string;
  type: LoyaltyProgramType;
  status: LoyaltyProgramStatus;
  rules: {
    visits_required?: number;
    reward_label?: string;
    [key: string]: unknown;
  };
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VenueCampaign {
  id: string;
  venue_id: string;
  name: string;
  type: CampaignType;
  channel: CampaignChannel;
  status: CampaignStatus;
  title: string;
  body: string;
  cta_label?: string | null;
  cta_url?: string | null;
  segment: Record<string, unknown>;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VenueEngagementConfig {
  loyaltyProgram?: LoyaltyProgram;
  flashCampaign?: VenueCampaign;
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

export interface ParsedContactInfo {
  phone?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  website?: string;
  wifi_name?: string;
  wifi_password?: string;
  whatsapp?: string;
}

export type MenuVisualTemplate =
  | 'heritage'
  | 'modern'
  | 'botanical'
  | 'night'
  | 'minimal';

export type MenuHeadingStyle = 'serif' | 'sans' | 'display' | 'condensed';
export type MenuDensity = 'compact' | 'comfortable' | 'spacious';
export type MenuDecorativeStyle =
  | 'none'
  | 'linework'
  | 'ribbon'
  | 'bordered'
  | 'minimal';
export type MenuPriceStyle = 'right-aligned' | 'inline' | 'badge';

export interface ParsedMenuVisualStyle {
  template?: MenuVisualTemplate;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  heading_style?: MenuHeadingStyle;
  density?: MenuDensity;
  decorative_style?: MenuDecorativeStyle;
  price_style?: MenuPriceStyle;
  source_notes?: string;
}

export interface ParsedMenuCharge {
  label: string;
  price: number;
  currency: string;
  description?: string;
}

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
  contact_info?: ParsedContactInfo;
  visual_style?: ParsedMenuVisualStyle;
  additional_charges?: ParsedMenuCharge[];
  legal_notes?: string[];
}
