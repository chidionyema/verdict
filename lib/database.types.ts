export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          display_name: string | null;
          email: string | null;
          is_judge: boolean;
          is_admin: boolean;
          country: string | null;
          age_range: '18-24' | '25-34' | '35-44' | '45+' | null;
          gender: 'male' | 'female' | 'nonbinary' | 'prefer_not_say' | null;
          avatar_url: string | null;
          credits: number;
          onboarding_completed: boolean;
          judge_qualification_date: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          display_name?: string | null;
          email?: string | null;
          is_judge?: boolean;
          is_admin?: boolean;
          country?: string | null;
          age_range?: '18-24' | '25-34' | '35-44' | '45+' | null;
          gender?: 'male' | 'female' | 'nonbinary' | 'prefer_not_say' | null;
          avatar_url?: string | null;
          credits?: number;
          onboarding_completed?: boolean;
          judge_qualification_date?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          display_name?: string | null;
          email?: string | null;
          is_judge?: boolean;
          is_admin?: boolean;
          country?: string | null;
          age_range?: '18-24' | '25-34' | '35-44' | '45+' | null;
          gender?: 'male' | 'female' | 'nonbinary' | 'prefer_not_say' | null;
          avatar_url?: string | null;
          credits?: number;
          onboarding_completed?: boolean;
          judge_qualification_date?: string | null;
        };
      };
      verdict_requests: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          status: 'open' | 'in_progress' | 'closed' | 'cancelled';
          category: 'appearance' | 'profile' | 'writing' | 'decision';
          subcategory: string | null;
          media_type: 'photo' | 'text' | 'audio';
          media_url: string | null;
          text_content: string | null;
          context: string;
          target_verdict_count: number;
          received_verdict_count: number;
          is_flagged: boolean;
          flagged_reason: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          status?: 'open' | 'in_progress' | 'closed' | 'cancelled';
          category: 'appearance' | 'profile' | 'writing' | 'decision';
          subcategory?: string | null;
          media_type: 'photo' | 'text' | 'audio';
          media_url?: string | null;
          text_content?: string | null;
          context: string;
          target_verdict_count?: number;
          received_verdict_count?: number;
          is_flagged?: boolean;
          flagged_reason?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          status?: 'open' | 'in_progress' | 'closed' | 'cancelled';
          category?: 'appearance' | 'profile' | 'writing' | 'decision';
          subcategory?: string | null;
          media_type?: 'photo' | 'text' | 'audio';
          media_url?: string | null;
          text_content?: string | null;
          context?: string;
          target_verdict_count?: number;
          received_verdict_count?: number;
          is_flagged?: boolean;
          flagged_reason?: string | null;
          deleted_at?: string | null;
        };
      };
      verdict_responses: {
        Row: {
          id: string;
          created_at: string;
          request_id: string;
          judge_id: string;
          rating: number | null;
          feedback: string;
          tone: 'honest' | 'constructive' | 'encouraging';
          voice_url: string | null;
          is_flagged: boolean;
          flagged_reason: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          request_id: string;
          judge_id: string;
          rating?: number | null;
          feedback: string;
          tone: 'honest' | 'constructive' | 'encouraging';
          voice_url?: string | null;
          is_flagged?: boolean;
          flagged_reason?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          request_id?: string;
          judge_id?: string;
          rating?: number | null;
          feedback?: string;
          tone?: 'honest' | 'constructive' | 'encouraging';
          voice_url?: string | null;
          is_flagged?: boolean;
          flagged_reason?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          stripe_session_id: string | null;
          stripe_payment_intent_id: string | null;
          type: 'purchase' | 'adjustment' | 'refund';
          credits_delta: number;
          amount_cents: number;
          currency: string;
          status: 'pending' | 'completed' | 'failed';
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          type: 'purchase' | 'adjustment' | 'refund';
          credits_delta: number;
          amount_cents: number;
          currency?: string;
          status?: 'pending' | 'completed' | 'failed';
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          type?: 'purchase' | 'adjustment' | 'refund';
          credits_delta?: number;
          amount_cents?: number;
          currency?: string;
          status?: 'pending' | 'completed' | 'failed';
        };
      };
      judge_sessions: {
        Row: {
          id: string;
          judge_id: string;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          judge_id: string;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          judge_id?: string;
          started_at?: string;
          ended_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type VerdictRequest = Database['public']['Tables']['verdict_requests']['Row'];
export type VerdictResponse = Database['public']['Tables']['verdict_responses']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
