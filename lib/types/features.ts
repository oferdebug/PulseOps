/**
 * PulseOps TypeScript Type Definitions
 *
 * Centralized type definitions for new features.
 * Import these in your components as needed.
 */
/** biome-ignore-all lint/suspicious/noExplicitAny: needed for flexible JSON structures */

// ============================================================
// ATTACHMENTS
// ============================================================

export type AttachmentEntityType =
  | 'ticket'
  | 'ticket_comment'
  | 'article'
  | 'user_profile';

export interface Attachment {
  id: string;
  entity_type: AttachmentEntityType;
  entity_id: string;
  file_name: string;
  file_size: number; // bytes
  mime_type: string;
  storage_path: string;
  uploaded_by: string | null;
  uploaded_at: string;
  description?: string | null;
  deleted_at?: string | null;
}

export interface FileUploadProgress {
  file: File;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  attachmentId?: string;
}

// ============================================================
// TAGS
// ============================================================

export interface Tag {
  id: string;
  name: string;
  color?: string | null;
  description?: string | null;
  created_by: string | null;
  created_at: string;
}

export interface TicketTag {
  ticket_id: string;
  tag_id: string;
  created_at: string;
  tag?: Tag; // Joined data
}

export interface ArticleTag {
  article_id: string;
  tag_id: string;
  created_at: string;
  tag?: Tag; // Joined data
}

export interface PopularTag extends Tag {
  usage_count: number | string;
}

// ============================================================
// COMMENTS
// ============================================================

export type CommentType = 'public' | 'internal';

export interface TicketComment {
  id: string;
  ticket_id: string;
  content: string;
  comment_type: CommentType;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  edited_at?: string | null;
  mentions: string[]; // Array of user IDs
  parent_id?: string | null; // For nested comments

  // Joined data (when fetching with relations)
  author?: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url?: string | null;
  };
  attachments?: Attachment[];
  replies?: TicketComment[]; // Nested replies
}

export interface CommentFormData {
  content: string;
  comment_type: CommentType;
  mentions?: string[];
  parent_id?: string;
}

// ============================================================
// SLA MANAGEMENT
// ============================================================

export type SLAPriority = 'low' | 'medium' | 'high' | 'critical';

export interface SLARule {
  id: string;
  name: string;
  priority: SLAPriority;
  response_time_hours: number; // Hours to first response
  resolution_time_hours: number; // Hours to resolution
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketSLA {
  id: string;
  ticket_id: string;
  sla_rule_id: string;
  response_due_at: string;
  resolution_due_at: string;
  response_met_at?: string | null;
  resolution_met_at?: string | null;
  is_breached: boolean;
  created_at: string;

  // Joined data
  sla_rule?: SLARule;
}

export interface SLAStatus {
  status: 'met' | 'at-risk' | 'breached';
  timeRemaining: number; // milliseconds
  dueAt: string;
}

// ============================================================
// AUTOMATION RULES
// ============================================================

export type RuleTrigger =
  | 'ticket_created'
  | 'ticket_updated'
  | 'status_changed'
  | 'priority_changed'
  | 'assigned'
  | 'sla_breach';

export type RuleAction =
  | 'assign_to'
  | 'change_status'
  | 'change_priority'
  | 'send_email'
  | 'add_tag'
  | 'add_comment';

export interface AutomationRule {
  id: string;
  name: string;
  description?: string | null;
  trigger: RuleTrigger;
  conditions: Record<string, any>; // JSON conditions
  actions: Array<{
    type: RuleAction;
    value: any;
  }>;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// TICKET TEMPLATES
// ============================================================

export interface TicketTemplate {
  id: string;
  name: string;
  description?: string | null;
  title_template: string;
  description_template: string;
  default_priority?: SLAPriority | null;
  default_status?: string | null;
  category?: string | null;
  custom_fields?: Record<string, any> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// ANALYTICS & REPORTING
// ============================================================

export interface ArticleView {
  id: string;
  article_id: string;
  user_id?: string | null;
  viewed_at: string;
  session_id?: string | null;
}

export interface ArticleRating {
  id: string;
  article_id: string;
  user_id: string;
  rating: number; // 1-5
  feedback?: string | null;
  created_at: string;
}

export interface TicketRating {
  id: string;
  ticket_id: string;
  user_id: string;
  rating: number; // 1-5
  feedback?: string | null;
  created_at: string;
}

export interface ArticleAnalytics {
  article_id: string;
  view_count: number;
  average_rating: number;
  rating_count: number;
  helpful_count: number;
}

export interface TicketMetrics {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  closed_tickets: number;
  average_resolution_time: number; // hours
  sla_compliance_rate: number; // percentage
}

export interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  tickets_assigned: number;
  tickets_resolved: number;
  average_resolution_time: number;
  average_rating: number;
  sla_compliance_rate: number;
}

// ============================================================
// SAVED FILTERS
// ============================================================

export interface SavedFilter {
  id: string;
  name: string;
  description?: string | null;
  filter_type: 'ticket' | 'article';
  filters: Record<string, any>; // JSON filter criteria
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// CUSTOMER PORTAL
// ============================================================

export interface ExternalUser {
  id: string;
  email: string;
  full_name?: string | null;
  company?: string | null;
  phone?: string | null;
  created_at: string;
  last_login_at?: string | null;
}

export interface PortalSettings {
  id: string;
  allow_registration: boolean;
  require_approval: boolean;
  allowed_domains: string[]; // Email domain whitelist
  welcome_message?: string | null;
  updated_at: string;
}

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export type NotificationType =
  | 'ticket_assigned'
  | 'ticket_updated'
  | 'comment_added'
  | 'mention'
  | 'sla_warning'
  | 'sla_breach';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  entity_type?: string | null;
  entity_id?: string | null;
  read: boolean;
  read_at?: string | null;
  created_at: string;

  // Metadata for rich notifications
  metadata?: Record<string, any>;
}

// ============================================================
// TICKET HISTORY / AUDIT LOG
// ============================================================

export type HistoryAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'priority_changed'
  | 'assigned'
  | 'commented'
  | 'tagged';

export interface TicketHistory {
  id: string;
  ticket_id: string;
  action: HistoryAction;
  field_changed?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  changed_by: string | null;
  changed_at: string;

  // Joined data
  user?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

// ============================================================
// BULK OPERATIONS
// ============================================================

export interface BulkUpdateData {
  status?: string;
  priority?: string;
  assigned_to?: string;
  add_tags?: string[];
  remove_tags?: string[];
}

export interface BulkOperationResult {
  success: boolean;
  updated_count: number;
  failed_count: number;
  errors?: Array<{
    ticket_id: string;
    error: string;
  }>;
}

// ============================================================
// EMAIL INTEGRATION
// ============================================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[]; // Available template variables
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  to_email: string;
  from_email: string;
  subject: string;
  template_id?: string | null;
  sent_at: string;
  status: 'sent' | 'failed' | 'bounced';
  error_message?: string | null;
}
