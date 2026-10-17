export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_consent_locks: {
        Row: {
          created_at: string
          reason: string
          required: boolean
          required_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          reason?: string
          required?: boolean
          required_version: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          reason?: string
          required?: boolean
          required_version?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      account_restrictions: {
        Row: {
          cleared_at: string | null
          created_at: string
          metadata: Json
          reason: string
          required_version: string
          restriction_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cleared_at?: string | null
          created_at?: string
          metadata?: Json
          reason?: string
          required_version: string
          restriction_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cleared_at?: string | null
          created_at?: string
          metadata?: Json
          reason?: string
          required_version?: string
          restriction_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      account_verifications: {
        Row: {
          attempts: number
          code_expires_at: string | null
          code_hash: string | null
          created_at: string
          last_code_sent_at: string | null
          last_failed_at: string | null
          max_attempts: number
          status: string
          updated_at: string
          user_id: string
          verification_source: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          attempts?: number
          code_expires_at?: string | null
          code_hash?: string | null
          created_at?: string
          last_code_sent_at?: string | null
          last_failed_at?: string | null
          max_attempts?: number
          status?: string
          updated_at?: string
          user_id: string
          verification_source?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          attempts?: number
          code_expires_at?: string | null
          code_hash?: string | null
          created_at?: string
          last_code_sent_at?: string | null
          last_failed_at?: string | null
          max_attempts?: number
          status?: string
          updated_at?: string
          user_id?: string
          verification_source?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          target_user_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          target_user_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          target_user_id?: string
        }
        Relationships: []
      }
      admin_system_secrets: {
        Row: {
          ciphertext: string
          created_at: string
          created_by: string | null
          enabled: boolean
          id: string
          iv: string
          key_hint: string
          label: string
          last_validated_at: string | null
          provider: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ciphertext: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          iv: string
          key_hint: string
          label: string
          last_validated_at?: string | null
          provider: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ciphertext?: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          iv?: string
          key_hint?: string
          label?: string
          last_validated_at?: string | null
          provider?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_generation_settings: {
        Row: {
          api_key: string | null
          created_at: string
          id: number
          provider: string
          updated_at: string
          updated_by: string | null
          use_own_key: boolean
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          id?: number
          provider?: string
          updated_at?: string
          updated_by?: string | null
          use_own_key?: boolean
        }
        Update: {
          api_key?: string | null
          created_at?: string
          id?: number
          provider?: string
          updated_at?: string
          updated_by?: string | null
          use_own_key?: boolean
        }
        Relationships: []
      }
      ai_key_exemptions: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          account_verification_required: boolean
          id: number
          jee_main_date: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_verification_required?: boolean
          id?: number
          jee_main_date?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_verification_required?: boolean
          id?: number
          jee_main_date?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      article_author_subscriptions: {
        Row: {
          author_id: string
          created_at: string
          id: string
          subscriber_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          subscriber_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          subscriber_id?: string
        }
        Relationships: []
      }
      article_bookmarks: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_bookmarks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_comments: {
        Row: {
          article_id: string
          author_id: string
          author_name: string
          body: string
          created_at: string
          id: string
          status: string
        }
        Insert: {
          article_id: string
          author_id: string
          author_name: string
          body: string
          created_at?: string
          id?: string
          status?: string
        }
        Update: {
          article_id?: string
          author_id?: string
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_likes: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_views: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_id: string | null
          viewed_on: string
          visitor_key: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_id?: string | null
          viewed_on?: string
          visitor_key: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_id?: string | null
          viewed_on?: string
          visitor_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_avatar_url: string | null
          author_id: string | null
          author_name: string
          body_markdown: string
          category: string
          cover_image_url: string | null
          created_at: string
          id: string
          published_at: string | null
          reading_minutes: number
          slug: string
          status: string
          summary: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_avatar_url?: string | null
          author_id?: string | null
          author_name?: string
          body_markdown?: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          reading_minutes?: number
          slug: string
          status?: string
          summary?: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_avatar_url?: string | null
          author_id?: string | null
          author_name?: string
          body_markdown?: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          reading_minutes?: number
          slug?: string
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_email?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      birthday_badges: {
        Row: {
          awarded_at: string
          badge_key: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_key: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_key?: string
          user_id?: string
        }
        Relationships: []
      }
      birthday_party_prefs: {
        Row: {
          party_theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          party_theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          party_theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      birthday_reminder_log: {
        Row: {
          birthday_on: string
          created_at: string
          recipient_id: string
          user_id: string
        }
        Insert: {
          birthday_on: string
          created_at?: string
          recipient_id: string
          user_id: string
        }
        Update: {
          birthday_on?: string
          created_at?: string
          recipient_id?: string
          user_id?: string
        }
        Relationships: []
      }
      birthday_wish_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          wish_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          wish_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          wish_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "birthday_wish_reports_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: false
            referencedRelation: "birthday_wishes"
            referencedColumns: ["id"]
          },
        ]
      }
      birthday_wishes: {
        Row: {
          birthday_year: number
          created_at: string
          deleted_at: string | null
          id: string
          message: string
          reaction: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          birthday_year: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          message: string
          reaction?: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          birthday_year?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          message?: string
          reaction?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          ip_hash: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_hash: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_hash?: string
          reason?: string | null
        }
        Relationships: []
      }
      bot_post_log: {
        Row: {
          bot_account_id: string
          content_type: string
          content_version: number
          created_at: string
          follow_up_generated: boolean
          id: string
          publish_time: string
          staged_post_id: string | null
          template_id: string
        }
        Insert: {
          bot_account_id: string
          content_type: string
          content_version?: number
          created_at?: string
          follow_up_generated?: boolean
          id?: string
          publish_time?: string
          staged_post_id?: string | null
          template_id: string
        }
        Update: {
          bot_account_id?: string
          content_type?: string
          content_version?: number
          created_at?: string
          follow_up_generated?: boolean
          id?: string
          publish_time?: string
          staged_post_id?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_post_log_bot_account_id_fkey"
            columns: ["bot_account_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_post_log_bot_account_id_fkey"
            columns: ["bot_account_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_post_log_staged_post_id_fkey"
            columns: ["staged_post_id"]
            isOneToOne: false
            referencedRelation: "official_bot_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string
          detail_fields: Json
          id: string
          is_enabled: boolean
          name: string
          subtitle: string
          template_key: string
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description?: string
          detail_fields?: Json
          id?: string
          is_enabled?: boolean
          name: string
          subtitle?: string
          template_key?: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          detail_fields?: Json
          id?: string
          is_enabled?: boolean
          name?: string
          subtitle?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificate_types: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string
          icon: string | null
          id: string
          is_enabled: boolean
          name: string
          sort_order: number
          template_config: Json
          threshold: number | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          sort_order?: number
          template_config?: Json
          threshold?: number | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          sort_order?: number
          template_config?: Json
          threshold?: number | null
        }
        Relationships: []
      }
      chat_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          body: string
          created_at: string
          deleted_at: string | null
          deleted_for_everyone: boolean
          delivered_at: string | null
          edited_at: string | null
          id: string
          image_url: string | null
          is_ai: boolean
          kind: string
          marked_at: string | null
          marked_by: string | null
          marked_label: string | null
          parent_id: string | null
          pinned_at: string | null
          pinned_by: string | null
          read_at: string | null
          reply_to_id: string | null
          solved_at: string | null
          subject: string | null
          topic: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          deleted_at?: string | null
          deleted_for_everyone?: boolean
          delivered_at?: string | null
          edited_at?: string | null
          id?: string
          image_url?: string | null
          is_ai?: boolean
          kind?: string
          marked_at?: string | null
          marked_by?: string | null
          marked_label?: string | null
          parent_id?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          read_at?: string | null
          reply_to_id?: string | null
          solved_at?: string | null
          subject?: string | null
          topic?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deleted_at?: string | null
          deleted_for_everyone?: boolean
          delivered_at?: string | null
          edited_at?: string | null
          id?: string
          image_url?: string | null
          is_ai?: boolean
          kind?: string
          marked_at?: string | null
          marked_by?: string | null
          marked_label?: string | null
          parent_id?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          read_at?: string | null
          reply_to_id?: string | null
          solved_at?: string | null
          subject?: string | null
          topic?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_reads: {
        Row: {
          last_read_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          last_read_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          last_read_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      communities: {
        Row: {
          announcement: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          announcement?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          announcement?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      community_ai_settings: {
        Row: {
          auto_answer_doubts: boolean
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_answer_doubts?: boolean
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_answer_doubts?: boolean
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      community_groups: {
        Row: {
          category: Database["public"]["Enums"]["community_group_category"]
          created_at: string
          description: string | null
          icon_emoji: string
          id: string
          invite_url: string
          is_active: boolean
          name: string
          platform: Database["public"]["Enums"]["community_platform"]
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["community_group_category"]
          created_at?: string
          description?: string | null
          icon_emoji?: string
          id?: string
          invite_url: string
          is_active?: boolean
          name: string
          platform?: Database["public"]["Enums"]["community_platform"]
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["community_group_category"]
          created_at?: string
          description?: string | null
          icon_emoji?: string
          id?: string
          invite_url?: string
          is_active?: boolean
          name?: string
          platform?: Database["public"]["Enums"]["community_platform"]
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      consent_settings: {
        Row: {
          consent_enabled: boolean
          id: number
          maintenance_button_enabled: boolean
          maintenance_button_text: string | null
          maintenance_button_url: string | null
          maintenance_message: string | null
          maintenance_mode: boolean
          maintenance_subtitle: string | null
          maintenance_title: string | null
          maintenance_updated_at: string | null
          maintenance_updated_by: string | null
          require_device: boolean
          require_gps: boolean
          require_network: boolean
          require_personal_details: boolean
          show_consent_skipped_banner: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          consent_enabled?: boolean
          id?: number
          maintenance_button_enabled?: boolean
          maintenance_button_text?: string | null
          maintenance_button_url?: string | null
          maintenance_message?: string | null
          maintenance_mode?: boolean
          maintenance_subtitle?: string | null
          maintenance_title?: string | null
          maintenance_updated_at?: string | null
          maintenance_updated_by?: string | null
          require_device?: boolean
          require_gps?: boolean
          require_network?: boolean
          require_personal_details?: boolean
          show_consent_skipped_banner?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          consent_enabled?: boolean
          id?: number
          maintenance_button_enabled?: boolean
          maintenance_button_text?: string | null
          maintenance_button_url?: string | null
          maintenance_message?: string | null
          maintenance_mode?: boolean
          maintenance_subtitle?: string | null
          maintenance_title?: string | null
          maintenance_updated_at?: string | null
          maintenance_updated_by?: string | null
          require_device?: boolean
          require_gps?: boolean
          require_network?: boolean
          require_personal_details?: boolean
          show_consent_skipped_banner?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          admin_notes: string | null
          admin_reply: string | null
          body: string
          created_at: string
          id: string
          replied_at: string | null
          replied_by: string | null
          status: string
          subject: string
          updated_at: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          admin_reply?: string | null
          body: string
          created_at?: string
          id?: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          admin_reply?: string | null
          body?: string
          created_at?: string
          id?: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      daily_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          practiced: boolean
          revised: boolean
          studied: boolean
          task_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          practiced?: boolean
          revised?: boolean
          studied?: boolean
          task_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          practiced?: boolean
          revised?: boolean
          studied?: boolean
          task_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_preferences: {
        Row: {
          mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          body: string
          created_at: string
          deleted_at: string | null
          deleted_for_everyone: boolean
          delivered_at: string | null
          id: string
          read_at: string | null
          recipient_id: string
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          deleted_at?: string | null
          deleted_for_everyone?: boolean
          delivered_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id: string
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deleted_at?: string | null
          deleted_for_everyone?: boolean
          delivered_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      feed_comment_votes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          vote_value: number
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          vote_value: number
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          vote_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "feed_comment_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          is_solution: boolean
          parent_comment_id: string | null
          post_id: string
          user_id: string
          votes_count: number
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_solution?: boolean
          parent_comment_id?: string | null
          post_id: string
          user_id: string
          votes_count?: number
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_solution?: boolean
          parent_comment_id?: string | null
          post_id?: string
          user_id?: string
          votes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_likes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      feed_post_votes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
          vote_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
          vote_value: number
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
          vote_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "feed_post_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          body: string
          comments_count: number
          created_at: string
          document_pages: number | null
          document_size_kb: number | null
          document_title: string | null
          document_url: string | null
          id: string
          image_url: string | null
          post_type: string
          source_profile_post_id: string | null
          tags: string[]
          updated_at: string
          user_id: string
          votes_count: number
        }
        Insert: {
          body: string
          comments_count?: number
          created_at?: string
          document_pages?: number | null
          document_size_kb?: number | null
          document_title?: string | null
          document_url?: string | null
          id?: string
          image_url?: string | null
          post_type?: string
          source_profile_post_id?: string | null
          tags?: string[]
          updated_at?: string
          user_id: string
          votes_count?: number
        }
        Update: {
          body?: string
          comments_count?: number
          created_at?: string
          document_pages?: number | null
          document_size_kb?: number | null
          document_title?: string | null
          document_url?: string | null
          id?: string
          image_url?: string | null
          post_type?: string
          source_profile_post_id?: string | null
          tags?: string[]
          updated_at?: string
          user_id?: string
          votes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_source_profile_post_id_fkey"
            columns: ["source_profile_post_id"]
            isOneToOne: false
            referencedRelation: "profile_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_stories: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          image_url: string
          text_overlay: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          image_url: string
          text_overlay?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string
          text_overlay?: string | null
          user_id?: string
        }
        Relationships: []
      }
      feed_story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "feed_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_forms: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      feedback_submissions: {
        Row: {
          actual_behavior: string | null
          admin_note: string | null
          admin_response: string | null
          attachments: Json | null
          category: string
          created_at: string
          description: string
          expected_behavior: string | null
          id: string
          kind: string
          message: string
          page_url: string | null
          priority: string
          public_id: string | null
          rating: number | null
          resolved_at: string | null
          severity: string
          status: string
          steps_to_reproduce: string | null
          subject: string
          technical_details: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_behavior?: string | null
          admin_note?: string | null
          admin_response?: string | null
          attachments?: Json | null
          category?: string
          created_at?: string
          description: string
          expected_behavior?: string | null
          id?: string
          kind: string
          message: string
          page_url?: string | null
          priority?: string
          public_id?: string | null
          rating?: number | null
          resolved_at?: string | null
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          subject: string
          technical_details?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_behavior?: string | null
          admin_note?: string | null
          admin_response?: string | null
          attachments?: Json | null
          category?: string
          created_at?: string
          description?: string
          expected_behavior?: string | null
          id?: string
          kind?: string
          message?: string
          page_url?: string | null
          priority?: string
          public_id?: string | null
          rating?: number | null
          resolved_at?: string | null
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          subject?: string
          technical_details?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback_wall_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_wall_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feedback_wall_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_wall_posts: {
        Row: {
          created_at: string
          hidden: boolean
          id: string
          message: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hidden?: boolean
          id?: string
          message: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hidden?: boolean
          id?: string
          message?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          attachment_urls: string[]
          body: string
          created_at: string
          id: string
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_urls?: string[]
          body: string
          created_at?: string
          id?: string
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_urls?: string[]
          body?: string
          created_at?: string
          id?: string
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_reply_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: string
          reply_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type?: string
          reply_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: string
          reply_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_reply_reactions_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_thread_bookmarks: {
        Row: {
          created_at: string
          id: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_thread_bookmarks_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_thread_follows: {
        Row: {
          created_at: string
          id: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_thread_follows_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_thread_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_thread_reactions_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_thread_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          status: string
          thread_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          status?: string
          thread_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_thread_reports_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          attachment_urls: string[]
          body: string
          created_at: string
          id: string
          is_locked: boolean
          subject: Database["public"]["Enums"]["subject"]
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          attachment_urls?: string[]
          body: string
          created_at?: string
          id?: string
          is_locked?: boolean
          subject?: Database["public"]["Enums"]["subject"]
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          attachment_urls?: string[]
          body?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          subject?: Database["public"]["Enums"]["subject"]
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: []
      }
      gmail_connections: {
        Row: {
          connected_at: string
          gmail_email: string
          refresh_token_ciphertext: string
          scopes: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_at?: string
          gmail_email: string
          refresh_token_ciphertext: string
          scopes?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_at?: string
          gmail_email?: string
          refresh_token_ciphertext?: string
          scopes?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gmail_oauth_states: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          state_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          state_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          state_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          last_read_at: string
          role: Database["public"]["Enums"]["squad_member_role"]
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          last_read_at?: string
          role?: Database["public"]["Enums"]["squad_member_role"]
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string
          role?: Database["public"]["Enums"]["squad_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_reports: {
        Row: {
          created_at: string
          group_id: string
          id: string
          reason: string | null
          reported_by: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          reason?: string | null
          reported_by: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          reason?: string | null
          reported_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_reports_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_settings: {
        Row: {
          created_at: string
          disappearing_days: number
          disappearing_messages: boolean
          group_id: string
          updated_at: string
          who_can_edit: Database["public"]["Enums"]["group_permission"]
          who_can_send: Database["public"]["Enums"]["group_permission"]
        }
        Insert: {
          created_at?: string
          disappearing_days?: number
          disappearing_messages?: boolean
          group_id: string
          updated_at?: string
          who_can_edit?: Database["public"]["Enums"]["group_permission"]
          who_can_send?: Database["public"]["Enums"]["group_permission"]
        }
        Update: {
          created_at?: string
          disappearing_days?: number
          disappearing_messages?: boolean
          group_id?: string
          updated_at?: string
          who_can_edit?: Database["public"]["Enums"]["group_permission"]
          who_can_send?: Database["public"]["Enums"]["group_permission"]
        }
        Relationships: [
          {
            foreignKeyName: "group_settings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          category: Database["public"]["Enums"]["group_category"]
          community_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          invite_code: string
          invite_slug: string | null
          name: string
          owner_id: string
          privacy: Database["public"]["Enums"]["group_privacy"]
        }
        Insert: {
          category?: Database["public"]["Enums"]["group_category"]
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invite_code?: string
          invite_slug?: string | null
          name: string
          owner_id: string
          privacy?: Database["public"]["Enums"]["group_privacy"]
        }
        Update: {
          category?: Database["public"]["Enums"]["group_category"]
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invite_code?: string
          invite_slug?: string | null
          name?: string
          owner_id?: string
          privacy?: Database["public"]["Enums"]["group_privacy"]
        }
        Relationships: [
          {
            foreignKeyName: "groups_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_academic_calendars: {
        Row: {
          academic_year: string
          calendar_name: string
          created_at: string
          data_last_verified_at: string | null
          exam_end: string | null
          exam_start: string | null
          id: string
          institute_id: string
          registration_end: string | null
          registration_start: string | null
          semester: number | null
          source_label: string | null
          source_url: string | null
          teaching_end: string | null
          teaching_start: string | null
          term_end: string | null
          term_start: string | null
          updated_at: string
          vacation_end: string | null
          vacation_start: string | null
        }
        Insert: {
          academic_year: string
          calendar_name: string
          created_at?: string
          data_last_verified_at?: string | null
          exam_end?: string | null
          exam_start?: string | null
          id?: string
          institute_id: string
          registration_end?: string | null
          registration_start?: string | null
          semester?: number | null
          source_label?: string | null
          source_url?: string | null
          teaching_end?: string | null
          teaching_start?: string | null
          term_end?: string | null
          term_start?: string | null
          updated_at?: string
          vacation_end?: string | null
          vacation_start?: string | null
        }
        Update: {
          academic_year?: string
          calendar_name?: string
          created_at?: string
          data_last_verified_at?: string | null
          exam_end?: string | null
          exam_start?: string | null
          id?: string
          institute_id?: string
          registration_end?: string | null
          registration_start?: string | null
          semester?: number | null
          source_label?: string | null
          source_url?: string | null
          teaching_end?: string | null
          teaching_start?: string | null
          term_end?: string | null
          term_start?: string | null
          updated_at?: string
          vacation_end?: string | null
          vacation_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_academic_calendars_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_academic_conferences_participation: {
        Row: {
          award_or_recognition: string | null
          conference_name: string
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          faculty_or_student_name: string | null
          id: string
          institute_id: string
          official_url: string | null
          paper_title: string | null
          participation_role: string | null
          presentation_type: string | null
          publication_details: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          award_or_recognition?: string | null
          conference_name: string
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          faculty_or_student_name?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          paper_title?: string | null
          participation_role?: string | null
          presentation_type?: string | null
          publication_details?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          award_or_recognition?: string | null
          conference_name?: string
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          faculty_or_student_name?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          paper_title?: string | null
          participation_role?: string | null
          presentation_type?: string | null
          publication_details?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_academic_conferences_participation_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_academic_events: {
        Row: {
          academic_year: string | null
          applicable_programs: string[] | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          end_at: string | null
          event_name: string
          event_type: string | null
          id: string
          institute_id: string
          mandatory: boolean | null
          semester: number | null
          source_label: string | null
          source_url: string | null
          start_at: string | null
        }
        Insert: {
          academic_year?: string | null
          applicable_programs?: string[] | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          end_at?: string | null
          event_name: string
          event_type?: string | null
          id?: string
          institute_id: string
          mandatory?: boolean | null
          semester?: number | null
          source_label?: string | null
          source_url?: string | null
          start_at?: string | null
        }
        Update: {
          academic_year?: string | null
          applicable_programs?: string[] | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          end_at?: string | null
          event_name?: string
          event_type?: string | null
          id?: string
          institute_id?: string
          mandatory?: boolean | null
          semester?: number | null
          source_label?: string | null
          source_url?: string | null
          start_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_academic_events_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_academic_facilities: {
        Row: {
          accessibility_features: string | null
          area_unit: string | null
          area_value: number | null
          availability: string | null
          booking_required: boolean | null
          booking_url: string | null
          capacity: number | null
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          description: string | null
          eligibility: string | null
          equipment: string[] | null
          facility_name: string
          facility_type: string
          id: string
          institute_id: string
          location: string | null
          official_url: string | null
          operating_hours: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          accessibility_features?: string | null
          area_unit?: string | null
          area_value?: number | null
          availability?: string | null
          booking_required?: boolean | null
          booking_url?: string | null
          capacity?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          eligibility?: string | null
          equipment?: string[] | null
          facility_name: string
          facility_type: string
          id?: string
          institute_id: string
          location?: string | null
          official_url?: string | null
          operating_hours?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          accessibility_features?: string | null
          area_unit?: string | null
          area_value?: number | null
          availability?: string | null
          booking_required?: boolean | null
          booking_url?: string | null
          capacity?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          eligibility?: string | null
          equipment?: string[] | null
          facility_name?: string
          facility_type?: string
          id?: string
          institute_id?: string
          location?: string | null
          official_url?: string | null
          operating_hours?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_academic_facilities_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_academic_infrastructure_metrics: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_category: string
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          population: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_category: string
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_category?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_academic_infrastructure_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_academic_migration: {
        Row: {
          approval_authority: string | null
          created_at: string
          data_last_verified_at: string | null
          eligibility: string | null
          from_institute: string | null
          id: string
          institute_id: string
          migration_type: string
          process_summary: string | null
          program_name: string | null
          reason_category: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          student_count: number | null
          to_institute: string | null
          year: number
        }
        Insert: {
          approval_authority?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          eligibility?: string | null
          from_institute?: string | null
          id?: string
          institute_id: string
          migration_type: string
          process_summary?: string | null
          program_name?: string | null
          reason_category?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          student_count?: number | null
          to_institute?: string | null
          year: number
        }
        Update: {
          approval_authority?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          eligibility?: string | null
          from_institute?: string | null
          id?: string
          institute_id?: string
          migration_type?: string
          process_summary?: string | null
          program_name?: string | null
          reason_category?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          student_count?: number | null
          to_institute?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_academic_migration_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_academic_outcome_metrics: {
        Row: {
          cohort_year: number | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_category: string
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          population: string | null
          program_name: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          cohort_year?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_category: string
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          program_name?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          cohort_year?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_category?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          program_name?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_academic_outcome_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_academic_performance_trends: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          population: string | null
          program_name: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          program_name?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          program_name?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_academic_performance_trends_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_academic_programs: {
        Row: {
          academic_level: string | null
          accreditation: string | null
          active: boolean
          admission_exam: string | null
          admission_route: string | null
          counselling: string | null
          counselling_authority: string | null
          created_at: string
          curriculum_url: string | null
          data_last_verified_at: string | null
          data_verified_by: string | null
          degree: string | null
          degree_type: string | null
          department: string | null
          department_name: string | null
          department_url: string | null
          discipline: string | null
          discipline_group: string | null
          duration_months: number | null
          duration_years: number | null
          eligibility_min_percentage: number | null
          eligibility_min_qualification: string | null
          eligibility_notes: string | null
          eligibility_subjects: string | null
          eligibility_summary: string | null
          first_admission_year: number | null
          id: string
          institute_id: string
          intake_capacity: number | null
          last_updated_year: number | null
          mode: string | null
          program_code: string | null
          program_name: string
          program_page_url: string | null
          program_slug: string | null
          residential: boolean | null
          seats_total: number | null
          source_label: string | null
          source_url: string | null
          specialization: string | null
          syllabus_url: string | null
          updated_at: string
          year: number
        }
        Insert: {
          academic_level?: string | null
          accreditation?: string | null
          active?: boolean
          admission_exam?: string | null
          admission_route?: string | null
          counselling?: string | null
          counselling_authority?: string | null
          created_at?: string
          curriculum_url?: string | null
          data_last_verified_at?: string | null
          data_verified_by?: string | null
          degree?: string | null
          degree_type?: string | null
          department?: string | null
          department_name?: string | null
          department_url?: string | null
          discipline?: string | null
          discipline_group?: string | null
          duration_months?: number | null
          duration_years?: number | null
          eligibility_min_percentage?: number | null
          eligibility_min_qualification?: string | null
          eligibility_notes?: string | null
          eligibility_subjects?: string | null
          eligibility_summary?: string | null
          first_admission_year?: number | null
          id?: string
          institute_id: string
          intake_capacity?: number | null
          last_updated_year?: number | null
          mode?: string | null
          program_code?: string | null
          program_name: string
          program_page_url?: string | null
          program_slug?: string | null
          residential?: boolean | null
          seats_total?: number | null
          source_label?: string | null
          source_url?: string | null
          specialization?: string | null
          syllabus_url?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          academic_level?: string | null
          accreditation?: string | null
          active?: boolean
          admission_exam?: string | null
          admission_route?: string | null
          counselling?: string | null
          counselling_authority?: string | null
          created_at?: string
          curriculum_url?: string | null
          data_last_verified_at?: string | null
          data_verified_by?: string | null
          degree?: string | null
          degree_type?: string | null
          department?: string | null
          department_name?: string | null
          department_url?: string | null
          discipline?: string | null
          discipline_group?: string | null
          duration_months?: number | null
          duration_years?: number | null
          eligibility_min_percentage?: number | null
          eligibility_min_qualification?: string | null
          eligibility_notes?: string | null
          eligibility_subjects?: string | null
          eligibility_summary?: string | null
          first_admission_year?: number | null
          id?: string
          institute_id?: string
          intake_capacity?: number | null
          last_updated_year?: number | null
          mode?: string | null
          program_code?: string | null
          program_name?: string
          program_page_url?: string | null
          program_slug?: string | null
          residential?: boolean | null
          seats_total?: number | null
          source_label?: string | null
          source_url?: string | null
          specialization?: string | null
          syllabus_url?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_academic_programs_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_academic_progression: {
        Row: {
          academic_dismissal_count: number | null
          cohort_year: number | null
          created_at: string
          data_last_verified_at: string | null
          dropout_count: number | null
          dropout_rate: number | null
          enrolled_count: number | null
          graduated_count: number | null
          graduation_rate: number | null
          id: string
          institute_id: string
          intake_count: number | null
          methodology: string | null
          program_name: string | null
          progression_rate: number | null
          promoted_count: number | null
          source_label: string | null
          source_url: string | null
          transfer_count: number | null
          updated_at: string
          year: number
        }
        Insert: {
          academic_dismissal_count?: number | null
          cohort_year?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          dropout_count?: number | null
          dropout_rate?: number | null
          enrolled_count?: number | null
          graduated_count?: number | null
          graduation_rate?: number | null
          id?: string
          institute_id: string
          intake_count?: number | null
          methodology?: string | null
          program_name?: string | null
          progression_rate?: number | null
          promoted_count?: number | null
          source_label?: string | null
          source_url?: string | null
          transfer_count?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          academic_dismissal_count?: number | null
          cohort_year?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          dropout_count?: number | null
          dropout_rate?: number | null
          enrolled_count?: number | null
          graduated_count?: number | null
          graduation_rate?: number | null
          id?: string
          institute_id?: string
          intake_count?: number | null
          methodology?: string | null
          program_name?: string | null
          progression_rate?: number | null
          promoted_count?: number | null
          source_label?: string | null
          source_url?: string | null
          transfer_count?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_academic_progression_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_academic_regulations: {
        Row: {
          applicable_programs: string[] | null
          created_at: string
          data_last_verified_at: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          institute_id: string
          regulation_name: string
          regulation_type: string | null
          rule_text: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          applicable_programs?: string[] | null
          created_at?: string
          data_last_verified_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          institute_id: string
          regulation_name: string
          regulation_type?: string | null
          rule_text?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          applicable_programs?: string[] | null
          created_at?: string
          data_last_verified_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          institute_id?: string
          regulation_name?: string
          regulation_type?: string | null
          rule_text?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_academic_regulations_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_academic_resource_access: {
        Row: {
          access_scope: string | null
          access_url: string | null
          authentication_method: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          eligibility: string | null
          id: string
          institute_id: string
          provider: string | null
          resource_name: string
          resource_type: string | null
          source_label: string | null
          source_url: string | null
          subscription_status: string | null
          updated_at: string
          validity_end: string | null
          validity_start: string | null
          year: number | null
        }
        Insert: {
          access_scope?: string | null
          access_url?: string | null
          authentication_method?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          eligibility?: string | null
          id?: string
          institute_id: string
          provider?: string | null
          resource_name: string
          resource_type?: string | null
          source_label?: string | null
          source_url?: string | null
          subscription_status?: string | null
          updated_at?: string
          validity_end?: string | null
          validity_start?: string | null
          year?: number | null
        }
        Update: {
          access_scope?: string | null
          access_url?: string | null
          authentication_method?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          eligibility?: string | null
          id?: string
          institute_id?: string
          provider?: string | null
          resource_name?: string
          resource_type?: string | null
          source_label?: string | null
          source_url?: string | null
          subscription_status?: string | null
          updated_at?: string
          validity_end?: string | null
          validity_start?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_academic_resource_access_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_accessibility_infrastructure: {
        Row: {
          accessibility_standard: string | null
          accessibility_type: string
          assistive_technology: string | null
          available: boolean | null
          contact_office: string | null
          created_at: string
          data_last_verified_at: string | null
          details: string | null
          facility_name: string
          id: string
          institute_id: string
          location: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          accessibility_standard?: string | null
          accessibility_type: string
          assistive_technology?: string | null
          available?: boolean | null
          contact_office?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          details?: string | null
          facility_name: string
          id?: string
          institute_id: string
          location?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          accessibility_standard?: string | null
          accessibility_type?: string
          assistive_technology?: string | null
          available?: boolean | null
          contact_office?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          details?: string | null
          facility_name?: string
          id?: string
          institute_id?: string
          location?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_accessibility_infrastructure_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_accessibility_services: {
        Row: {
          accessibility_type: string
          availability: boolean | null
          contact_office: string | null
          created_at: string
          data_last_verified_at: string | null
          details: string | null
          eligibility: string | null
          facility_or_service: string
          id: string
          institute_id: string
          location: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          accessibility_type: string
          availability?: boolean | null
          contact_office?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          details?: string | null
          eligibility?: string | null
          facility_or_service: string
          id?: string
          institute_id: string
          location?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          accessibility_type?: string
          availability?: boolean | null
          contact_office?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          details?: string | null
          eligibility?: string | null
          facility_or_service?: string
          id?: string
          institute_id?: string
          location?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_accessibility_services_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_accreditation_history: {
        Row: {
          accreditation_body: string
          accreditation_name: string | null
          certificate_number: string | null
          created_at: string
          data_last_verified_at: string | null
          grade: string | null
          id: string
          institute_id: string
          programs: string[] | null
          scope: string | null
          score: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          status: string | null
          valid_from: string | null
          valid_until: string | null
          year: number
        }
        Insert: {
          accreditation_body: string
          accreditation_name?: string | null
          certificate_number?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          grade?: string | null
          id?: string
          institute_id: string
          programs?: string[] | null
          scope?: string | null
          score?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          valid_from?: string | null
          valid_until?: string | null
          year: number
        }
        Update: {
          accreditation_body?: string
          accreditation_name?: string | null
          certificate_number?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          grade?: string | null
          id?: string
          institute_id?: string
          programs?: string[] | null
          scope?: string | null
          score?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          valid_from?: string | null
          valid_until?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_accreditation_history_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_accreditations: {
        Row: {
          accreditation_body: string
          accreditation_name: string | null
          applicable_programs: string[] | null
          certificate_number: string | null
          created_at: string
          data_last_verified_at: string | null
          grade: string | null
          id: string
          institute_id: string
          official_url: string | null
          scope: string | null
          score: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          status: string | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          year: number | null
        }
        Insert: {
          accreditation_body: string
          accreditation_name?: string | null
          applicable_programs?: string[] | null
          certificate_number?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          grade?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          scope?: string | null
          score?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          year?: number | null
        }
        Update: {
          accreditation_body?: string
          accreditation_name?: string | null
          applicable_programs?: string[] | null
          certificate_number?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          grade?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          scope?: string | null
          score?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_accreditations_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_administrative_offices: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          department: string | null
          designation: string | null
          email: string | null
          head_name: string | null
          id: string
          institute_id: string
          office_hours: string | null
          office_location: string | null
          office_name: string
          office_type: string
          official_url: string | null
          phone: string | null
          responsibilities: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          head_name?: string | null
          id?: string
          institute_id: string
          office_hours?: string | null
          office_location?: string | null
          office_name: string
          office_type: string
          official_url?: string | null
          phone?: string | null
          responsibilities?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          head_name?: string | null
          id?: string
          institute_id?: string
          office_hours?: string | null
          office_location?: string | null
          office_name?: string
          office_type?: string
          official_url?: string | null
          phone?: string | null
          responsibilities?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_administrative_offices_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_admission_demand_metrics: {
        Row: {
          accepted_seats: number | null
          admission_rate: number | null
          applicants_count: number | null
          category: string | null
          choice_count: number | null
          counselling: string | null
          created_at: string
          data_last_verified_at: string | null
          demand_ratio: number | null
          eligible_count: number | null
          enrolled_count: number | null
          enrollment_rate: number | null
          gender: string | null
          id: string
          institute_id: string
          methodology: string | null
          offered_seats: number | null
          program_name: string | null
          quota: string | null
          registered_count: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number
        }
        Insert: {
          accepted_seats?: number | null
          admission_rate?: number | null
          applicants_count?: number | null
          category?: string | null
          choice_count?: number | null
          counselling?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          demand_ratio?: number | null
          eligible_count?: number | null
          enrolled_count?: number | null
          enrollment_rate?: number | null
          gender?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          offered_seats?: number | null
          program_name?: string | null
          quota?: string | null
          registered_count?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          accepted_seats?: number | null
          admission_rate?: number | null
          applicants_count?: number | null
          category?: string | null
          choice_count?: number | null
          counselling?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          demand_ratio?: number | null
          eligible_count?: number | null
          enrolled_count?: number | null
          enrollment_rate?: number | null
          gender?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          offered_seats?: number | null
          program_name?: string | null
          quota?: string | null
          registered_count?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_admission_demand_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_admission_demand_trends: {
        Row: {
          category: string | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          program_name: string | null
          quota: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          program_name?: string | null
          quota?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          category?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          program_name?: string | null
          quota?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_admission_demand_trends_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_admission_documents: {
        Row: {
          applicable_categories: string | null
          counselling: string
          created_at: string
          data_last_verified_at: string | null
          document_code: string
          document_name: string
          id: string
          issuing_authority: string | null
          mandatory_for: string | null
          replacement_or_alternative: string | null
          source_label: string | null
          source_url: string | null
          validity_rule: string | null
          year: number
        }
        Insert: {
          applicable_categories?: string | null
          counselling: string
          created_at?: string
          data_last_verified_at?: string | null
          document_code: string
          document_name: string
          id?: string
          issuing_authority?: string | null
          mandatory_for?: string | null
          replacement_or_alternative?: string | null
          source_label?: string | null
          source_url?: string | null
          validity_rule?: string | null
          year: number
        }
        Update: {
          applicable_categories?: string | null
          counselling?: string
          created_at?: string
          data_last_verified_at?: string | null
          document_code?: string
          document_name?: string
          id?: string
          issuing_authority?: string | null
          mandatory_for?: string | null
          replacement_or_alternative?: string | null
          source_label?: string | null
          source_url?: string | null
          validity_rule?: string | null
          year?: number
        }
        Relationships: []
      }
      jee_admission_rules: {
        Row: {
          admission_exam: string | null
          age_rule: string | null
          attempt_rule: string | null
          candidate_category: string | null
          certificate_requirement: string | null
          counselling: string
          created_at: string
          data_last_verified_at: string | null
          domicile_state: string | null
          effective_from: string | null
          effective_to: string | null
          gender: string | null
          id: string
          institute_id: string | null
          minimum_exam_requirement: string | null
          minimum_percentage: number | null
          nationality: string | null
          preparatory_course_eligible: boolean | null
          program_id: string | null
          pwd_requirement: string | null
          qualification_requirement: string | null
          quota: string | null
          rank_max: number | null
          rank_min: number | null
          rank_requirement_type: string | null
          rule_text: string | null
          rule_type: string
          source_document: string | null
          source_label: string | null
          source_url: string | null
          special_condition: string | null
          subject_requirement: string | null
          top_percentile_required: number | null
          updated_at: string
          year: number
        }
        Insert: {
          admission_exam?: string | null
          age_rule?: string | null
          attempt_rule?: string | null
          candidate_category?: string | null
          certificate_requirement?: string | null
          counselling: string
          created_at?: string
          data_last_verified_at?: string | null
          domicile_state?: string | null
          effective_from?: string | null
          effective_to?: string | null
          gender?: string | null
          id?: string
          institute_id?: string | null
          minimum_exam_requirement?: string | null
          minimum_percentage?: number | null
          nationality?: string | null
          preparatory_course_eligible?: boolean | null
          program_id?: string | null
          pwd_requirement?: string | null
          qualification_requirement?: string | null
          quota?: string | null
          rank_max?: number | null
          rank_min?: number | null
          rank_requirement_type?: string | null
          rule_text?: string | null
          rule_type: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          special_condition?: string | null
          subject_requirement?: string | null
          top_percentile_required?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          admission_exam?: string | null
          age_rule?: string | null
          attempt_rule?: string | null
          candidate_category?: string | null
          certificate_requirement?: string | null
          counselling?: string
          created_at?: string
          data_last_verified_at?: string | null
          domicile_state?: string | null
          effective_from?: string | null
          effective_to?: string | null
          gender?: string | null
          id?: string
          institute_id?: string | null
          minimum_exam_requirement?: string | null
          minimum_percentage?: number | null
          nationality?: string | null
          preparatory_course_eligible?: boolean | null
          program_id?: string | null
          pwd_requirement?: string | null
          qualification_requirement?: string | null
          quota?: string | null
          rank_max?: number | null
          rank_min?: number | null
          rank_requirement_type?: string | null
          rule_text?: string | null
          rule_type?: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          special_condition?: string | null
          subject_requirement?: string | null
          top_percentile_required?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_admission_rules_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_admission_rules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_admission_statistics_history: {
        Row: {
          admission_rate: number | null
          admitted_count: number | null
          applicants_count: number | null
          category: string | null
          created_at: string
          data_last_verified_at: string | null
          enrolled_count: number | null
          enrollment_rate: number | null
          id: string
          institute_id: string
          intake_capacity: number | null
          program_name: string | null
          quota: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          admission_rate?: number | null
          admitted_count?: number | null
          applicants_count?: number | null
          category?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          enrolled_count?: number | null
          enrollment_rate?: number | null
          id?: string
          institute_id: string
          intake_capacity?: number | null
          program_name?: string | null
          quota?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          admission_rate?: number | null
          admitted_count?: number | null
          applicants_count?: number | null
          category?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          enrolled_count?: number | null
          enrollment_rate?: number | null
          id?: string
          institute_id?: string
          intake_capacity?: number | null
          program_name?: string | null
          quota?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_admission_statistics_history_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_aid_documents: {
        Row: {
          acceptable_alternatives: string | null
          aid_id: string
          created_at: string
          data_last_verified_at: string | null
          document_name: string
          format_requirement: string | null
          id: string
          issuing_authority: string | null
          notes: string | null
          required_for: string | null
          source_label: string | null
          source_url: string | null
          validity_period: string | null
        }
        Insert: {
          acceptable_alternatives?: string | null
          aid_id: string
          created_at?: string
          data_last_verified_at?: string | null
          document_name: string
          format_requirement?: string | null
          id?: string
          issuing_authority?: string | null
          notes?: string | null
          required_for?: string | null
          source_label?: string | null
          source_url?: string | null
          validity_period?: string | null
        }
        Update: {
          acceptable_alternatives?: string | null
          aid_id?: string
          created_at?: string
          data_last_verified_at?: string | null
          document_name?: string
          format_requirement?: string | null
          id?: string
          issuing_authority?: string | null
          notes?: string | null
          required_for?: string | null
          source_label?: string | null
          source_url?: string | null
          validity_period?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_aid_documents_aid_id_fkey"
            columns: ["aid_id"]
            isOneToOne: false
            referencedRelation: "jee_financial_aid_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_aid_eligibility_rules: {
        Row: {
          aid_id: string
          category: string | null
          condition_description: string | null
          condition_type: string
          created_at: string
          data_last_verified_at: string | null
          id: string
          mandatory: boolean
          operator: string | null
          rule_order: number | null
          source_label: string | null
          source_url: string | null
          value_numeric: number | null
          value_text: string | null
          year: number
        }
        Insert: {
          aid_id: string
          category?: string | null
          condition_description?: string | null
          condition_type: string
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          mandatory?: boolean
          operator?: string | null
          rule_order?: number | null
          source_label?: string | null
          source_url?: string | null
          value_numeric?: number | null
          value_text?: string | null
          year: number
        }
        Update: {
          aid_id?: string
          category?: string | null
          condition_description?: string | null
          condition_type?: string
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          mandatory?: boolean
          operator?: string | null
          rule_order?: number | null
          source_label?: string | null
          source_url?: string | null
          value_numeric?: number | null
          value_text?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_aid_eligibility_rules_aid_id_fkey"
            columns: ["aid_id"]
            isOneToOne: false
            referencedRelation: "jee_financial_aid_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_aid_renewal_rules: {
        Row: {
          academic_backlog_limit: number | null
          aid_id: string
          continuation_text: string | null
          created_at: string
          data_last_verified_at: string | null
          disciplinary_condition: string | null
          document_reverification: boolean | null
          id: string
          income_reverification: boolean | null
          minimum_attendance: number | null
          minimum_cgpa: number | null
          minimum_percentage: number | null
          renewal_deadline: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          academic_backlog_limit?: number | null
          aid_id: string
          continuation_text?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          disciplinary_condition?: string | null
          document_reverification?: boolean | null
          id?: string
          income_reverification?: boolean | null
          minimum_attendance?: number | null
          minimum_cgpa?: number | null
          minimum_percentage?: number | null
          renewal_deadline?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          academic_backlog_limit?: number | null
          aid_id?: string
          continuation_text?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          disciplinary_condition?: string | null
          document_reverification?: boolean | null
          id?: string
          income_reverification?: boolean | null
          minimum_attendance?: number | null
          minimum_cgpa?: number | null
          minimum_percentage?: number | null
          renewal_deadline?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_aid_renewal_rules_aid_id_fkey"
            columns: ["aid_id"]
            isOneToOne: false
            referencedRelation: "jee_financial_aid_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_alumni_achievements: {
        Row: {
          achievement_type: string
          alumni_id: string | null
          award_body: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          id: string
          institute_id: string
          official_url: string | null
          organization: string | null
          source_label: string | null
          source_url: string | null
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          achievement_type: string
          alumni_id?: string | null
          award_body?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          organization?: string | null
          source_label?: string | null
          source_url?: string | null
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          achievement_type?: string
          alumni_id?: string | null
          award_body?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          organization?: string | null
          source_label?: string | null
          source_url?: string | null
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_alumni_achievements_alumni_id_fkey"
            columns: ["alumni_id"]
            isOneToOne: false
            referencedRelation: "jee_alumni_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_alumni_achievements_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_alumni_engagement: {
        Row: {
          activity_name: string
          activity_type: string
          contact_email: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          eligibility: string | null
          event_date: string | null
          id: string
          institute_id: string
          registration_url: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          activity_name: string
          activity_type: string
          contact_email?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          eligibility?: string | null
          event_date?: string | null
          id?: string
          institute_id: string
          registration_url?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          activity_name?: string
          activity_type?: string
          contact_email?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          eligibility?: string | null
          event_date?: string | null
          id?: string
          institute_id?: string
          registration_url?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_alumni_engagement_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_alumni_entrepreneurship: {
        Row: {
          alumni_id: string | null
          company_name: string
          company_url: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          description: string | null
          employee_count: number | null
          founded_year: number | null
          funding_amount: number | null
          funding_stage: string | null
          headquarters: string | null
          id: string
          institute_id: string
          public_valuation: number | null
          sector: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          alumni_id?: string | null
          company_name: string
          company_url?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          description?: string | null
          employee_count?: number | null
          founded_year?: number | null
          funding_amount?: number | null
          funding_stage?: string | null
          headquarters?: string | null
          id?: string
          institute_id: string
          public_valuation?: number | null
          sector?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          alumni_id?: string | null
          company_name?: string
          company_url?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          description?: string | null
          employee_count?: number | null
          founded_year?: number | null
          funding_amount?: number | null
          funding_stage?: string | null
          headquarters?: string | null
          id?: string
          institute_id?: string
          public_valuation?: number | null
          sector?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_alumni_entrepreneurship_alumni_id_fkey"
            columns: ["alumni_id"]
            isOneToOne: false
            referencedRelation: "jee_alumni_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_alumni_entrepreneurship_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_alumni_higher_studies: {
        Row: {
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          degree_type: string | null
          destination_country: string | null
          destination_institution: string
          field_of_study: string | null
          id: string
          institute_id: string
          program_name: string | null
          scholarship_amount: number | null
          scholarship_name: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          degree_type?: string | null
          destination_country?: string | null
          destination_institution: string
          field_of_study?: string | null
          id?: string
          institute_id: string
          program_name?: string | null
          scholarship_amount?: number | null
          scholarship_name?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          degree_type?: string | null
          destination_country?: string | null
          destination_institution?: string
          field_of_study?: string | null
          id?: string
          institute_id?: string
          program_name?: string | null
          scholarship_amount?: number | null
          scholarship_name?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_alumni_higher_studies_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_alumni_networks: {
        Row: {
          activities: string | null
          benefits: string | null
          chapters_count: number | null
          countries_count: number | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          member_count: number | null
          membership_scope: string | null
          network_name: string
          network_type: string | null
          official_url: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          activities?: string | null
          benefits?: string | null
          chapters_count?: number | null
          countries_count?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          member_count?: number | null
          membership_scope?: string | null
          network_name: string
          network_type?: string | null
          official_url?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          activities?: string | null
          benefits?: string | null
          chapters_count?: number | null
          countries_count?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          member_count?: number | null
          membership_scope?: string | null
          network_name?: string
          network_type?: string | null
          official_url?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_alumni_networks_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_alumni_outcomes: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          employment_count: number | null
          employment_country: string | null
          entrepreneurship_count: number | null
          higher_study_count: number | null
          id: string
          industry: string | null
          institute_id: string
          other_outcome_count: number | null
          program_name: string | null
          public_service_count: number | null
          role_category: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          employment_count?: number | null
          employment_country?: string | null
          entrepreneurship_count?: number | null
          higher_study_count?: number | null
          id?: string
          industry?: string | null
          institute_id: string
          other_outcome_count?: number | null
          program_name?: string | null
          public_service_count?: number | null
          role_category?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          employment_count?: number | null
          employment_country?: string | null
          entrepreneurship_count?: number | null
          higher_study_count?: number | null
          id?: string
          industry?: string | null
          institute_id?: string
          other_outcome_count?: number | null
          program_name?: string | null
          public_service_count?: number | null
          role_category?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_alumni_outcomes_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_alumni_profiles: {
        Row: {
          alumni_name: string
          city: string | null
          country: string | null
          created_at: string
          current_organization: string | null
          current_title: string | null
          data_last_verified_at: string | null
          degree: string | null
          graduation_year: number | null
          id: string
          industry: string | null
          institute_id: string
          linkedin_url: string | null
          notable_achievement: string | null
          profile_url: string | null
          program_name: string | null
          public_bio: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          alumni_name: string
          city?: string | null
          country?: string | null
          created_at?: string
          current_organization?: string | null
          current_title?: string | null
          data_last_verified_at?: string | null
          degree?: string | null
          graduation_year?: number | null
          id?: string
          industry?: string | null
          institute_id: string
          linkedin_url?: string | null
          notable_achievement?: string | null
          profile_url?: string | null
          program_name?: string | null
          public_bio?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          alumni_name?: string
          city?: string | null
          country?: string | null
          created_at?: string
          current_organization?: string | null
          current_title?: string | null
          data_last_verified_at?: string | null
          degree?: string | null
          graduation_year?: number | null
          id?: string
          industry?: string | null
          institute_id?: string
          linkedin_url?: string | null
          notable_achievement?: string | null
          profile_url?: string | null
          program_name?: string | null
          public_bio?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_alumni_profiles_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_applicant_profile_metrics: {
        Row: {
          category: string | null
          counselling: string | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string | null
          methodology: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          population: string | null
          program_name: string | null
          quota: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          category?: string | null
          counselling?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string | null
          methodology?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          program_name?: string | null
          quota?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          category?: string | null
          counselling?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string | null
          methodology?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          program_name?: string | null
          quota?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_applicant_profile_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_application_corrections: {
        Row: {
          correction_fee: number | null
          correction_field: string
          correction_window: string | null
          counselling: string
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          editable: boolean | null
          id: string
          notes: string | null
          source_label: string | null
          source_url: string | null
          supporting_document_required: boolean | null
          year: number
        }
        Insert: {
          correction_fee?: number | null
          correction_field: string
          correction_window?: string | null
          counselling: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          editable?: boolean | null
          id?: string
          notes?: string | null
          source_label?: string | null
          source_url?: string | null
          supporting_document_required?: boolean | null
          year: number
        }
        Update: {
          correction_fee?: number | null
          correction_field?: string
          correction_window?: string | null
          counselling?: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          editable?: boolean | null
          id?: string
          notes?: string | null
          source_label?: string | null
          source_url?: string | null
          supporting_document_required?: boolean | null
          year?: number
        }
        Relationships: []
      }
      jee_application_documents: {
        Row: {
          acceptable_format: string | null
          alternative_documents: string[] | null
          applicable_categories: string[] | null
          applicable_quota: string[] | null
          counselling: string | null
          created_at: string
          data_last_verified_at: string | null
          digital_copy_allowed: boolean | null
          document_code: string
          document_name: string
          id: string
          issuing_authority: string | null
          mandatory: boolean | null
          original_required: boolean | null
          source_label: string | null
          source_url: string | null
          validity_rule: string | null
          verification_stage: string | null
          year: number
        }
        Insert: {
          acceptable_format?: string | null
          alternative_documents?: string[] | null
          applicable_categories?: string[] | null
          applicable_quota?: string[] | null
          counselling?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          digital_copy_allowed?: boolean | null
          document_code: string
          document_name: string
          id?: string
          issuing_authority?: string | null
          mandatory?: boolean | null
          original_required?: boolean | null
          source_label?: string | null
          source_url?: string | null
          validity_rule?: string | null
          verification_stage?: string | null
          year: number
        }
        Update: {
          acceptable_format?: string | null
          alternative_documents?: string[] | null
          applicable_categories?: string[] | null
          applicable_quota?: string[] | null
          counselling?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          digital_copy_allowed?: boolean | null
          document_code?: string
          document_name?: string
          id?: string
          issuing_authority?: string | null
          mandatory?: boolean | null
          original_required?: boolean | null
          source_label?: string | null
          source_url?: string | null
          validity_rule?: string | null
          verification_stage?: string | null
          year?: number
        }
        Relationships: []
      }
      jee_application_fees: {
        Row: {
          amount: number | null
          candidate_category: string | null
          counselling: string
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          fee_type: string
          id: string
          notes: string | null
          payment_deadline: string | null
          payment_methods: string[] | null
          quota: string | null
          refundable: boolean | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          amount?: number | null
          candidate_category?: string | null
          counselling: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          fee_type: string
          id?: string
          notes?: string | null
          payment_deadline?: string | null
          payment_methods?: string[] | null
          quota?: string | null
          refundable?: boolean | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          amount?: number | null
          candidate_category?: string | null
          counselling?: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          fee_type?: string
          id?: string
          notes?: string | null
          payment_deadline?: string | null
          payment_methods?: string[] | null
          quota?: string | null
          refundable?: boolean | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: []
      }
      jee_application_status_rules: {
        Row: {
          consequence_if_missed: string | null
          counselling: string
          created_at: string
          data_last_verified_at: string | null
          deadline_rule: string | null
          id: string
          meaning: string | null
          next_action: string | null
          source_label: string | null
          source_url: string | null
          status_code: string
          status_name: string
          year: number
        }
        Insert: {
          consequence_if_missed?: string | null
          counselling: string
          created_at?: string
          data_last_verified_at?: string | null
          deadline_rule?: string | null
          id?: string
          meaning?: string | null
          next_action?: string | null
          source_label?: string | null
          source_url?: string | null
          status_code: string
          status_name: string
          year: number
        }
        Update: {
          consequence_if_missed?: string | null
          counselling?: string
          created_at?: string
          data_last_verified_at?: string | null
          deadline_rule?: string | null
          id?: string
          meaning?: string | null
          next_action?: string | null
          source_label?: string | null
          source_url?: string | null
          status_code?: string
          status_name?: string
          year?: number
        }
        Relationships: []
      }
      jee_application_steps: {
        Row: {
          application_window_id: string | null
          completion_url: string | null
          created_at: string
          description: string | null
          document_requirements: string[] | null
          fee_required: boolean | null
          id: string
          mandatory: boolean | null
          source_label: string | null
          source_url: string | null
          step_name: string
          step_order: number
          verification_required: boolean | null
        }
        Insert: {
          application_window_id?: string | null
          completion_url?: string | null
          created_at?: string
          description?: string | null
          document_requirements?: string[] | null
          fee_required?: boolean | null
          id?: string
          mandatory?: boolean | null
          source_label?: string | null
          source_url?: string | null
          step_name: string
          step_order: number
          verification_required?: boolean | null
        }
        Update: {
          application_window_id?: string | null
          completion_url?: string | null
          created_at?: string
          description?: string | null
          document_requirements?: string[] | null
          fee_required?: boolean | null
          id?: string
          mandatory?: boolean | null
          source_label?: string | null
          source_url?: string | null
          step_name?: string
          step_order?: number
          verification_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_application_steps_application_window_id_fkey"
            columns: ["application_window_id"]
            isOneToOne: false
            referencedRelation: "jee_application_windows"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_application_windows: {
        Row: {
          applicable_institute_types: string[] | null
          application_name: string
          application_type: string | null
          correction_end_at: string | null
          correction_start_at: string | null
          counselling: string
          created_at: string
          data_last_verified_at: string | null
          eligible_categories: string[] | null
          end_at: string | null
          fee_amount: number | null
          fee_currency: string | null
          fee_notes: string | null
          id: string
          official_url: string | null
          source_label: string | null
          source_url: string | null
          start_at: string | null
          updated_at: string
          year: number
        }
        Insert: {
          applicable_institute_types?: string[] | null
          application_name: string
          application_type?: string | null
          correction_end_at?: string | null
          correction_start_at?: string | null
          counselling: string
          created_at?: string
          data_last_verified_at?: string | null
          eligible_categories?: string[] | null
          end_at?: string | null
          fee_amount?: number | null
          fee_currency?: string | null
          fee_notes?: string | null
          id?: string
          official_url?: string | null
          source_label?: string | null
          source_url?: string | null
          start_at?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          applicable_institute_types?: string[] | null
          application_name?: string
          application_type?: string | null
          correction_end_at?: string | null
          correction_start_at?: string | null
          counselling?: string
          created_at?: string
          data_last_verified_at?: string | null
          eligible_categories?: string[] | null
          end_at?: string | null
          fee_amount?: number | null
          fee_currency?: string | null
          fee_notes?: string | null
          id?: string
          official_url?: string | null
          source_label?: string | null
          source_url?: string | null
          start_at?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      jee_attendance_rules: {
        Row: {
          attendance_calculation: string | null
          attendance_type: string
          condonation_rule: string | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          medical_exception_rule: string | null
          minimum_percentage: number | null
          program_name: string | null
          shortage_consequence: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          attendance_calculation?: string | null
          attendance_type: string
          condonation_rule?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          medical_exception_rule?: string | null
          minimum_percentage?: number | null
          program_name?: string | null
          shortage_consequence?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          attendance_calculation?: string | null
          attendance_type?: string
          condonation_rule?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          medical_exception_rule?: string | null
          minimum_percentage?: number | null
          program_name?: string | null
          shortage_consequence?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_attendance_rules_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_backlog_items: {
        Row: {
          chapter_id: string | null
          completed_minutes: number
          created_at: string
          deadline: string | null
          estimated_minutes: number
          id: string
          notes: string | null
          priority: string
          status: string
          subject: string
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          completed_minutes?: number
          created_at?: string
          deadline?: string | null
          estimated_minutes?: number
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          subject: string
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          completed_minutes?: number
          created_at?: string
          deadline?: string | null
          estimated_minutes?: number
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          subject?: string
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_backlog_items_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_backlog_items_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_campus_data: {
        Row: {
          accessibility_details: string | null
          campus_area_acres: number | null
          campus_type: string | null
          created_at: string
          gym_details: string | null
          hostel_details: string | null
          id: string
          institute_id: string
          internet_details: string | null
          library_details: string | null
          medical_details: string | null
          mess_details: string | null
          nearby_airport: string | null
          nearby_city: string | null
          nearby_railway_station: string | null
          security_details: string | null
          source_label: string | null
          source_url: string | null
          sports_details: string | null
          transport_details: string | null
          updated_at: string
        }
        Insert: {
          accessibility_details?: string | null
          campus_area_acres?: number | null
          campus_type?: string | null
          created_at?: string
          gym_details?: string | null
          hostel_details?: string | null
          id?: string
          institute_id: string
          internet_details?: string | null
          library_details?: string | null
          medical_details?: string | null
          mess_details?: string | null
          nearby_airport?: string | null
          nearby_city?: string | null
          nearby_railway_station?: string | null
          security_details?: string | null
          source_label?: string | null
          source_url?: string | null
          sports_details?: string | null
          transport_details?: string | null
          updated_at?: string
        }
        Update: {
          accessibility_details?: string | null
          campus_area_acres?: number | null
          campus_type?: string | null
          created_at?: string
          gym_details?: string | null
          hostel_details?: string | null
          id?: string
          institute_id?: string
          internet_details?: string | null
          library_details?: string | null
          medical_details?: string | null
          mess_details?: string | null
          nearby_airport?: string | null
          nearby_city?: string | null
          nearby_railway_station?: string | null
          security_details?: string | null
          source_label?: string | null
          source_url?: string | null
          sports_details?: string | null
          transport_details?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_campus_data_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: true
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_campus_dining: {
        Row: {
          created_at: string
          cuisine_types: string[] | null
          data_last_verified_at: string | null
          delivery_available: boolean | null
          description: string | null
          dietary_options: string[] | null
          id: string
          institute_id: string
          location: string | null
          official_url: string | null
          opening_hours: string | null
          operator_name: string | null
          outlet_name: string
          outlet_type: string | null
          payment_methods: string[] | null
          price_range: string | null
          seating_capacity: number | null
          source_label: string | null
          source_url: string | null
          student_discount: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          cuisine_types?: string[] | null
          data_last_verified_at?: string | null
          delivery_available?: boolean | null
          description?: string | null
          dietary_options?: string[] | null
          id?: string
          institute_id: string
          location?: string | null
          official_url?: string | null
          opening_hours?: string | null
          operator_name?: string | null
          outlet_name: string
          outlet_type?: string | null
          payment_methods?: string[] | null
          price_range?: string | null
          seating_capacity?: number | null
          source_label?: string | null
          source_url?: string | null
          student_discount?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          cuisine_types?: string[] | null
          data_last_verified_at?: string | null
          delivery_available?: boolean | null
          description?: string | null
          dietary_options?: string[] | null
          id?: string
          institute_id?: string
          location?: string | null
          official_url?: string | null
          opening_hours?: string | null
          operator_name?: string | null
          outlet_name?: string
          outlet_type?: string | null
          payment_methods?: string[] | null
          price_range?: string | null
          seating_capacity?: number | null
          source_label?: string | null
          source_url?: string | null
          student_discount?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_campus_dining_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_campus_facilities: {
        Row: {
          accessibility: string | null
          amenities: string | null
          availability: string | null
          capacity: number | null
          contact_info: string | null
          created_at: string
          data_last_verified_at: string | null
          department_or_location: string | null
          facility_name: string
          facility_type: string
          id: string
          institute_id: string | null
          operating_hours: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          accessibility?: string | null
          amenities?: string | null
          availability?: string | null
          capacity?: number | null
          contact_info?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          department_or_location?: string | null
          facility_name: string
          facility_type: string
          id?: string
          institute_id?: string | null
          operating_hours?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          accessibility?: string | null
          amenities?: string | null
          availability?: string | null
          capacity?: number | null
          contact_info?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          department_or_location?: string | null
          facility_name?: string
          facility_type?: string
          id?: string
          institute_id?: string | null
          operating_hours?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_campus_facilities_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_campus_networks: {
        Row: {
          access_method: string | null
          authentication: string | null
          bandwidth: string | null
          coverage_area: string | null
          created_at: string
          data_last_verified_at: string | null
          guest_access: boolean | null
          hostel_access: boolean | null
          id: string
          institute_id: string
          network_name: string | null
          network_type: string
          official_url: string | null
          provider: string | null
          security_features: string[] | null
          source_label: string | null
          source_url: string | null
          student_access: boolean | null
          uptime_percentage: number | null
          user_capacity: number | null
          year: number
        }
        Insert: {
          access_method?: string | null
          authentication?: string | null
          bandwidth?: string | null
          coverage_area?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          guest_access?: boolean | null
          hostel_access?: boolean | null
          id?: string
          institute_id: string
          network_name?: string | null
          network_type: string
          official_url?: string | null
          provider?: string | null
          security_features?: string[] | null
          source_label?: string | null
          source_url?: string | null
          student_access?: boolean | null
          uptime_percentage?: number | null
          user_capacity?: number | null
          year: number
        }
        Update: {
          access_method?: string | null
          authentication?: string | null
          bandwidth?: string | null
          coverage_area?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          guest_access?: boolean | null
          hostel_access?: boolean | null
          id?: string
          institute_id?: string
          network_name?: string | null
          network_type?: string
          official_url?: string | null
          provider?: string | null
          security_features?: string[] | null
          source_label?: string | null
          source_url?: string | null
          student_access?: boolean | null
          uptime_percentage?: number | null
          user_capacity?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_campus_networks_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_campus_safety_accessibility: {
        Row: {
          available: boolean | null
          created_at: string
          data_last_verified_at: string | null
          details: string | null
          feature_name: string
          feature_type: string
          id: string
          institute_id: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          available?: boolean | null
          created_at?: string
          data_last_verified_at?: string | null
          details?: string | null
          feature_name: string
          feature_type: string
          id?: string
          institute_id?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          available?: boolean | null
          created_at?: string
          data_last_verified_at?: string | null
          details?: string | null
          feature_name?: string
          feature_type?: string
          id?: string
          institute_id?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_campus_safety_accessibility_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_campus_safety_services: {
        Row: {
          accessibility_features: string | null
          contact_number: string | null
          coverage: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          emergency_protocol: string | null
          id: string
          institute_id: string
          location: string | null
          official_url: string | null
          operating_hours: string | null
          provider: string | null
          service_name: string
          service_type: string
          source_label: string | null
          source_url: string | null
          women_safety_features: string | null
          year: number | null
        }
        Insert: {
          accessibility_features?: string | null
          contact_number?: string | null
          coverage?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          emergency_protocol?: string | null
          id?: string
          institute_id: string
          location?: string | null
          official_url?: string | null
          operating_hours?: string | null
          provider?: string | null
          service_name: string
          service_type: string
          source_label?: string | null
          source_url?: string | null
          women_safety_features?: string | null
          year?: number | null
        }
        Update: {
          accessibility_features?: string | null
          contact_number?: string | null
          coverage?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          emergency_protocol?: string | null
          id?: string
          institute_id?: string
          location?: string | null
          official_url?: string | null
          operating_hours?: string | null
          provider?: string | null
          service_name?: string
          service_type?: string
          source_label?: string | null
          source_url?: string | null
          women_safety_features?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_campus_safety_services_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_campus_services: {
        Row: {
          contact_info: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          distance_km: number | null
          id: string
          institute_id: string | null
          on_campus: boolean | null
          operating_hours: string | null
          provider: string | null
          service_name: string
          service_type: string
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          distance_km?: number | null
          id?: string
          institute_id?: string | null
          on_campus?: boolean | null
          operating_hours?: string | null
          provider?: string | null
          service_name: string
          service_type: string
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          distance_km?: number | null
          id?: string
          institute_id?: string | null
          on_campus?: boolean | null
          operating_hours?: string | null
          provider?: string | null
          service_name?: string
          service_type?: string
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_campus_services_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_career_development_programs: {
        Row: {
          application_url: string | null
          certificate_available: boolean | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          delivery_mode: string | null
          description: string | null
          duration_text: string | null
          eligibility: string | null
          eligible_programs: string[] | null
          fee_amount: number | null
          id: string
          institute_id: string
          program_name: string
          program_type: string | null
          provider: string | null
          source_label: string | null
          source_url: string | null
          target_group: string | null
          year: number | null
        }
        Insert: {
          application_url?: string | null
          certificate_available?: boolean | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          delivery_mode?: string | null
          description?: string | null
          duration_text?: string | null
          eligibility?: string | null
          eligible_programs?: string[] | null
          fee_amount?: number | null
          id?: string
          institute_id: string
          program_name: string
          program_type?: string | null
          provider?: string | null
          source_label?: string | null
          source_url?: string | null
          target_group?: string | null
          year?: number | null
        }
        Update: {
          application_url?: string | null
          certificate_available?: boolean | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          delivery_mode?: string | null
          description?: string | null
          duration_text?: string | null
          eligibility?: string | null
          eligible_programs?: string[] | null
          fee_amount?: number | null
          id?: string
          institute_id?: string
          program_name?: string
          program_type?: string | null
          provider?: string | null
          source_label?: string | null
          source_url?: string | null
          target_group?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_career_development_programs_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_career_events: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          eligible_programs: string[] | null
          end_at: string | null
          event_name: string
          event_type: string | null
          id: string
          institute_id: string
          organizer: string | null
          registration_url: string | null
          source_label: string | null
          source_url: string | null
          start_at: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          eligible_programs?: string[] | null
          end_at?: string | null
          event_name: string
          event_type?: string | null
          id?: string
          institute_id: string
          organizer?: string | null
          registration_url?: string | null
          source_label?: string | null
          source_url?: string | null
          start_at?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          eligible_programs?: string[] | null
          end_at?: string | null
          event_name?: string
          event_type?: string | null
          id?: string
          institute_id?: string
          organizer?: string | null
          registration_url?: string | null
          source_label?: string | null
          source_url?: string | null
          start_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_career_events_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_career_outcome_metrics: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_category: string
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          population: string | null
          program_name: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_category: string
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          program_name?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_category?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          program_name?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_career_outcome_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_career_services: {
        Row: {
          appointment_required: boolean | null
          availability: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          eligibility: string | null
          id: string
          institute_id: string
          official_url: string | null
          service_name: string
          service_type: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          appointment_required?: boolean | null
          availability?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          eligibility?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          service_name: string
          service_type?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          appointment_required?: boolean | null
          availability?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          eligibility?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          service_name?: string
          service_type?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_career_services_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_category_rules: {
        Row: {
          category_code: string
          category_name: string
          certificate_required: boolean | null
          certificate_type: string | null
          certificate_validity_rule: string | null
          counselling: string
          created_at: string
          data_last_verified_at: string | null
          gender_pool: string | null
          id: string
          notes: string | null
          parent_category: string | null
          rank_type: string | null
          reservation_percent: number | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          category_code: string
          category_name: string
          certificate_required?: boolean | null
          certificate_type?: string | null
          certificate_validity_rule?: string | null
          counselling: string
          created_at?: string
          data_last_verified_at?: string | null
          gender_pool?: string | null
          id?: string
          notes?: string | null
          parent_category?: string | null
          rank_type?: string | null
          reservation_percent?: number | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          category_code?: string
          category_name?: string
          certificate_required?: boolean | null
          certificate_type?: string | null
          certificate_validity_rule?: string | null
          counselling?: string
          created_at?: string
          data_last_verified_at?: string | null
          gender_pool?: string | null
          id?: string
          notes?: string | null
          parent_category?: string | null
          rank_type?: string | null
          reservation_percent?: number | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: []
      }
      jee_choice_filling_demand: {
        Row: {
          allocated_count: number | null
          category: string | null
          choice_count: number | null
          counselling: string
          created_at: string
          data_last_verified_at: string | null
          demand_ratio: number | null
          gender: string | null
          id: string
          institute_id: string
          methodology: string | null
          preference_position: number | null
          program_name: string | null
          quota: string | null
          round: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          unique_candidates: number | null
          year: number
        }
        Insert: {
          allocated_count?: number | null
          category?: string | null
          choice_count?: number | null
          counselling: string
          created_at?: string
          data_last_verified_at?: string | null
          demand_ratio?: number | null
          gender?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          preference_position?: number | null
          program_name?: string | null
          quota?: string | null
          round?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          unique_candidates?: number | null
          year: number
        }
        Update: {
          allocated_count?: number | null
          category?: string | null
          choice_count?: number | null
          counselling?: string
          created_at?: string
          data_last_verified_at?: string | null
          demand_ratio?: number | null
          gender?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          preference_position?: number | null
          program_name?: string | null
          quota?: string | null
          round?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          unique_candidates?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_choice_filling_demand_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_city_profile: {
        Row: {
          airport_access: string | null
          city_name: string | null
          climate_summary: string | null
          cost_of_living_summary: string | null
          created_at: string
          data_last_verified_at: string | null
          education_ecosystem: string | null
          employment_ecosystem: string | null
          healthcare_access: string | null
          id: string
          institute_id: string
          major_languages: string[] | null
          major_transport_modes: string[] | null
          population_estimate: number | null
          population_year: number | null
          railway_access: string | null
          safety_summary: string | null
          source_label: string | null
          source_url: string | null
          state_name: string | null
          student_life_summary: string | null
          updated_at: string
        }
        Insert: {
          airport_access?: string | null
          city_name?: string | null
          climate_summary?: string | null
          cost_of_living_summary?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          education_ecosystem?: string | null
          employment_ecosystem?: string | null
          healthcare_access?: string | null
          id?: string
          institute_id: string
          major_languages?: string[] | null
          major_transport_modes?: string[] | null
          population_estimate?: number | null
          population_year?: number | null
          railway_access?: string | null
          safety_summary?: string | null
          source_label?: string | null
          source_url?: string | null
          state_name?: string | null
          student_life_summary?: string | null
          updated_at?: string
        }
        Update: {
          airport_access?: string | null
          city_name?: string | null
          climate_summary?: string | null
          cost_of_living_summary?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          education_ecosystem?: string | null
          employment_ecosystem?: string | null
          healthcare_access?: string | null
          id?: string
          institute_id?: string
          major_languages?: string[] | null
          major_transport_modes?: string[] | null
          population_estimate?: number | null
          population_year?: number | null
          railway_access?: string | null
          safety_summary?: string | null
          source_label?: string | null
          source_url?: string | null
          state_name?: string | null
          student_life_summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_city_profile_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: true
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_climate_initiatives: {
        Row: {
          achieved_unit: string | null
          achieved_value: number | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          end_date: string | null
          id: string
          initiative_name: string
          initiative_type: string | null
          institute_id: string
          source_document: string | null
          source_label: string | null
          source_url: string | null
          start_date: string | null
          status: string | null
          target_area: string | null
          target_unit: string | null
          target_value: number | null
          year: number | null
        }
        Insert: {
          achieved_unit?: string | null
          achieved_value?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          initiative_name: string
          initiative_type?: string | null
          institute_id: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          status?: string | null
          target_area?: string | null
          target_unit?: string | null
          target_value?: number | null
          year?: number | null
        }
        Update: {
          achieved_unit?: string | null
          achieved_value?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          initiative_name?: string
          initiative_type?: string | null
          institute_id?: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          status?: string | null
          target_area?: string | null
          target_unit?: string | null
          target_value?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_climate_initiatives_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_college_shortlists: {
        Row: {
          category: string | null
          city: string | null
          closing_rank: number | null
          counselling: string
          created_at: string
          cutoff_id: string | null
          id: string
          institute_name: string
          institute_type: string | null
          notes: string | null
          opening_rank: number | null
          priority: number | null
          program_code: string | null
          program_name: string
          quota: string | null
          round: number | null
          state: string | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          category?: string | null
          city?: string | null
          closing_rank?: number | null
          counselling?: string
          created_at?: string
          cutoff_id?: string | null
          id?: string
          institute_name: string
          institute_type?: string | null
          notes?: string | null
          opening_rank?: number | null
          priority?: number | null
          program_code?: string | null
          program_name: string
          quota?: string | null
          round?: number | null
          state?: string | null
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          category?: string | null
          city?: string | null
          closing_rank?: number | null
          counselling?: string
          created_at?: string
          cutoff_id?: string | null
          id?: string
          institute_name?: string
          institute_type?: string | null
          notes?: string | null
          opening_rank?: number | null
          priority?: number | null
          program_code?: string | null
          program_name?: string
          quota?: string | null
          round?: number | null
          state?: string | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_college_shortlists_cutoff_id_fkey"
            columns: ["cutoff_id"]
            isOneToOne: false
            referencedRelation: "jee_cutoff_data"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_competitive_exam_outcomes: {
        Row: {
          appeared_count: number | null
          created_at: string
          exam_name: string
          id: string
          institute_id: string
          methodology: string | null
          program_name: string | null
          qualification_rate: number | null
          qualified_count: number | null
          rank_or_score_summary: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          appeared_count?: number | null
          created_at?: string
          exam_name: string
          id?: string
          institute_id: string
          methodology?: string | null
          program_name?: string | null
          qualification_rate?: number | null
          qualified_count?: number | null
          rank_or_score_summary?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          appeared_count?: number | null
          created_at?: string
          exam_name?: string
          id?: string
          institute_id?: string
          methodology?: string | null
          program_name?: string | null
          qualification_rate?: number | null
          qualified_count?: number | null
          rank_or_score_summary?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_competitive_exam_outcomes_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_compliance_audits: {
        Row: {
          audit_date: string | null
          audit_type: string
          auditor_name: string | null
          authority_name: string | null
          closure_date: string | null
          corrective_action: string | null
          created_at: string
          data_last_verified_at: string | null
          findings_summary: string | null
          id: string
          institute_id: string
          result_status: string | null
          score: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          audit_date?: string | null
          audit_type: string
          auditor_name?: string | null
          authority_name?: string | null
          closure_date?: string | null
          corrective_action?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          findings_summary?: string | null
          id?: string
          institute_id: string
          result_status?: string | null
          score?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          audit_date?: string | null
          audit_type?: string
          auditor_name?: string | null
          authority_name?: string | null
          closure_date?: string | null
          corrective_action?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          findings_summary?: string | null
          id?: string
          institute_id?: string
          result_status?: string | null
          score?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_compliance_audits_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_compliance_certificates: {
        Row: {
          certificate_name: string | null
          certificate_number: string | null
          certificate_type: string
          created_at: string
          data_last_verified_at: string | null
          document_url: string | null
          id: string
          institute_id: string
          issue_date: string | null
          issuing_authority: string | null
          scope: string | null
          source_label: string | null
          source_url: string | null
          status: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          certificate_name?: string | null
          certificate_number?: string | null
          certificate_type: string
          created_at?: string
          data_last_verified_at?: string | null
          document_url?: string | null
          id?: string
          institute_id: string
          issue_date?: string | null
          issuing_authority?: string | null
          scope?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          certificate_name?: string | null
          certificate_number?: string | null
          certificate_type?: string
          created_at?: string
          data_last_verified_at?: string | null
          document_url?: string | null
          id?: string
          institute_id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          scope?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_compliance_certificates_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_compliance_obligations: {
        Row: {
          applicable_scope: string | null
          authority_name: string | null
          created_at: string
          data_last_verified_at: string | null
          deadline: string | null
          evidence_document: string | null
          frequency: string | null
          id: string
          institute_id: string
          obligation_type: string
          requirement_name: string
          responsible_office: string | null
          source_label: string | null
          source_url: string | null
          status: string | null
          year: number | null
        }
        Insert: {
          applicable_scope?: string | null
          authority_name?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          deadline?: string | null
          evidence_document?: string | null
          frequency?: string | null
          id?: string
          institute_id: string
          obligation_type: string
          requirement_name: string
          responsible_office?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          year?: number | null
        }
        Update: {
          applicable_scope?: string | null
          authority_name?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          deadline?: string | null
          evidence_document?: string | null
          frequency?: string | null
          id?: string
          institute_id?: string
          obligation_type?: string
          requirement_name?: string
          responsible_office?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_compliance_obligations_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_compliance_records: {
        Row: {
          applicable_scope: string | null
          certificate_or_reference: string | null
          compliance_date: string | null
          compliance_type: string
          created_at: string
          data_last_verified_at: string | null
          expiry_date: string | null
          id: string
          institute_id: string
          notes: string | null
          official_url: string | null
          requirement_name: string
          responsible_office: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          status: string | null
          year: number | null
        }
        Insert: {
          applicable_scope?: string | null
          certificate_or_reference?: string | null
          compliance_date?: string | null
          compliance_type: string
          created_at?: string
          data_last_verified_at?: string | null
          expiry_date?: string | null
          id?: string
          institute_id: string
          notes?: string | null
          official_url?: string | null
          requirement_name: string
          responsible_office?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          year?: number | null
        }
        Update: {
          applicable_scope?: string | null
          certificate_or_reference?: string | null
          compliance_date?: string | null
          compliance_type?: string
          created_at?: string
          data_last_verified_at?: string | null
          expiry_date?: string | null
          id?: string
          institute_id?: string
          notes?: string | null
          official_url?: string | null
          requirement_name?: string
          responsible_office?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_compliance_records_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_computing_resources: {
        Row: {
          access_eligibility: string | null
          access_hours: string | null
          booking_required: boolean | null
          cloud_resources: string | null
          cpu_gpu_details: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          facility_name: string
          facility_type: string | null
          id: string
          institute_id: string
          location: string | null
          memory_storage_details: string | null
          network_speed: string | null
          official_url: string | null
          operating_systems: string[] | null
          software_available: string[] | null
          source_label: string | null
          source_url: string | null
          systems_count: number | null
          updated_at: string
          year: number | null
        }
        Insert: {
          access_eligibility?: string | null
          access_hours?: string | null
          booking_required?: boolean | null
          cloud_resources?: string | null
          cpu_gpu_details?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          facility_name: string
          facility_type?: string | null
          id?: string
          institute_id: string
          location?: string | null
          memory_storage_details?: string | null
          network_speed?: string | null
          official_url?: string | null
          operating_systems?: string[] | null
          software_available?: string[] | null
          source_label?: string | null
          source_url?: string | null
          systems_count?: number | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          access_eligibility?: string | null
          access_hours?: string | null
          booking_required?: boolean | null
          cloud_resources?: string | null
          cpu_gpu_details?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          facility_name?: string
          facility_type?: string | null
          id?: string
          institute_id?: string
          location?: string | null
          memory_storage_details?: string | null
          network_speed?: string | null
          official_url?: string | null
          operating_systems?: string[] | null
          software_available?: string[] | null
          source_label?: string | null
          source_url?: string | null
          systems_count?: number | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_computing_resources_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_concept_dependencies: {
        Row: {
          created_at: string
          dependency_strength: string
          dependent_chapter_id: string
          exam: string
          id: string
          notes: string | null
          prerequisite_chapter_id: string
          subject: string
        }
        Insert: {
          created_at?: string
          dependency_strength?: string
          dependent_chapter_id: string
          exam: string
          id?: string
          notes?: string | null
          prerequisite_chapter_id: string
          subject: string
        }
        Update: {
          created_at?: string
          dependency_strength?: string
          dependent_chapter_id?: string
          exam?: string
          id?: string
          notes?: string | null
          prerequisite_chapter_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_concept_dependencies_dependent_chapter_id_fkey"
            columns: ["dependent_chapter_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_concept_dependencies_prerequisite_chapter_id_fkey"
            columns: ["prerequisite_chapter_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_conferences: {
        Row: {
          abstract_deadline: string | null
          city: string | null
          conference_name: string
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          department_name: string | null
          description: string | null
          end_date: string | null
          id: string
          institute_id: string
          official_url: string | null
          organizer_name: string | null
          paper_submission_deadline: string | null
          proceedings_details: string | null
          publication_opportunity: string | null
          registration_deadline: string | null
          registration_fee: number | null
          registration_url: string | null
          source_label: string | null
          source_url: string | null
          start_date: string | null
          theme: string | null
          venue: string | null
          year: number | null
        }
        Insert: {
          abstract_deadline?: string | null
          city?: string | null
          conference_name: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          organizer_name?: string | null
          paper_submission_deadline?: string | null
          proceedings_details?: string | null
          publication_opportunity?: string | null
          registration_deadline?: string | null
          registration_fee?: number | null
          registration_url?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          theme?: string | null
          venue?: string | null
          year?: number | null
        }
        Update: {
          abstract_deadline?: string | null
          city?: string | null
          conference_name?: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          organizer_name?: string | null
          paper_submission_deadline?: string | null
          proceedings_details?: string | null
          publication_opportunity?: string | null
          registration_deadline?: string | null
          registration_fee?: number | null
          registration_url?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          theme?: string | null
          venue?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_conferences_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_connectivity_nodes: {
        Row: {
          city: string | null
          connectivity_details: string | null
          created_at: string
          data_last_verified_at: string | null
          distance_km: number | null
          id: string
          institute_id: string
          node_name: string
          node_type: string
          official_url: string | null
          source_label: string | null
          source_url: string | null
          state: string | null
          travel_time_minutes: number | null
          year: number | null
        }
        Insert: {
          city?: string | null
          connectivity_details?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          distance_km?: number | null
          id?: string
          institute_id: string
          node_name: string
          node_type: string
          official_url?: string | null
          source_label?: string | null
          source_url?: string | null
          state?: string | null
          travel_time_minutes?: number | null
          year?: number | null
        }
        Update: {
          city?: string | null
          connectivity_details?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          distance_km?: number | null
          id?: string
          institute_id?: string
          node_name?: string
          node_type?: string
          official_url?: string | null
          source_label?: string | null
          source_url?: string | null
          state?: string | null
          travel_time_minutes?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_connectivity_nodes_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_cost_of_attendance: {
        Row: {
          academic_fees_total: number | null
          category: string | null
          created_at: string
          currency: string
          data_last_verified_at: string | null
          deposits_total: number | null
          duration_years: number | null
          estimated_total: number | null
          hostel_total: number | null
          id: string
          institute_id: string | null
          mess_total: number | null
          methodology: string | null
          one_time_charges_total: number | null
          other_mandatory_total: number | null
          program_id: string | null
          scholarship_offset: number | null
          source_label: string | null
          source_url: string | null
          tuition_total: number | null
          year: number
        }
        Insert: {
          academic_fees_total?: number | null
          category?: string | null
          created_at?: string
          currency?: string
          data_last_verified_at?: string | null
          deposits_total?: number | null
          duration_years?: number | null
          estimated_total?: number | null
          hostel_total?: number | null
          id?: string
          institute_id?: string | null
          mess_total?: number | null
          methodology?: string | null
          one_time_charges_total?: number | null
          other_mandatory_total?: number | null
          program_id?: string | null
          scholarship_offset?: number | null
          source_label?: string | null
          source_url?: string | null
          tuition_total?: number | null
          year: number
        }
        Update: {
          academic_fees_total?: number | null
          category?: string | null
          created_at?: string
          currency?: string
          data_last_verified_at?: string | null
          deposits_total?: number | null
          duration_years?: number | null
          estimated_total?: number | null
          hostel_total?: number | null
          id?: string
          institute_id?: string | null
          mess_total?: number | null
          methodology?: string | null
          one_time_charges_total?: number | null
          other_mandatory_total?: number | null
          program_id?: string | null
          scholarship_offset?: number | null
          source_label?: string | null
          source_url?: string | null
          tuition_total?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_cost_of_attendance_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_cost_of_attendance_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_counselling_contacts: {
        Row: {
          address: string | null
          contact_type: string | null
          counselling: string
          created_at: string
          data_last_verified_at: string | null
          email: string | null
          helpline: string | null
          id: string
          office_hours: string | null
          organization_name: string
          phone: string | null
          source_label: string | null
          source_url: string | null
          website_url: string | null
          year: number | null
        }
        Insert: {
          address?: string | null
          contact_type?: string | null
          counselling: string
          created_at?: string
          data_last_verified_at?: string | null
          email?: string | null
          helpline?: string | null
          id?: string
          office_hours?: string | null
          organization_name: string
          phone?: string | null
          source_label?: string | null
          source_url?: string | null
          website_url?: string | null
          year?: number | null
        }
        Update: {
          address?: string | null
          contact_type?: string | null
          counselling?: string
          created_at?: string
          data_last_verified_at?: string | null
          email?: string | null
          helpline?: string | null
          id?: string
          office_hours?: string | null
          organization_name?: string
          phone?: string | null
          source_label?: string | null
          source_url?: string | null
          website_url?: string | null
          year?: number | null
        }
        Relationships: []
      }
      jee_counselling_rounds: {
        Row: {
          choice_filling_end: string | null
          choice_filling_start: string | null
          counselling: string
          created_at: string
          data_last_verified_at: string | null
          fee_payment_end: string | null
          fee_payment_start: string | null
          float_freeze_slide_available: boolean | null
          id: string
          registration_end: string | null
          registration_start: string | null
          reporting_end: string | null
          reporting_start: string | null
          result_date: string | null
          round_name: string | null
          round_number: number
          seat_acceptance_end: string | null
          seat_acceptance_start: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          withdrawal_available: boolean | null
          year: number
        }
        Insert: {
          choice_filling_end?: string | null
          choice_filling_start?: string | null
          counselling: string
          created_at?: string
          data_last_verified_at?: string | null
          fee_payment_end?: string | null
          fee_payment_start?: string | null
          float_freeze_slide_available?: boolean | null
          id?: string
          registration_end?: string | null
          registration_start?: string | null
          reporting_end?: string | null
          reporting_start?: string | null
          result_date?: string | null
          round_name?: string | null
          round_number: number
          seat_acceptance_end?: string | null
          seat_acceptance_start?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          withdrawal_available?: boolean | null
          year: number
        }
        Update: {
          choice_filling_end?: string | null
          choice_filling_start?: string | null
          counselling?: string
          created_at?: string
          data_last_verified_at?: string | null
          fee_payment_end?: string | null
          fee_payment_start?: string | null
          float_freeze_slide_available?: boolean | null
          id?: string
          registration_end?: string | null
          registration_start?: string | null
          reporting_end?: string | null
          reporting_start?: string | null
          result_date?: string | null
          round_name?: string | null
          round_number?: number
          seat_acceptance_end?: string | null
          seat_acceptance_start?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          withdrawal_available?: boolean | null
          year?: number
        }
        Relationships: []
      }
      jee_counselling_tasks: {
        Row: {
          counselling: string
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          official_url: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          counselling?: string
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          official_url?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          counselling?: string
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          official_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      jee_course_instructors: {
        Row: {
          course_code: string | null
          course_name: string
          created_at: string
          data_last_verified_at: string | null
          faculty_id: string | null
          id: string
          institute_id: string
          instructor_name: string | null
          program_name: string | null
          role: string | null
          semester: number | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          course_code?: string | null
          course_name: string
          created_at?: string
          data_last_verified_at?: string | null
          faculty_id?: string | null
          id?: string
          institute_id: string
          instructor_name?: string | null
          program_name?: string | null
          role?: string | null
          semester?: number | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          course_code?: string | null
          course_name?: string
          created_at?: string
          data_last_verified_at?: string | null
          faculty_id?: string | null
          id?: string
          institute_id?: string
          instructor_name?: string | null
          program_name?: string | null
          role?: string | null
          semester?: number | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_course_instructors_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "jee_faculty_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_course_instructors_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_course_prerequisites: {
        Row: {
          course_id: string
          created_at: string
          curriculum_id: string
          data_last_verified_at: string | null
          id: string
          minimum_grade: string | null
          prerequisite_course_id: string | null
          prerequisite_text: string | null
          source_label: string | null
          source_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          curriculum_id: string
          data_last_verified_at?: string | null
          id?: string
          minimum_grade?: string | null
          prerequisite_course_id?: string | null
          prerequisite_text?: string | null
          source_label?: string | null
          source_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          curriculum_id?: string
          data_last_verified_at?: string | null
          id?: string
          minimum_grade?: string | null
          prerequisite_course_id?: string | null
          prerequisite_text?: string | null
          source_label?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_course_prerequisites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "jee_curriculum_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_course_prerequisites_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "jee_curricula"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_course_prerequisites_prerequisite_course_id_fkey"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "jee_curriculum_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_credit_transfer_rules: {
        Row: {
          applicable_programs: string[] | null
          approval_authority: string | null
          conditions: string | null
          created_at: string
          data_last_verified_at: string | null
          documentation_required: string[] | null
          equivalence_method: string | null
          id: string
          institute_id: string
          maximum_transfer_credits: number | null
          minimum_duration_completed: string | null
          minimum_grade: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          transfer_route: string
          year: number
        }
        Insert: {
          applicable_programs?: string[] | null
          approval_authority?: string | null
          conditions?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          documentation_required?: string[] | null
          equivalence_method?: string | null
          id?: string
          institute_id: string
          maximum_transfer_credits?: number | null
          minimum_duration_completed?: string | null
          minimum_grade?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          transfer_route: string
          year: number
        }
        Update: {
          applicable_programs?: string[] | null
          approval_authority?: string | null
          conditions?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          documentation_required?: string[] | null
          equivalence_method?: string | null
          id?: string
          institute_id?: string
          maximum_transfer_credits?: number | null
          minimum_duration_completed?: string | null
          minimum_grade?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          transfer_route?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_credit_transfer_rules_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_csab_round_data: {
        Row: {
          category: string | null
          closing_rank: number | null
          created_at: string
          data_last_verified_at: string | null
          gender: string | null
          id: string
          institute_id: string | null
          opening_rank: number | null
          program_id: string | null
          program_name: string
          quota: string | null
          round_number: number
          source_label: string | null
          source_url: string | null
          vacant_seats: number | null
          year: number
        }
        Insert: {
          category?: string | null
          closing_rank?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          gender?: string | null
          id?: string
          institute_id?: string | null
          opening_rank?: number | null
          program_id?: string | null
          program_name: string
          quota?: string | null
          round_number: number
          source_label?: string | null
          source_url?: string | null
          vacant_seats?: number | null
          year: number
        }
        Update: {
          category?: string | null
          closing_rank?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          gender?: string | null
          id?: string
          institute_id?: string | null
          opening_rank?: number | null
          program_id?: string | null
          program_name?: string
          quota?: string | null
          round_number?: number
          source_label?: string | null
          source_url?: string | null
          vacant_seats?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_csab_round_data_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_csab_round_data_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_cultural_activities: {
        Row: {
          activity_name: string
          activity_type: string | null
          club_or_organization: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          description: string | null
          eligibility: string | null
          id: string
          institute_id: string
          official_url: string | null
          participation_fee: number | null
          schedule_text: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          activity_name: string
          activity_type?: string | null
          club_or_organization?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          description?: string | null
          eligibility?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          participation_fee?: number | null
          schedule_text?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          activity_name?: string
          activity_type?: string | null
          club_or_organization?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          description?: string | null
          eligibility?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          participation_fee?: number | null
          schedule_text?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_cultural_activities_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_curricula: {
        Row: {
          academic_structure: string | null
          created_at: string
          curriculum_name: string
          curriculum_url: string | null
          curriculum_version: string | null
          data_last_verified_at: string | null
          duration_semesters: number | null
          grading_system: string | null
          id: string
          institute_id: string | null
          official_document: string | null
          program_id: string | null
          source_label: string | null
          source_url: string | null
          total_credits: number | null
          updated_at: string
          year: number
        }
        Insert: {
          academic_structure?: string | null
          created_at?: string
          curriculum_name: string
          curriculum_url?: string | null
          curriculum_version?: string | null
          data_last_verified_at?: string | null
          duration_semesters?: number | null
          grading_system?: string | null
          id?: string
          institute_id?: string | null
          official_document?: string | null
          program_id?: string | null
          source_label?: string | null
          source_url?: string | null
          total_credits?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          academic_structure?: string | null
          created_at?: string
          curriculum_name?: string
          curriculum_url?: string | null
          curriculum_version?: string | null
          data_last_verified_at?: string | null
          duration_semesters?: number | null
          grading_system?: string | null
          id?: string
          institute_id?: string | null
          official_document?: string | null
          program_id?: string | null
          source_label?: string | null
          source_url?: string | null
          total_credits?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_curricula_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_curricula_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_curriculum_changes: {
        Row: {
          affected_course_code: string | null
          affected_semester: number | null
          change_summary: string | null
          change_type: string
          created_at: string
          data_last_verified_at: string | null
          from_year: number | null
          id: string
          institute_id: string | null
          new_value: string | null
          old_value: string | null
          program_id: string | null
          source_label: string | null
          source_url: string | null
          to_year: number | null
        }
        Insert: {
          affected_course_code?: string | null
          affected_semester?: number | null
          change_summary?: string | null
          change_type: string
          created_at?: string
          data_last_verified_at?: string | null
          from_year?: number | null
          id?: string
          institute_id?: string | null
          new_value?: string | null
          old_value?: string | null
          program_id?: string | null
          source_label?: string | null
          source_url?: string | null
          to_year?: number | null
        }
        Update: {
          affected_course_code?: string | null
          affected_semester?: number | null
          change_summary?: string | null
          change_type?: string
          created_at?: string
          data_last_verified_at?: string | null
          from_year?: number | null
          id?: string
          institute_id?: string | null
          new_value?: string | null
          old_value?: string | null
          program_id?: string | null
          source_label?: string | null
          source_url?: string | null
          to_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_curriculum_changes_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_curriculum_changes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_curriculum_courses: {
        Row: {
          course_code: string | null
          course_description: string | null
          course_name: string
          course_type: string | null
          created_at: string
          credits: number | null
          curriculum_id: string
          data_last_verified_at: string | null
          department: string | null
          elective_group: string | null
          end_semester_marks: number | null
          grade_scheme: string | null
          id: string
          internal_marks: number | null
          lecture_hours: number | null
          mandatory: boolean | null
          practical_hours: number | null
          practical_marks: number | null
          prerequisite_course_codes: string | null
          semester_number: number
          source_label: string | null
          source_url: string | null
          syllabus_url: string | null
          theory_marks: number | null
          total_contact_hours: number | null
          tutorial_hours: number | null
        }
        Insert: {
          course_code?: string | null
          course_description?: string | null
          course_name: string
          course_type?: string | null
          created_at?: string
          credits?: number | null
          curriculum_id: string
          data_last_verified_at?: string | null
          department?: string | null
          elective_group?: string | null
          end_semester_marks?: number | null
          grade_scheme?: string | null
          id?: string
          internal_marks?: number | null
          lecture_hours?: number | null
          mandatory?: boolean | null
          practical_hours?: number | null
          practical_marks?: number | null
          prerequisite_course_codes?: string | null
          semester_number: number
          source_label?: string | null
          source_url?: string | null
          syllabus_url?: string | null
          theory_marks?: number | null
          total_contact_hours?: number | null
          tutorial_hours?: number | null
        }
        Update: {
          course_code?: string | null
          course_description?: string | null
          course_name?: string
          course_type?: string | null
          created_at?: string
          credits?: number | null
          curriculum_id?: string
          data_last_verified_at?: string | null
          department?: string | null
          elective_group?: string | null
          end_semester_marks?: number | null
          grade_scheme?: string | null
          id?: string
          internal_marks?: number | null
          lecture_hours?: number | null
          mandatory?: boolean | null
          practical_hours?: number | null
          practical_marks?: number | null
          prerequisite_course_codes?: string | null
          semester_number?: number
          source_label?: string | null
          source_url?: string | null
          syllabus_url?: string | null
          theory_marks?: number | null
          total_contact_hours?: number | null
          tutorial_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_curriculum_courses_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "jee_curricula"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_curriculum_electives: {
        Row: {
          choices: string | null
          created_at: string
          curriculum_id: string
          data_last_verified_at: string | null
          elective_group: string
          elective_type: string | null
          eligibility_rule: string | null
          id: string
          maximum_courses: number | null
          minimum_courses: number | null
          semester_number: number | null
          source_label: string | null
          source_url: string | null
        }
        Insert: {
          choices?: string | null
          created_at?: string
          curriculum_id: string
          data_last_verified_at?: string | null
          elective_group: string
          elective_type?: string | null
          eligibility_rule?: string | null
          id?: string
          maximum_courses?: number | null
          minimum_courses?: number | null
          semester_number?: number | null
          source_label?: string | null
          source_url?: string | null
        }
        Update: {
          choices?: string | null
          created_at?: string
          curriculum_id?: string
          data_last_verified_at?: string | null
          elective_group?: string
          elective_type?: string | null
          eligibility_rule?: string | null
          id?: string
          maximum_courses?: number | null
          minimum_courses?: number | null
          semester_number?: number | null
          source_label?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_curriculum_electives_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "jee_curricula"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_cutoff_data: {
        Row: {
          category: string
          closing_rank: number | null
          counselling: string
          created_at: string
          gender: string | null
          id: string
          institute_id: string | null
          opening_rank: number | null
          program_code: string | null
          program_name: string
          quota: string | null
          round: number | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number
        }
        Insert: {
          category: string
          closing_rank?: number | null
          counselling: string
          created_at?: string
          gender?: string | null
          id?: string
          institute_id?: string | null
          opening_rank?: number | null
          program_code?: string | null
          program_name: string
          quota?: string | null
          round?: number | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          category?: string
          closing_rank?: number | null
          counselling?: string
          created_at?: string
          gender?: string | null
          id?: string
          institute_id?: string | null
          opening_rank?: number | null
          program_code?: string | null
          program_name?: string
          quota?: string | null
          round?: number | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_cutoff_data_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_daily_essential_services: {
        Row: {
          contact_phone: string | null
          created_at: string
          data_last_verified_at: string | null
          delivery_available: boolean | null
          distance_from_campus_km: number | null
          id: string
          institute_id: string
          locality: string | null
          official_url: string | null
          operating_hours: string | null
          price_or_fee_details: string | null
          provider_name: string | null
          service_category: string
          service_name: string
          source_label: string | null
          source_url: string | null
          student_discount: string | null
          year: number | null
        }
        Insert: {
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          delivery_available?: boolean | null
          distance_from_campus_km?: number | null
          id?: string
          institute_id: string
          locality?: string | null
          official_url?: string | null
          operating_hours?: string | null
          price_or_fee_details?: string | null
          provider_name?: string | null
          service_category: string
          service_name: string
          source_label?: string | null
          source_url?: string | null
          student_discount?: string | null
          year?: number | null
        }
        Update: {
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          delivery_available?: boolean | null
          distance_from_campus_km?: number | null
          id?: string
          institute_id?: string
          locality?: string | null
          official_url?: string | null
          operating_hours?: string | null
          price_or_fee_details?: string | null
          provider_name?: string | null
          service_category?: string
          service_name?: string
          source_label?: string | null
          source_url?: string | null
          student_discount?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_daily_essential_services_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_daily_living_costs: {
        Row: {
          cost_category: string
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          frequency: string | null
          id: string
          institute_id: string
          item_name: string
          locality: string | null
          mandatory: boolean | null
          max_amount: number | null
          methodology: string | null
          min_amount: number | null
          source_label: string | null
          source_url: string | null
          typical_amount: number | null
          year: number
        }
        Insert: {
          cost_category: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          frequency?: string | null
          id?: string
          institute_id: string
          item_name: string
          locality?: string | null
          mandatory?: boolean | null
          max_amount?: number | null
          methodology?: string | null
          min_amount?: number | null
          source_label?: string | null
          source_url?: string | null
          typical_amount?: number | null
          year: number
        }
        Update: {
          cost_category?: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          frequency?: string | null
          id?: string
          institute_id?: string
          item_name?: string
          locality?: string | null
          mandatory?: boolean | null
          max_amount?: number | null
          methodology?: string | null
          min_amount?: number | null
          source_label?: string | null
          source_url?: string | null
          typical_amount?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_daily_living_costs_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_daily_practice_attempts: {
        Row: {
          completed_at: string | null
          correct_answers: number
          practice_set_id: string
          questions_attempted: number
          started_at: string | null
          status: string
          time_spent_seconds: number
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          correct_answers?: number
          practice_set_id: string
          questions_attempted?: number
          started_at?: string | null
          status?: string
          time_spent_seconds?: number
          total_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number
          practice_set_id?: string
          questions_attempted?: number
          started_at?: string | null
          status?: string
          time_spent_seconds?: number
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_daily_practice_attempts_practice_set_id_fkey"
            columns: ["practice_set_id"]
            isOneToOne: false
            referencedRelation: "jee_daily_practice_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_daily_practice_questions: {
        Row: {
          created_at: string
          practice_set_id: string
          question_id: string
          question_order: number
          subject: string
        }
        Insert: {
          created_at?: string
          practice_set_id: string
          question_id: string
          question_order: number
          subject: string
        }
        Update: {
          created_at?: string
          practice_set_id?: string
          question_id?: string
          question_order?: number
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_daily_practice_questions_practice_set_id_fkey"
            columns: ["practice_set_id"]
            isOneToOne: false
            referencedRelation: "jee_daily_practice_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_daily_practice_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "jee_pyq_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_daily_practice_sets: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          exam: string
          id: string
          is_active: boolean
          practice_date: string
          target_questions: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          exam: string
          id?: string
          is_active?: boolean
          practice_date: string
          target_questions?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          exam?: string
          id?: string
          is_active?: boolean
          practice_date?: string
          target_questions?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      jee_daily_targets: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          questions_done: number
          questions_target: number
          revision_done: number
          revision_target: number
          study_minutes: number
          target_date: string
          tests_done: number
          tests_target: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          questions_done?: number
          questions_target?: number
          revision_done?: number
          revision_target?: number
          study_minutes?: number
          target_date: string
          tests_done?: number
          tests_target?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          questions_done?: number
          questions_target?: number
          revision_done?: number
          revision_target?: number
          study_minutes?: number
          target_date?: string
          tests_done?: number
          tests_target?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jee_data_quality_metrics: {
        Row: {
          completeness_percentage: number | null
          created_at: string
          dataset_name: string
          id: string
          institute_id: string | null
          last_refresh_at: string | null
          methodology: string | null
          notes: string | null
          records_available: number | null
          records_expected: number | null
          source_coverage_percentage: number | null
          stale_records: number | null
          updated_at: string
          verified_records: number | null
          year: number | null
        }
        Insert: {
          completeness_percentage?: number | null
          created_at?: string
          dataset_name: string
          id?: string
          institute_id?: string | null
          last_refresh_at?: string | null
          methodology?: string | null
          notes?: string | null
          records_available?: number | null
          records_expected?: number | null
          source_coverage_percentage?: number | null
          stale_records?: number | null
          updated_at?: string
          verified_records?: number | null
          year?: number | null
        }
        Update: {
          completeness_percentage?: number | null
          created_at?: string
          dataset_name?: string
          id?: string
          institute_id?: string | null
          last_refresh_at?: string | null
          methodology?: string | null
          notes?: string | null
          records_available?: number | null
          records_expected?: number | null
          source_coverage_percentage?: number | null
          stale_records?: number | null
          updated_at?: string
          verified_records?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_data_quality_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_data_refresh_log: {
        Row: {
          completed_at: string | null
          created_at: string
          dataset_name: string
          dataset_year: number | null
          error_message: string | null
          id: string
          rows_inserted: number
          rows_processed: number
          rows_updated: number
          source_id: string | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          dataset_name: string
          dataset_year?: number | null
          error_message?: string | null
          id?: string
          rows_inserted?: number
          rows_processed?: number
          rows_updated?: number
          source_id?: string | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          dataset_name?: string
          dataset_year?: number | null
          error_message?: string | null
          id?: string
          rows_inserted?: number
          rows_processed?: number
          rows_updated?: number
          source_id?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_data_refresh_log_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "jee_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_data_sources: {
        Row: {
          base_url: string | null
          created_at: string
          description: string | null
          id: string
          official: boolean
          publisher: string | null
          reliability_notes: string | null
          source_name: string
          source_type: string
        }
        Insert: {
          base_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          official?: boolean
          publisher?: string | null
          reliability_notes?: string | null
          source_name: string
          source_type: string
        }
        Update: {
          base_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          official?: boolean
          publisher?: string | null
          reliability_notes?: string | null
          source_name?: string
          source_type?: string
        }
        Relationships: []
      }
      jee_department_profiles: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          department_code: string | null
          department_name: string
          department_url: string | null
          description: string | null
          faculty_count: number | null
          head_name: string | null
          id: string
          institute_id: string
          programs_count: number | null
          research_areas: string[] | null
          school_name: string | null
          source_label: string | null
          source_url: string | null
          student_count: number | null
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          department_code?: string | null
          department_name: string
          department_url?: string | null
          description?: string | null
          faculty_count?: number | null
          head_name?: string | null
          id?: string
          institute_id: string
          programs_count?: number | null
          research_areas?: string[] | null
          school_name?: string | null
          source_label?: string | null
          source_url?: string | null
          student_count?: number | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          department_code?: string | null
          department_name?: string
          department_url?: string | null
          description?: string | null
          faculty_count?: number | null
          head_name?: string | null
          id?: string
          institute_id?: string
          programs_count?: number | null
          research_areas?: string[] | null
          school_name?: string | null
          source_label?: string | null
          source_url?: string | null
          student_count?: number | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_department_profiles_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_digital_accessibility: {
        Row: {
          accessibility_contact: string | null
          accessibility_features: string[] | null
          accessibility_standard: string | null
          availability: string | null
          compliance_status: string | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          language_support: string[] | null
          official_url: string | null
          service_name: string
          source_label: string | null
          source_url: string | null
          supported_assistive_technology: string[] | null
          year: number | null
        }
        Insert: {
          accessibility_contact?: string | null
          accessibility_features?: string[] | null
          accessibility_standard?: string | null
          availability?: string | null
          compliance_status?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          language_support?: string[] | null
          official_url?: string | null
          service_name: string
          source_label?: string | null
          source_url?: string | null
          supported_assistive_technology?: string[] | null
          year?: number | null
        }
        Update: {
          accessibility_contact?: string | null
          accessibility_features?: string[] | null
          accessibility_standard?: string | null
          availability?: string | null
          compliance_status?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          language_support?: string[] | null
          official_url?: string | null
          service_name?: string
          source_label?: string | null
          source_url?: string | null
          supported_assistive_technology?: string[] | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_digital_accessibility_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_digital_infrastructure: {
        Row: {
          access_scope: string | null
          authentication_method: string | null
          availability: string | null
          capacity_unit: string | null
          capacity_value: number | null
          coverage: string | null
          created_at: string
          data_last_verified_at: string | null
          deployment_status: string | null
          id: string
          infrastructure_type: string
          institute_id: string
          official_url: string | null
          provider: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          support_contact: string | null
          system_name: string
          updated_at: string
          uptime_percentage: number | null
          version: string | null
          year: number
        }
        Insert: {
          access_scope?: string | null
          authentication_method?: string | null
          availability?: string | null
          capacity_unit?: string | null
          capacity_value?: number | null
          coverage?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          deployment_status?: string | null
          id?: string
          infrastructure_type: string
          institute_id: string
          official_url?: string | null
          provider?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          support_contact?: string | null
          system_name: string
          updated_at?: string
          uptime_percentage?: number | null
          version?: string | null
          year: number
        }
        Update: {
          access_scope?: string | null
          authentication_method?: string | null
          availability?: string | null
          capacity_unit?: string | null
          capacity_value?: number | null
          coverage?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          deployment_status?: string | null
          id?: string
          infrastructure_type?: string
          institute_id?: string
          official_url?: string | null
          provider?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          support_contact?: string | null
          system_name?: string
          updated_at?: string
          uptime_percentage?: number | null
          version?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_digital_infrastructure_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_digital_services: {
        Row: {
          access_url: string | null
          authentication_method: string | null
          availability: string | null
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          description: string | null
          eligibility: string | null
          id: string
          institute_id: string
          login_required: boolean | null
          official_url: string | null
          purpose: string | null
          service_name: string
          service_type: string | null
          source_label: string | null
          source_url: string | null
          support_contact: string | null
          year: number | null
        }
        Insert: {
          access_url?: string | null
          authentication_method?: string | null
          availability?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          eligibility?: string | null
          id?: string
          institute_id: string
          login_required?: boolean | null
          official_url?: string | null
          purpose?: string | null
          service_name: string
          service_type?: string | null
          source_label?: string | null
          source_url?: string | null
          support_contact?: string | null
          year?: number | null
        }
        Update: {
          access_url?: string | null
          authentication_method?: string | null
          availability?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          eligibility?: string | null
          id?: string
          institute_id?: string
          login_required?: boolean | null
          official_url?: string | null
          purpose?: string | null
          service_name?: string
          service_type?: string | null
          source_label?: string | null
          source_url?: string | null
          support_contact?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_digital_services_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_dining_policies: {
        Row: {
          applicable_scope: string | null
          created_at: string
          data_last_verified_at: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          institute_id: string
          policy_name: string
          policy_text: string | null
          policy_type: string
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          applicable_scope?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          institute_id: string
          policy_name: string
          policy_text?: string | null
          policy_type: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          applicable_scope?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          institute_id?: string
          policy_name?: string
          policy_text?: string | null
          policy_type?: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_dining_policies_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_disaster_management: {
        Row: {
          assembly_points: string | null
          created_at: string
          data_last_verified_at: string | null
          drill_frequency: string | null
          emergency_contacts: string | null
          emergency_plan: string | null
          evacuation_procedure: string | null
          hazard_type: string
          id: string
          institute_id: string
          last_drill_date: string | null
          preparedness_level: string | null
          responsible_office: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          assembly_points?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          drill_frequency?: string | null
          emergency_contacts?: string | null
          emergency_plan?: string | null
          evacuation_procedure?: string | null
          hazard_type: string
          id?: string
          institute_id: string
          last_drill_date?: string | null
          preparedness_level?: string | null
          responsible_office?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          assembly_points?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          drill_frequency?: string | null
          emergency_contacts?: string | null
          emergency_plan?: string | null
          evacuation_procedure?: string | null
          hazard_type?: string
          id?: string
          institute_id?: string
          last_drill_date?: string | null
          preparedness_level?: string | null
          responsible_office?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_disaster_management_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_diversity_statistics: {
        Row: {
          count_value: number | null
          created_at: string
          data_last_verified_at: string | null
          dimension: string
          group_name: string
          id: string
          institute_id: string
          methodology: string | null
          percentage: number | null
          population: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          count_value?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          dimension: string
          group_name: string
          id?: string
          institute_id: string
          methodology?: string | null
          percentage?: number | null
          population?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          count_value?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          dimension?: string
          group_name?: string
          id?: string
          institute_id?: string
          methodology?: string | null
          percentage?: number | null
          population?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_diversity_statistics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_diversity_trends: {
        Row: {
          count_value: number | null
          created_at: string
          data_last_verified_at: string | null
          dimension: string
          group_name: string
          id: string
          institute_id: string
          methodology: string | null
          percentage: number | null
          population: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          count_value?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          dimension: string
          group_name: string
          id?: string
          institute_id: string
          methodology?: string | null
          percentage?: number | null
          population?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          count_value?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          dimension?: string
          group_name?: string
          id?: string
          institute_id?: string
          methodology?: string | null
          percentage?: number | null
          population?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_diversity_trends_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_document_archive_versions: {
        Row: {
          change_summary: string | null
          created_at: string
          data_last_verified_at: string | null
          document_id: string
          document_url: string | null
          id: string
          publication_date: string | null
          source_label: string | null
          source_url: string | null
          supersedes_version: string | null
          version: string
        }
        Insert: {
          change_summary?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          document_id: string
          document_url?: string | null
          id?: string
          publication_date?: string | null
          source_label?: string | null
          source_url?: string | null
          supersedes_version?: string | null
          version: string
        }
        Update: {
          change_summary?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          document_id?: string
          document_url?: string | null
          id?: string
          publication_date?: string | null
          source_label?: string | null
          source_url?: string | null
          supersedes_version?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_document_archive_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "jee_institution_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_document_checklist: {
        Row: {
          counselling: string
          created_at: string
          description: string | null
          document_key: string
          document_name: string
          id: string
          notes: string | null
          required_when: string | null
          status: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          counselling?: string
          created_at?: string
          description?: string | null
          document_key: string
          document_name: string
          id?: string
          notes?: string | null
          required_when?: string | null
          status?: string
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          counselling?: string
          created_at?: string
          description?: string | null
          document_key?: string
          document_name?: string
          id?: string
          notes?: string | null
          required_when?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      jee_dpp_tracker: {
        Row: {
          attempted_questions: number
          chapter_id: string | null
          completed_at: string | null
          correct_questions: number
          created_at: string
          dpp_url: string | null
          id: string
          notes: string | null
          planned_for: string | null
          source: string | null
          status: string
          subject: string
          time_spent_minutes: number
          title: string
          topic_id: string | null
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attempted_questions?: number
          chapter_id?: string | null
          completed_at?: string | null
          correct_questions?: number
          created_at?: string
          dpp_url?: string | null
          id?: string
          notes?: string | null
          planned_for?: string | null
          source?: string | null
          status?: string
          subject: string
          time_spent_minutes?: number
          title: string
          topic_id?: string | null
          total_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attempted_questions?: number
          chapter_id?: string | null
          completed_at?: string | null
          correct_questions?: number
          created_at?: string
          dpp_url?: string | null
          id?: string
          notes?: string | null
          planned_for?: string | null
          source?: string | null
          status?: string
          subject?: string
          time_spent_minutes?: number
          title?: string
          topic_id?: string | null
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_dpp_tracker_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_dpp_tracker_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_education_finance_options: {
        Row: {
          application_method: string | null
          application_url: string | null
          collateral_rule: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          eligibility: string | null
          eligible_programs: string[] | null
          finance_type: string
          id: string
          institute_id: string
          interest_rate_text: string | null
          margin_requirement: string | null
          maximum_amount: number | null
          moratorium_text: string | null
          official_url: string | null
          processing_fee_text: string | null
          product_name: string | null
          provider_name: string
          repayment_period_text: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          application_method?: string | null
          application_url?: string | null
          collateral_rule?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          eligibility?: string | null
          eligible_programs?: string[] | null
          finance_type: string
          id?: string
          institute_id: string
          interest_rate_text?: string | null
          margin_requirement?: string | null
          maximum_amount?: number | null
          moratorium_text?: string | null
          official_url?: string | null
          processing_fee_text?: string | null
          product_name?: string | null
          provider_name: string
          repayment_period_text?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          application_method?: string | null
          application_url?: string | null
          collateral_rule?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          eligibility?: string | null
          eligible_programs?: string[] | null
          finance_type?: string
          id?: string
          institute_id?: string
          interest_rate_text?: string | null
          margin_requirement?: string | null
          maximum_amount?: number | null
          moratorium_text?: string | null
          official_url?: string | null
          processing_fee_text?: string | null
          product_name?: string | null
          provider_name?: string
          repayment_period_text?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_education_finance_options_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_emergency_services: {
        Row: {
          availability: string | null
          coverage_area: string | null
          created_at: string
          data_last_verified_at: string | null
          emergency_number: string | null
          id: string
          institute_id: string
          location: string | null
          official_url: string | null
          phone: string | null
          provider: string | null
          response_hours: string | null
          response_protocol: string | null
          service_name: string
          service_type: string
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          availability?: string | null
          coverage_area?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          emergency_number?: string | null
          id?: string
          institute_id: string
          location?: string | null
          official_url?: string | null
          phone?: string | null
          provider?: string | null
          response_hours?: string | null
          response_protocol?: string | null
          service_name: string
          service_type: string
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          availability?: string | null
          coverage_area?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          emergency_number?: string | null
          id?: string
          institute_id?: string
          location?: string | null
          official_url?: string | null
          phone?: string | null
          provider?: string | null
          response_hours?: string | null
          response_protocol?: string | null
          service_name?: string
          service_type?: string
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_emergency_services_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_energy_data: {
        Row: {
          capacity_unit: string | null
          capacity_value: number | null
          consumption_unit: string | null
          consumption_value: number | null
          coverage_scope: string | null
          created_at: string
          data_last_verified_at: string | null
          energy_source: string
          generation_unit: string | null
          generation_value: number | null
          id: string
          institute_id: string
          renewable: boolean | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          capacity_unit?: string | null
          capacity_value?: number | null
          consumption_unit?: string | null
          consumption_value?: number | null
          coverage_scope?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          energy_source: string
          generation_unit?: string | null
          generation_value?: number | null
          id?: string
          institute_id: string
          renewable?: boolean | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          capacity_unit?: string | null
          capacity_value?: number | null
          consumption_unit?: string | null
          consumption_value?: number | null
          coverage_scope?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          energy_source?: string
          generation_unit?: string | null
          generation_value?: number | null
          id?: string
          institute_id?: string
          renewable?: boolean | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_energy_data_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_evaluation_rules: {
        Row: {
          attendance_requirement: string | null
          component_weight: number | null
          course_code: string | null
          created_at: string
          data_last_verified_at: string | null
          evaluation_component: string
          grading_method: string | null
          id: string
          institute_id: string
          makeup_rule: string | null
          marks_or_scale: number | null
          pass_requirement: string | null
          program_name: string | null
          revaluation_rule: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          attendance_requirement?: string | null
          component_weight?: number | null
          course_code?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          evaluation_component: string
          grading_method?: string | null
          id?: string
          institute_id: string
          makeup_rule?: string | null
          marks_or_scale?: number | null
          pass_requirement?: string | null
          program_name?: string | null
          revaluation_rule?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          attendance_requirement?: string | null
          component_weight?: number | null
          course_code?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          evaluation_component?: string
          grading_method?: string | null
          id?: string
          institute_id?: string
          makeup_rule?: string | null
          marks_or_scale?: number | null
          pass_requirement?: string | null
          program_name?: string | null
          revaluation_rule?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_evaluation_rules_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_exam_milestones: {
        Row: {
          created_at: string
          exam: string
          exam_date: string
          id: string
          notes: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam?: string
          exam_date: string
          id?: string
          notes?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam?: string
          exam_date?: string
          id?: string
          notes?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jee_exam_schedules: {
        Row: {
          academic_year: string
          admit_card_date: string | null
          created_at: string
          data_last_verified_at: string | null
          exam_end: string | null
          exam_name: string
          exam_start: string | null
          exam_type: string | null
          id: string
          institute_id: string
          program_name: string | null
          registration_deadline: string | null
          result_date: string | null
          semester: number | null
          source_label: string | null
          source_url: string | null
          supplementary_exam_date: string | null
        }
        Insert: {
          academic_year: string
          admit_card_date?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          exam_end?: string | null
          exam_name: string
          exam_start?: string | null
          exam_type?: string | null
          id?: string
          institute_id: string
          program_name?: string | null
          registration_deadline?: string | null
          result_date?: string | null
          semester?: number | null
          source_label?: string | null
          source_url?: string | null
          supplementary_exam_date?: string | null
        }
        Update: {
          academic_year?: string
          admit_card_date?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          exam_end?: string | null
          exam_name?: string
          exam_start?: string | null
          exam_type?: string | null
          id?: string
          institute_id?: string
          program_name?: string | null
          registration_deadline?: string | null
          result_date?: string | null
          semester?: number | null
          source_label?: string | null
          source_url?: string | null
          supplementary_exam_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_exam_schedules_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_exchange_participation_history: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          duration_text: string | null
          exchange_program: string
          faculty_inbound: number | null
          faculty_outbound: number | null
          funding_support: string | null
          id: string
          inbound_students: number | null
          institute_id: string
          outbound_students: number | null
          partner_country: string | null
          partner_institute: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          duration_text?: string | null
          exchange_program: string
          faculty_inbound?: number | null
          faculty_outbound?: number | null
          funding_support?: string | null
          id?: string
          inbound_students?: number | null
          institute_id: string
          outbound_students?: number | null
          partner_country?: string | null
          partner_institute?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          duration_text?: string | null
          exchange_program?: string
          faculty_inbound?: number | null
          faculty_outbound?: number | null
          funding_support?: string | null
          id?: string
          inbound_students?: number | null
          institute_id?: string
          outbound_students?: number | null
          partner_country?: string | null
          partner_institute?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_exchange_participation_history_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_extracurricular_achievements: {
        Row: {
          achievement_date: string | null
          achievement_name: string
          achievement_type: string | null
          award_or_result: string | null
          competition_name: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          id: string
          institute_id: string
          official_url: string | null
          organization_name: string | null
          source_label: string | null
          source_url: string | null
          student_or_team: string | null
          year: number | null
        }
        Insert: {
          achievement_date?: string | null
          achievement_name: string
          achievement_type?: string | null
          award_or_result?: string | null
          competition_name?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          organization_name?: string | null
          source_label?: string | null
          source_url?: string | null
          student_or_team?: string | null
          year?: number | null
        }
        Update: {
          achievement_date?: string | null
          achievement_name?: string
          achievement_type?: string | null
          award_or_result?: string | null
          competition_name?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          organization_name?: string | null
          source_label?: string | null
          source_url?: string | null
          student_or_team?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_extracurricular_achievements_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_faculty_awards: {
        Row: {
          award_category: string | null
          award_name: string
          awarding_body: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          faculty_id: string | null
          faculty_name: string | null
          id: string
          institute_id: string
          official_url: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          award_category?: string | null
          award_name: string
          awarding_body?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          faculty_id?: string | null
          faculty_name?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          award_category?: string | null
          award_name?: string
          awarding_body?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          faculty_id?: string | null
          faculty_name?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_faculty_awards_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "jee_faculty_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_faculty_awards_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_faculty_development: {
        Row: {
          application_url: string | null
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          description: string | null
          duration_text: string | null
          eligibility: string | null
          id: string
          institute_id: string
          program_name: string
          program_type: string | null
          source_label: string | null
          source_url: string | null
          target_group: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          application_url?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          duration_text?: string | null
          eligibility?: string | null
          id?: string
          institute_id: string
          program_name: string
          program_type?: string | null
          source_label?: string | null
          source_url?: string | null
          target_group?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          application_url?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          duration_text?: string | null
          eligibility?: string | null
          id?: string
          institute_id?: string
          program_name?: string
          program_type?: string | null
          source_label?: string | null
          source_url?: string | null
          target_group?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_faculty_development_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_faculty_profiles: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          designation: string | null
          email_public: string | null
          employment_type: string | null
          experience_years: number | null
          faculty_code: string | null
          faculty_name: string
          id: string
          institute_id: string
          joining_year: number | null
          office_hours: string | null
          office_location: string | null
          profile_url: string | null
          qualification_summary: string | null
          research_areas: string[] | null
          source_label: string | null
          source_url: string | null
          specialization: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          designation?: string | null
          email_public?: string | null
          employment_type?: string | null
          experience_years?: number | null
          faculty_code?: string | null
          faculty_name: string
          id?: string
          institute_id: string
          joining_year?: number | null
          office_hours?: string | null
          office_location?: string | null
          profile_url?: string | null
          qualification_summary?: string | null
          research_areas?: string[] | null
          source_label?: string | null
          source_url?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          designation?: string | null
          email_public?: string | null
          employment_type?: string | null
          experience_years?: number | null
          faculty_code?: string | null
          faculty_name?: string
          id?: string
          institute_id?: string
          joining_year?: number | null
          office_hours?: string | null
          office_location?: string | null
          profile_url?: string | null
          qualification_summary?: string | null
          research_areas?: string[] | null
          source_label?: string | null
          source_url?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_faculty_profiles_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_faculty_research: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          data_year: number | null
          department_name: string | null
          designation: string | null
          faculty_name: string
          id: string
          institute_id: string
          orcid_url: string | null
          patents_count: number | null
          profile_url: string | null
          projects_count: number | null
          publications_count: number | null
          research_areas: string[] | null
          scholar_url: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          data_year?: number | null
          department_name?: string | null
          designation?: string | null
          faculty_name: string
          id?: string
          institute_id: string
          orcid_url?: string | null
          patents_count?: number | null
          profile_url?: string | null
          projects_count?: number | null
          publications_count?: number | null
          research_areas?: string[] | null
          scholar_url?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          data_year?: number | null
          department_name?: string | null
          designation?: string | null
          faculty_name?: string
          id?: string
          institute_id?: string
          orcid_url?: string | null
          patents_count?: number | null
          profile_url?: string | null
          projects_count?: number | null
          publications_count?: number | null
          research_areas?: string[] | null
          scholar_url?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_faculty_research_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_faculty_statistics_history: {
        Row: {
          assistant_professor_count: number | null
          associate_professor_count: number | null
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          faculty_total: number | null
          id: string
          institute_id: string
          international_faculty_count: number | null
          professor_count: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          student_faculty_ratio: number | null
          visiting_faculty_count: number | null
          year: number
        }
        Insert: {
          assistant_professor_count?: number | null
          associate_professor_count?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          faculty_total?: number | null
          id?: string
          institute_id: string
          international_faculty_count?: number | null
          professor_count?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          student_faculty_ratio?: number | null
          visiting_faculty_count?: number | null
          year: number
        }
        Update: {
          assistant_professor_count?: number | null
          associate_professor_count?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          faculty_total?: number | null
          id?: string
          institute_id?: string
          international_faculty_count?: number | null
          professor_count?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          student_faculty_ratio?: number | null
          visiting_faculty_count?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_faculty_statistics_history_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_fee_components: {
        Row: {
          amount: number | null
          category: string | null
          created_at: string
          currency: string
          description: string | null
          fee_component: string
          frequency: string | null
          id: string
          institute_id: string | null
          mandatory: boolean | null
          program_id: string | null
          quota: string | null
          refundable: boolean | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          amount?: number | null
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          fee_component: string
          frequency?: string | null
          id?: string
          institute_id?: string | null
          mandatory?: boolean | null
          program_id?: string | null
          quota?: string | null
          refundable?: boolean | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          amount?: number | null
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          fee_component?: string
          frequency?: string | null
          id?: string
          institute_id?: string | null
          mandatory?: boolean | null
          program_id?: string | null
          quota?: string | null
          refundable?: boolean | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_fee_components_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_fee_components_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_fee_data: {
        Row: {
          academic_year: string | null
          amount: number | null
          applicable_from: string | null
          applicable_to: string | null
          category: string | null
          category_code: string | null
          city: string | null
          counselling: string
          created_at: string
          currency: string
          data_last_verified_at: string | null
          description: string | null
          fee_type: string
          frequency: string | null
          gender_code: string | null
          id: string
          institute_id: string | null
          institute_name: string
          institute_type: string | null
          mandatory: boolean | null
          program_code: string | null
          program_name: string | null
          quota: string | null
          quota_code: string | null
          refundable: boolean | null
          semester_number: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          state: string | null
          updated_at: string
          waiver_available: boolean | null
          waiver_condition: string | null
          year: number
        }
        Insert: {
          academic_year?: string | null
          amount?: number | null
          applicable_from?: string | null
          applicable_to?: string | null
          category?: string | null
          category_code?: string | null
          city?: string | null
          counselling?: string
          created_at?: string
          currency?: string
          data_last_verified_at?: string | null
          description?: string | null
          fee_type: string
          frequency?: string | null
          gender_code?: string | null
          id?: string
          institute_id?: string | null
          institute_name: string
          institute_type?: string | null
          mandatory?: boolean | null
          program_code?: string | null
          program_name?: string | null
          quota?: string | null
          quota_code?: string | null
          refundable?: boolean | null
          semester_number?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          state?: string | null
          updated_at?: string
          waiver_available?: boolean | null
          waiver_condition?: string | null
          year?: number
        }
        Update: {
          academic_year?: string | null
          amount?: number | null
          applicable_from?: string | null
          applicable_to?: string | null
          category?: string | null
          category_code?: string | null
          city?: string | null
          counselling?: string
          created_at?: string
          currency?: string
          data_last_verified_at?: string | null
          description?: string | null
          fee_type?: string
          frequency?: string | null
          gender_code?: string | null
          id?: string
          institute_id?: string | null
          institute_name?: string
          institute_type?: string | null
          mandatory?: boolean | null
          program_code?: string | null
          program_name?: string | null
          quota?: string | null
          quota_code?: string | null
          refundable?: boolean | null
          semester_number?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          state?: string | null
          updated_at?: string
          waiver_available?: boolean | null
          waiver_condition?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_fee_data_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_fee_refund_rules: {
        Row: {
          cancellation_stage: string | null
          created_at: string
          data_last_verified_at: string | null
          deadline: string | null
          deduction_amount: number | null
          fee_component: string | null
          id: string
          institute_id: string | null
          processing_time: string | null
          refund_amount: number | null
          refund_condition: string | null
          refundable: boolean | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          cancellation_stage?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          deadline?: string | null
          deduction_amount?: number | null
          fee_component?: string | null
          id?: string
          institute_id?: string | null
          processing_time?: string | null
          refund_amount?: number | null
          refund_condition?: string | null
          refundable?: boolean | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          cancellation_stage?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          deadline?: string | null
          deduction_amount?: number | null
          fee_component?: string | null
          id?: string
          institute_id?: string | null
          processing_time?: string | null
          refund_amount?: number | null
          refund_condition?: string | null
          refundable?: boolean | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_fee_refund_rules_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_fee_schedules: {
        Row: {
          academic_year: string | null
          amount: number
          category: string | null
          created_at: string
          currency: string
          data_last_verified_at: string | null
          due_stage: string | null
          fee_component: string
          frequency: string | null
          id: string
          institute_id: string | null
          mandatory: boolean
          program_id: string | null
          quota: string | null
          refundable: boolean
          semester_number: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          waiver_available: boolean
          waiver_condition: string | null
          year: number
        }
        Insert: {
          academic_year?: string | null
          amount: number
          category?: string | null
          created_at?: string
          currency?: string
          data_last_verified_at?: string | null
          due_stage?: string | null
          fee_component: string
          frequency?: string | null
          id?: string
          institute_id?: string | null
          mandatory?: boolean
          program_id?: string | null
          quota?: string | null
          refundable?: boolean
          semester_number?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          waiver_available?: boolean
          waiver_condition?: string | null
          year: number
        }
        Update: {
          academic_year?: string | null
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string
          data_last_verified_at?: string | null
          due_stage?: string | null
          fee_component?: string
          frequency?: string | null
          id?: string
          institute_id?: string | null
          mandatory?: boolean
          program_id?: string | null
          quota?: string | null
          refundable?: boolean
          semester_number?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          waiver_available?: boolean
          waiver_condition?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_fee_schedules_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_fee_schedules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_fee_waivers: {
        Row: {
          application_method: string | null
          category: string | null
          continuation_condition: string | null
          covered_fee_components: string | null
          created_at: string
          data_last_verified_at: string | null
          deadline: string | null
          eligibility: string | null
          id: string
          institute_id: string | null
          maximum_amount: number | null
          program_id: string | null
          required_documents: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          waiver_name: string
          waiver_percent: number | null
          waiver_type: string
          year: number
        }
        Insert: {
          application_method?: string | null
          category?: string | null
          continuation_condition?: string | null
          covered_fee_components?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          deadline?: string | null
          eligibility?: string | null
          id?: string
          institute_id?: string | null
          maximum_amount?: number | null
          program_id?: string | null
          required_documents?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          waiver_name: string
          waiver_percent?: number | null
          waiver_type: string
          year: number
        }
        Update: {
          application_method?: string | null
          category?: string | null
          continuation_condition?: string | null
          covered_fee_components?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          deadline?: string | null
          eligibility?: string | null
          id?: string
          institute_id?: string | null
          maximum_amount?: number | null
          program_id?: string | null
          required_documents?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          waiver_name?: string
          waiver_percent?: number | null
          waiver_type?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_fee_waivers_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_fee_waivers_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_financial_aid_contacts: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          email: string | null
          id: string
          institute_id: string
          office_hours: string | null
          office_location: string | null
          office_name: string
          officer_name: string | null
          phone: string | null
          service_type: string | null
          source_label: string | null
          source_url: string | null
          website_url: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          email?: string | null
          id?: string
          institute_id: string
          office_hours?: string | null
          office_location?: string | null
          office_name: string
          officer_name?: string | null
          phone?: string | null
          service_type?: string | null
          source_label?: string | null
          source_url?: string | null
          website_url?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          email?: string | null
          id?: string
          institute_id?: string
          office_hours?: string | null
          office_location?: string | null
          office_name?: string
          officer_name?: string | null
          phone?: string | null
          service_type?: string | null
          source_label?: string | null
          source_url?: string | null
          website_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_financial_aid_contacts_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_financial_aid_programs: {
        Row: {
          academic_requirement: string | null
          aid_name: string
          aid_type: string
          application_deadline: string | null
          application_method: string | null
          application_start: string | null
          application_url: string | null
          attendance_requirement: string | null
          benefit_amount: number | null
          benefit_currency: string | null
          benefit_frequency: string | null
          caste_category: string | null
          category: string | null
          continuation_conditions: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          disability_requirement: string | null
          domicile_requirement: string | null
          eligibility_summary: string | null
          gender_requirement: string | null
          hostel_waiver_percent: number | null
          id: string
          income_currency: string | null
          income_limit: number | null
          income_period: string | null
          institute_id: string | null
          maximum_benefit: number | null
          merit_requirement: string | null
          mess_waiver_percent: number | null
          nationality_requirement: string | null
          program_id: string | null
          provider_name: string
          provider_type: string
          refund_or_adjustment_rule: string | null
          renewal_requirement: string | null
          required_documents: string | null
          result_date: string | null
          selection_process: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          stacking_rule: string | null
          tuition_waiver_percent: number | null
          updated_at: string
          year: number
        }
        Insert: {
          academic_requirement?: string | null
          aid_name: string
          aid_type: string
          application_deadline?: string | null
          application_method?: string | null
          application_start?: string | null
          application_url?: string | null
          attendance_requirement?: string | null
          benefit_amount?: number | null
          benefit_currency?: string | null
          benefit_frequency?: string | null
          caste_category?: string | null
          category?: string | null
          continuation_conditions?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          disability_requirement?: string | null
          domicile_requirement?: string | null
          eligibility_summary?: string | null
          gender_requirement?: string | null
          hostel_waiver_percent?: number | null
          id?: string
          income_currency?: string | null
          income_limit?: number | null
          income_period?: string | null
          institute_id?: string | null
          maximum_benefit?: number | null
          merit_requirement?: string | null
          mess_waiver_percent?: number | null
          nationality_requirement?: string | null
          program_id?: string | null
          provider_name: string
          provider_type: string
          refund_or_adjustment_rule?: string | null
          renewal_requirement?: string | null
          required_documents?: string | null
          result_date?: string | null
          selection_process?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          stacking_rule?: string | null
          tuition_waiver_percent?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          academic_requirement?: string | null
          aid_name?: string
          aid_type?: string
          application_deadline?: string | null
          application_method?: string | null
          application_start?: string | null
          application_url?: string | null
          attendance_requirement?: string | null
          benefit_amount?: number | null
          benefit_currency?: string | null
          benefit_frequency?: string | null
          caste_category?: string | null
          category?: string | null
          continuation_conditions?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          disability_requirement?: string | null
          domicile_requirement?: string | null
          eligibility_summary?: string | null
          gender_requirement?: string | null
          hostel_waiver_percent?: number | null
          id?: string
          income_currency?: string | null
          income_limit?: number | null
          income_period?: string | null
          institute_id?: string | null
          maximum_benefit?: number | null
          merit_requirement?: string | null
          mess_waiver_percent?: number | null
          nationality_requirement?: string | null
          program_id?: string | null
          provider_name?: string
          provider_type?: string
          refund_or_adjustment_rule?: string | null
          renewal_requirement?: string | null
          required_documents?: string | null
          result_date?: string | null
          selection_process?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          stacking_rule?: string | null
          tuition_waiver_percent?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_financial_aid_programs_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_financial_aid_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_financial_statistics_history: {
        Row: {
          amount: number | null
          category: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_name: string
          metric_unit: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          amount?: number | null
          category?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_name: string
          metric_unit?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          amount?: number | null
          category?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_name?: string
          metric_unit?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_financial_statistics_history_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_fire_safety_data: {
        Row: {
          certificate_number: string | null
          certificate_valid_until: string | null
          coverage_area: string | null
          created_at: string
          data_last_verified_at: string | null
          emergency_contact: string | null
          equipment_details: string | null
          evacuation_plan_url: string | null
          facility_name: string | null
          fire_system_type: string
          id: string
          inspection_date: string | null
          institute_id: string
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          certificate_number?: string | null
          certificate_valid_until?: string | null
          coverage_area?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          emergency_contact?: string | null
          equipment_details?: string | null
          evacuation_plan_url?: string | null
          facility_name?: string | null
          fire_system_type: string
          id?: string
          inspection_date?: string | null
          institute_id: string
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          certificate_number?: string | null
          certificate_valid_until?: string | null
          coverage_area?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          emergency_contact?: string | null
          equipment_details?: string | null
          evacuation_plan_url?: string | null
          facility_name?: string | null
          fire_system_type?: string
          id?: string
          inspection_date?: string | null
          institute_id?: string
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_fire_safety_data_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_food_cost_benchmarks: {
        Row: {
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          food_category: string | null
          frequency: string | null
          id: string
          institute_id: string
          item_name: string | null
          locality: string | null
          max_amount: number | null
          meal_type: string
          methodology: string | null
          min_amount: number | null
          sample_size: number | null
          source_label: string | null
          source_url: string | null
          typical_amount: number | null
          year: number
        }
        Insert: {
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          food_category?: string | null
          frequency?: string | null
          id?: string
          institute_id: string
          item_name?: string | null
          locality?: string | null
          max_amount?: number | null
          meal_type: string
          methodology?: string | null
          min_amount?: number | null
          sample_size?: number | null
          source_label?: string | null
          source_url?: string | null
          typical_amount?: number | null
          year: number
        }
        Update: {
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          food_category?: string | null
          frequency?: string | null
          id?: string
          institute_id?: string
          item_name?: string | null
          locality?: string | null
          max_amount?: number | null
          meal_type?: string
          methodology?: string | null
          min_amount?: number | null
          sample_size?: number | null
          source_label?: string | null
          source_url?: string | null
          typical_amount?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_food_cost_benchmarks_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_formula_vault: {
        Row: {
          chapter_id: string | null
          created_at: string
          difficulty: string
          explanation: string | null
          formula: string
          id: string
          is_favorite: boolean
          last_reviewed_at: string | null
          review_count: number
          subject: string
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          difficulty?: string
          explanation?: string | null
          formula: string
          id?: string
          is_favorite?: boolean
          last_reviewed_at?: string | null
          review_count?: number
          subject: string
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          difficulty?: string
          explanation?: string | null
          formula?: string
          id?: string
          is_favorite?: boolean
          last_reviewed_at?: string | null
          review_count?: number
          subject?: string
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_formula_vault_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_formula_vault_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_global_partnerships: {
        Row: {
          active: boolean | null
          agreement_type: string | null
          city: string | null
          country: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          end_date: string | null
          id: string
          institute_id: string
          official_url: string | null
          partner_name: string
          partner_type: string | null
          partnership_type: string | null
          source_label: string | null
          source_url: string | null
          start_date: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          active?: boolean | null
          agreement_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          partner_name: string
          partner_type?: string | null
          partnership_type?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          active?: boolean | null
          agreement_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          partner_name?: string
          partner_type?: string | null
          partnership_type?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_global_partnerships_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_global_rankings_profiles: {
        Row: {
          category: string | null
          created_at: string
          data_last_verified_at: string | null
          global_partnerships_count: number | null
          id: string
          institute_id: string
          international_collaborations_count: number | null
          international_faculty_count: number | null
          international_students_count: number | null
          rank: number | null
          ranking_body: string
          ranking_name: string | null
          score: number | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          global_partnerships_count?: number | null
          id?: string
          institute_id: string
          international_collaborations_count?: number | null
          international_faculty_count?: number | null
          international_students_count?: number | null
          rank?: number | null
          ranking_body: string
          ranking_name?: string | null
          score?: number | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          category?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          global_partnerships_count?: number | null
          id?: string
          institute_id?: string
          international_collaborations_count?: number | null
          international_faculty_count?: number | null
          international_students_count?: number | null
          rank?: number | null
          ranking_body?: string
          ranking_name?: string | null
          score?: number | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_global_rankings_profiles_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_governance_bodies: {
        Row: {
          body_name: string
          body_type: string
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          legal_basis: string | null
          meeting_frequency: string | null
          official_url: string | null
          role_summary: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          body_name: string
          body_type: string
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          legal_basis?: string | null
          meeting_frequency?: string | null
          official_url?: string | null
          role_summary?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          body_name?: string
          body_type?: string
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          legal_basis?: string | null
          meeting_frequency?: string | null
          official_url?: string | null
          role_summary?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_governance_bodies_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_governance_documents: {
        Row: {
          approval_body: string | null
          approval_date: string | null
          created_at: string
          data_last_verified_at: string | null
          document_type: string
          document_url: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          institute_id: string
          source_document: string | null
          source_label: string | null
          source_url: string | null
          title: string
          year: number | null
        }
        Insert: {
          approval_body?: string | null
          approval_date?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          document_type: string
          document_url?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          institute_id: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          title: string
          year?: number | null
        }
        Update: {
          approval_body?: string | null
          approval_date?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          document_type?: string
          document_url?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          institute_id?: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          title?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_governance_documents_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_governance_members: {
        Row: {
          appointment_date: string | null
          body_id: string
          created_at: string
          data_last_verified_at: string | null
          department: string | null
          designation: string | null
          id: string
          institute_id: string
          member_name: string
          member_type: string | null
          profile_url: string | null
          source_label: string | null
          source_url: string | null
          term_end: string | null
          term_start: string | null
          year: number | null
        }
        Insert: {
          appointment_date?: string | null
          body_id: string
          created_at?: string
          data_last_verified_at?: string | null
          department?: string | null
          designation?: string | null
          id?: string
          institute_id: string
          member_name: string
          member_type?: string | null
          profile_url?: string | null
          source_label?: string | null
          source_url?: string | null
          term_end?: string | null
          term_start?: string | null
          year?: number | null
        }
        Update: {
          appointment_date?: string | null
          body_id?: string
          created_at?: string
          data_last_verified_at?: string | null
          department?: string | null
          designation?: string | null
          id?: string
          institute_id?: string
          member_name?: string
          member_type?: string | null
          profile_url?: string | null
          source_label?: string | null
          source_url?: string | null
          term_end?: string | null
          term_start?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_governance_members_body_id_fkey"
            columns: ["body_id"]
            isOneToOne: false
            referencedRelation: "jee_governance_bodies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_governance_members_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_governance_officers: {
        Row: {
          appointment_end: string | null
          appointment_start: string | null
          created_at: string
          data_last_verified_at: string | null
          department: string | null
          designation: string | null
          id: string
          institute_id: string
          office_type: string
          officer_name: string
          official_profile_url: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          appointment_end?: string | null
          appointment_start?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          department?: string | null
          designation?: string | null
          id?: string
          institute_id: string
          office_type: string
          officer_name: string
          official_profile_url?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          appointment_end?: string | null
          appointment_start?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          department?: string | null
          designation?: string | null
          id?: string
          institute_id?: string
          office_type?: string
          officer_name?: string
          official_profile_url?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_governance_officers_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_governance_structure_history: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          department_count: number | null
          id: string
          institute_id: string
          leadership_role: string | null
          parent_structure: string | null
          reporting_summary: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          structure_name: string
          structure_type: string
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          department_count?: number | null
          id?: string
          institute_id: string
          leadership_role?: string | null
          parent_structure?: string | null
          reporting_summary?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          structure_name: string
          structure_type: string
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          department_count?: number | null
          id?: string
          institute_id?: string
          leadership_role?: string | null
          parent_structure?: string | null
          reporting_summary?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          structure_name?: string
          structure_type?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_governance_structure_history_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_graduate_outcomes: {
        Row: {
          average_value: number | null
          created_at: string
          data_last_verified_at: string | null
          graduation_year: number | null
          id: string
          institute_id: string
          median_value: number | null
          methodology: string | null
          outcome_category: string | null
          outcome_type: string
          percentage: number | null
          population: string | null
          program_name: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          student_count: number | null
          unit: string | null
          year: number
        }
        Insert: {
          average_value?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          graduation_year?: number | null
          id?: string
          institute_id: string
          median_value?: number | null
          methodology?: string | null
          outcome_category?: string | null
          outcome_type: string
          percentage?: number | null
          population?: string | null
          program_name?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          student_count?: number | null
          unit?: string | null
          year: number
        }
        Update: {
          average_value?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          graduation_year?: number | null
          id?: string
          institute_id?: string
          median_value?: number | null
          methodology?: string | null
          outcome_category?: string | null
          outcome_type?: string
          percentage?: number | null
          population?: string | null
          program_name?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          student_count?: number | null
          unit?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_graduate_outcomes_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_graduate_success_indicators: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          id: string
          indicator_name: string
          indicator_unit: string | null
          indicator_value: number | null
          institute_id: string
          methodology: string | null
          population: string | null
          program_name: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          indicator_name: string
          indicator_unit?: string | null
          indicator_value?: number | null
          institute_id: string
          methodology?: string | null
          population?: string | null
          program_name?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          indicator_name?: string
          indicator_unit?: string | null
          indicator_value?: number | null
          institute_id?: string
          methodology?: string | null
          population?: string | null
          program_name?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_graduate_success_indicators_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_graduation_outcome_history: {
        Row: {
          cohort_year: number
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          program_name: string | null
          source_label: string | null
          source_url: string | null
        }
        Insert: {
          cohort_year: number
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          program_name?: string | null
          source_label?: string | null
          source_url?: string | null
        }
        Update: {
          cohort_year?: number
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          program_name?: string | null
          source_label?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_graduation_outcome_history_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_graduation_requirements: {
        Row: {
          backlog_rule: string | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          internship_requirement: string | null
          minimum_cgpa: number | null
          minimum_credits: number | null
          minimum_percentage: number | null
          other_requirements: string | null
          program_name: string | null
          project_requirement: string | null
          required_semesters: number | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          backlog_rule?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          internship_requirement?: string | null
          minimum_cgpa?: number | null
          minimum_credits?: number | null
          minimum_percentage?: number | null
          other_requirements?: string | null
          program_name?: string | null
          project_requirement?: string | null
          required_semesters?: number | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          backlog_rule?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          internship_requirement?: string | null
          minimum_cgpa?: number | null
          minimum_credits?: number | null
          minimum_percentage?: number | null
          other_requirements?: string | null
          program_name?: string | null
          project_requirement?: string | null
          required_semesters?: number | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_graduation_requirements_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_green_buildings: {
        Row: {
          area_unit: string | null
          building_name: string
          certification_body: string | null
          certification_date: string | null
          certification_level: string | null
          certification_name: string | null
          certified_area: number | null
          created_at: string
          data_last_verified_at: string | null
          energy_features: string | null
          id: string
          institute_id: string
          material_features: string | null
          passive_design_features: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          validity_until: string | null
          water_features: string | null
          year: number | null
        }
        Insert: {
          area_unit?: string | null
          building_name: string
          certification_body?: string | null
          certification_date?: string | null
          certification_level?: string | null
          certification_name?: string | null
          certified_area?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          energy_features?: string | null
          id?: string
          institute_id: string
          material_features?: string | null
          passive_design_features?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          validity_until?: string | null
          water_features?: string | null
          year?: number | null
        }
        Update: {
          area_unit?: string | null
          building_name?: string
          certification_body?: string | null
          certification_date?: string | null
          certification_level?: string | null
          certification_name?: string | null
          certified_area?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          energy_features?: string | null
          id?: string
          institute_id?: string
          material_features?: string | null
          passive_design_features?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          validity_until?: string | null
          water_features?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_green_buildings_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_green_transport: {
        Row: {
          charging_points: number | null
          coverage: string | null
          created_at: string
          data_last_verified_at: string | null
          electric: boolean | null
          emissions_data: string | null
          fuel_type: string | null
          id: string
          institute_id: string
          source_label: string | null
          source_url: string | null
          transport_type: string
          usage_policy: string | null
          vehicle_count: number | null
          year: number | null
        }
        Insert: {
          charging_points?: number | null
          coverage?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          electric?: boolean | null
          emissions_data?: string | null
          fuel_type?: string | null
          id?: string
          institute_id: string
          source_label?: string | null
          source_url?: string | null
          transport_type: string
          usage_policy?: string | null
          vehicle_count?: number | null
          year?: number | null
        }
        Update: {
          charging_points?: number | null
          coverage?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          electric?: boolean | null
          emissions_data?: string | null
          fuel_type?: string | null
          id?: string
          institute_id?: string
          source_label?: string | null
          source_url?: string | null
          transport_type?: string
          usage_policy?: string | null
          vehicle_count?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_green_transport_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_grocery_markets: {
        Row: {
          contact_phone: string | null
          created_at: string
          data_last_verified_at: string | null
          delivery_available: boolean | null
          distance_from_campus_km: number | null
          id: string
          institute_id: string
          locality: string | null
          market_name: string
          market_type: string | null
          opening_hours: string | null
          source_label: string | null
          source_url: string | null
          typical_price_level: string | null
          website_url: string | null
          year: number | null
        }
        Insert: {
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          delivery_available?: boolean | null
          distance_from_campus_km?: number | null
          id?: string
          institute_id: string
          locality?: string | null
          market_name: string
          market_type?: string | null
          opening_hours?: string | null
          source_label?: string | null
          source_url?: string | null
          typical_price_level?: string | null
          website_url?: string | null
          year?: number | null
        }
        Update: {
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          delivery_available?: boolean | null
          distance_from_campus_km?: number | null
          id?: string
          institute_id?: string
          locality?: string | null
          market_name?: string
          market_type?: string | null
          opening_hours?: string | null
          source_label?: string | null
          source_url?: string | null
          typical_price_level?: string | null
          website_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_grocery_markets_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_hackathons: {
        Row: {
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          domain: string | null
          eligibility: string | null
          event_end: string | null
          event_start: string | null
          format: string | null
          hackathon_name: string
          id: string
          institute_id: string
          official_url: string | null
          organizer: string | null
          prize_pool_amount: number | null
          prizes: string | null
          registration_deadline: string | null
          registration_start: string | null
          registration_url: string | null
          source_label: string | null
          source_url: string | null
          sponsorship: string | null
          team_size_rule: string | null
          theme: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          domain?: string | null
          eligibility?: string | null
          event_end?: string | null
          event_start?: string | null
          format?: string | null
          hackathon_name: string
          id?: string
          institute_id: string
          official_url?: string | null
          organizer?: string | null
          prize_pool_amount?: number | null
          prizes?: string | null
          registration_deadline?: string | null
          registration_start?: string | null
          registration_url?: string | null
          source_label?: string | null
          source_url?: string | null
          sponsorship?: string | null
          team_size_rule?: string | null
          theme?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          domain?: string | null
          eligibility?: string | null
          event_end?: string | null
          event_start?: string | null
          format?: string | null
          hackathon_name?: string
          id?: string
          institute_id?: string
          official_url?: string | null
          organizer?: string | null
          prize_pool_amount?: number | null
          prizes?: string | null
          registration_deadline?: string | null
          registration_start?: string | null
          registration_url?: string | null
          source_label?: string | null
          source_url?: string | null
          sponsorship?: string | null
          team_size_rule?: string | null
          theme?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_hackathons_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_health_services: {
        Row: {
          appointment_required: boolean | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          data_last_verified_at: string | null
          eligibility: string | null
          emergency_available: boolean | null
          fee_details: string | null
          id: string
          institute_id: string
          location: string | null
          official_url: string | null
          operating_hours: string | null
          provider_name: string | null
          service_name: string
          service_type: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          appointment_required?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          eligibility?: string | null
          emergency_available?: boolean | null
          fee_details?: string | null
          id?: string
          institute_id: string
          location?: string | null
          official_url?: string | null
          operating_hours?: string | null
          provider_name?: string | null
          service_name: string
          service_type?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          appointment_required?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          eligibility?: string | null
          emergency_available?: boolean | null
          fee_details?: string | null
          id?: string
          institute_id?: string
          location?: string | null
          official_url?: string | null
          operating_hours?: string | null
          provider_name?: string | null
          service_name?: string
          service_type?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_health_services_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_higher_studies_outcomes: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          destination_name: string | null
          destination_type: string | null
          field: string | null
          id: string
          institute_id: string
          methodology: string | null
          percentage: number | null
          program_name: string | null
          scholarship_count: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          student_count: number | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          destination_name?: string | null
          destination_type?: string | null
          field?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          percentage?: number | null
          program_name?: string | null
          scholarship_count?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          student_count?: number | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          destination_name?: string | null
          destination_type?: string | null
          field?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          percentage?: number | null
          program_name?: string | null
          scholarship_count?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          student_count?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_higher_studies_outcomes_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_historical_cutoff_snapshots: {
        Row: {
          category: string | null
          closing_rank: number | null
          counselling: string
          created_at: string
          data_last_verified_at: string | null
          gender: string | null
          id: string
          institute_id: string | null
          opening_rank: number | null
          program_id: string | null
          program_name: string
          quota: string | null
          rank_type: string | null
          round_number: number | null
          seat_type: string | null
          seats_available: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          category?: string | null
          closing_rank?: number | null
          counselling: string
          created_at?: string
          data_last_verified_at?: string | null
          gender?: string | null
          id?: string
          institute_id?: string | null
          opening_rank?: number | null
          program_id?: string | null
          program_name: string
          quota?: string | null
          rank_type?: string | null
          round_number?: number | null
          seat_type?: string | null
          seats_available?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          category?: string | null
          closing_rank?: number | null
          counselling?: string
          created_at?: string
          data_last_verified_at?: string | null
          gender?: string | null
          id?: string
          institute_id?: string | null
          opening_rank?: number | null
          program_id?: string | null
          program_name?: string
          quota?: string | null
          rank_type?: string | null
          round_number?: number | null
          seat_type?: string | null
          seats_available?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_historical_cutoff_snapshots_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_historical_cutoff_snapshots_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_hostel_alternatives: {
        Row: {
          amenities: string[] | null
          booking_url: string | null
          contact_url: string | null
          created_at: string
          data_last_verified_at: string | null
          distance_from_campus_km: number | null
          gender_policy: string | null
          id: string
          institute_id: string
          locality: string | null
          meal_cost: string | null
          meals_available: boolean | null
          monthly_price_max: number | null
          monthly_price_min: number | null
          monthly_price_typical: number | null
          property_type: string | null
          provider_name: string
          room_type: string | null
          security_deposit: number | null
          source_label: string | null
          source_url: string | null
          student_policy: string | null
          utilities: string | null
          year: number | null
        }
        Insert: {
          amenities?: string[] | null
          booking_url?: string | null
          contact_url?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          distance_from_campus_km?: number | null
          gender_policy?: string | null
          id?: string
          institute_id: string
          locality?: string | null
          meal_cost?: string | null
          meals_available?: boolean | null
          monthly_price_max?: number | null
          monthly_price_min?: number | null
          monthly_price_typical?: number | null
          property_type?: string | null
          provider_name: string
          room_type?: string | null
          security_deposit?: number | null
          source_label?: string | null
          source_url?: string | null
          student_policy?: string | null
          utilities?: string | null
          year?: number | null
        }
        Update: {
          amenities?: string[] | null
          booking_url?: string | null
          contact_url?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          distance_from_campus_km?: number | null
          gender_policy?: string | null
          id?: string
          institute_id?: string
          locality?: string | null
          meal_cost?: string | null
          meals_available?: boolean | null
          monthly_price_max?: number | null
          monthly_price_min?: number | null
          monthly_price_typical?: number | null
          property_type?: string | null
          provider_name?: string
          room_type?: string | null
          security_deposit?: number | null
          source_label?: string | null
          source_url?: string | null
          student_policy?: string | null
          utilities?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_hostel_alternatives_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_hostel_fee_data: {
        Row: {
          academic_year: string | null
          amount: number | null
          category: string | null
          created_at: string
          currency: string
          data_last_verified_at: string | null
          fee_component: string
          frequency: string | null
          hostel_type: string | null
          id: string
          institute_id: string | null
          mandatory: boolean | null
          refundable: boolean | null
          room_type: string | null
          semester_number: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          academic_year?: string | null
          amount?: number | null
          category?: string | null
          created_at?: string
          currency?: string
          data_last_verified_at?: string | null
          fee_component: string
          frequency?: string | null
          hostel_type?: string | null
          id?: string
          institute_id?: string | null
          mandatory?: boolean | null
          refundable?: boolean | null
          room_type?: string | null
          semester_number?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          academic_year?: string | null
          amount?: number | null
          category?: string | null
          created_at?: string
          currency?: string
          data_last_verified_at?: string | null
          fee_component?: string
          frequency?: string | null
          hostel_type?: string | null
          id?: string
          institute_id?: string | null
          mandatory?: boolean | null
          refundable?: boolean | null
          room_type?: string | null
          semester_number?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_hostel_fee_data_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_hostel_profiles: {
        Row: {
          accessibility_features: string | null
          accommodation_available: boolean | null
          capacity: number | null
          common_room_available: boolean | null
          created_at: string
          curfew_rule: string | null
          data_last_verified_at: string | null
          emergency_contact: string | null
          fee_notes: string | null
          gender: string | null
          hostel_name: string
          hostel_type: string | null
          id: string
          institute_id: string | null
          laundry_available: boolean | null
          medical_support: string | null
          mess_available: boolean | null
          mess_provider: string | null
          mess_type: string | null
          occupancy_rule: string | null
          recreation_facilities: string | null
          room_types: string | null
          rooms_count: number | null
          security_details: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          visitor_rule: string | null
          warden_available: boolean | null
          wifi_available: boolean | null
          year: number
        }
        Insert: {
          accessibility_features?: string | null
          accommodation_available?: boolean | null
          capacity?: number | null
          common_room_available?: boolean | null
          created_at?: string
          curfew_rule?: string | null
          data_last_verified_at?: string | null
          emergency_contact?: string | null
          fee_notes?: string | null
          gender?: string | null
          hostel_name: string
          hostel_type?: string | null
          id?: string
          institute_id?: string | null
          laundry_available?: boolean | null
          medical_support?: string | null
          mess_available?: boolean | null
          mess_provider?: string | null
          mess_type?: string | null
          occupancy_rule?: string | null
          recreation_facilities?: string | null
          room_types?: string | null
          rooms_count?: number | null
          security_details?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          visitor_rule?: string | null
          warden_available?: boolean | null
          wifi_available?: boolean | null
          year: number
        }
        Update: {
          accessibility_features?: string | null
          accommodation_available?: boolean | null
          capacity?: number | null
          common_room_available?: boolean | null
          created_at?: string
          curfew_rule?: string | null
          data_last_verified_at?: string | null
          emergency_contact?: string | null
          fee_notes?: string | null
          gender?: string | null
          hostel_name?: string
          hostel_type?: string | null
          id?: string
          institute_id?: string | null
          laundry_available?: boolean | null
          medical_support?: string | null
          mess_available?: boolean | null
          mess_provider?: string | null
          mess_type?: string | null
          occupancy_rule?: string | null
          recreation_facilities?: string | null
          room_types?: string | null
          rooms_count?: number | null
          security_details?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          visitor_rule?: string | null
          warden_available?: boolean | null
          wifi_available?: boolean | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_hostel_profiles_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_housing_cost_components: {
        Row: {
          cost_type: string
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          frequency: string | null
          housing_type: string | null
          id: string
          institute_id: string
          item_name: string
          locality: string | null
          mandatory: boolean | null
          max_amount: number | null
          methodology: string | null
          min_amount: number | null
          refundable: boolean | null
          source_label: string | null
          source_url: string | null
          typical_amount: number | null
          year: number
        }
        Insert: {
          cost_type: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          frequency?: string | null
          housing_type?: string | null
          id?: string
          institute_id: string
          item_name: string
          locality?: string | null
          mandatory?: boolean | null
          max_amount?: number | null
          methodology?: string | null
          min_amount?: number | null
          refundable?: boolean | null
          source_label?: string | null
          source_url?: string | null
          typical_amount?: number | null
          year: number
        }
        Update: {
          cost_type?: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          frequency?: string | null
          housing_type?: string | null
          id?: string
          institute_id?: string
          item_name?: string
          locality?: string | null
          mandatory?: boolean | null
          max_amount?: number | null
          methodology?: string | null
          min_amount?: number | null
          refundable?: boolean | null
          source_label?: string | null
          source_url?: string | null
          typical_amount?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_housing_cost_components_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_housing_rules: {
        Row: {
          applicable_housing_types: string[] | null
          created_at: string
          data_last_verified_at: string | null
          effective_from: string | null
          effective_until: string | null
          gender_scope: string | null
          id: string
          institute_id: string
          rule_name: string
          rule_text: string | null
          rule_type: string
          source_document: string | null
          source_label: string | null
          source_url: string | null
          student_scope: string | null
          year: number | null
        }
        Insert: {
          applicable_housing_types?: string[] | null
          created_at?: string
          data_last_verified_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          gender_scope?: string | null
          id?: string
          institute_id: string
          rule_name: string
          rule_text?: string | null
          rule_type: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          student_scope?: string | null
          year?: number | null
        }
        Update: {
          applicable_housing_types?: string[] | null
          created_at?: string
          data_last_verified_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          gender_scope?: string | null
          id?: string
          institute_id?: string
          rule_name?: string
          rule_text?: string | null
          rule_type?: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          student_scope?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_housing_rules_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_housing_services: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          data_last_verified_at: string | null
          distance_from_campus_km: number | null
          id: string
          institute_id: string
          locality: string | null
          operating_hours: string | null
          pricing_details: string | null
          provider_name: string
          service_details: string | null
          service_type: string
          source_label: string | null
          source_url: string | null
          website_url: string | null
          year: number | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          distance_from_campus_km?: number | null
          id?: string
          institute_id: string
          locality?: string | null
          operating_hours?: string | null
          pricing_details?: string | null
          provider_name: string
          service_details?: string | null
          service_type: string
          source_label?: string | null
          source_url?: string | null
          website_url?: string | null
          year?: number | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          distance_from_campus_km?: number | null
          id?: string
          institute_id?: string
          locality?: string | null
          operating_hours?: string | null
          pricing_details?: string | null
          provider_name?: string
          service_details?: string | null
          service_type?: string
          source_label?: string | null
          source_url?: string | null
          website_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_housing_services_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_inclusion_grievance_channels: {
        Row: {
          channel_name: string | null
          channel_type: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          data_last_verified_at: string | null
          escalation_process: string | null
          id: string
          institute_id: string
          office_location: string | null
          operating_hours: string | null
          portal_url: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          target_group: string | null
          year: number | null
        }
        Insert: {
          channel_name?: string | null
          channel_type: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          escalation_process?: string | null
          id?: string
          institute_id: string
          office_location?: string | null
          operating_hours?: string | null
          portal_url?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          target_group?: string | null
          year?: number | null
        }
        Update: {
          channel_name?: string | null
          channel_type?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          escalation_process?: string | null
          id?: string
          institute_id?: string
          office_location?: string | null
          operating_hours?: string | null
          portal_url?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          target_group?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_inclusion_grievance_channels_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_inclusion_metrics: {
        Row: {
          category: string
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          population: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          category: string
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          category?: string
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_inclusion_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_inclusion_policies: {
        Row: {
          applicable_groups: string[] | null
          created_at: string
          data_last_verified_at: string | null
          document_url: string | null
          effective_from: string | null
          effective_until: string | null
          grievance_contact: string | null
          id: string
          institute_id: string
          policy_name: string
          policy_summary: string | null
          policy_type: string
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          applicable_groups?: string[] | null
          created_at?: string
          data_last_verified_at?: string | null
          document_url?: string | null
          effective_from?: string | null
          effective_until?: string | null
          grievance_contact?: string | null
          id?: string
          institute_id: string
          policy_name: string
          policy_summary?: string | null
          policy_type: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          applicable_groups?: string[] | null
          created_at?: string
          data_last_verified_at?: string | null
          document_url?: string | null
          effective_from?: string | null
          effective_until?: string | null
          grievance_contact?: string | null
          id?: string
          institute_id?: string
          policy_name?: string
          policy_summary?: string | null
          policy_type?: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_inclusion_policies_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_inclusion_support_services: {
        Row: {
          appointment_required: boolean | null
          availability: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          description: string | null
          eligibility: string | null
          fee_amount: number | null
          hours: string | null
          id: string
          institute_id: string
          service_name: string
          service_type: string
          source_document: string | null
          source_label: string | null
          source_url: string | null
          target_group: string | null
          website_url: string | null
          year: number
        }
        Insert: {
          appointment_required?: boolean | null
          availability?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          description?: string | null
          eligibility?: string | null
          fee_amount?: number | null
          hours?: string | null
          id?: string
          institute_id: string
          service_name: string
          service_type: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          target_group?: string | null
          website_url?: string | null
          year: number
        }
        Update: {
          appointment_required?: boolean | null
          availability?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          description?: string | null
          eligibility?: string | null
          fee_amount?: number | null
          hours?: string | null
          id?: string
          institute_id?: string
          service_name?: string
          service_type?: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          target_group?: string | null
          website_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_inclusion_support_services_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_industry_collaboration_records: {
        Row: {
          collaboration_type: string
          company_name: string
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          department_name: string | null
          end_date: string | null
          faculty_involvement: boolean | null
          funding_amount: number | null
          id: string
          institute_id: string
          outcomes: string | null
          project_name: string | null
          research_area: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          start_date: string | null
          status: string | null
          student_involvement: boolean | null
          year: number
        }
        Insert: {
          collaboration_type: string
          company_name: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          department_name?: string | null
          end_date?: string | null
          faculty_involvement?: boolean | null
          funding_amount?: number | null
          id?: string
          institute_id: string
          outcomes?: string | null
          project_name?: string | null
          research_area?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          status?: string | null
          student_involvement?: boolean | null
          year: number
        }
        Update: {
          collaboration_type?: string
          company_name?: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          department_name?: string | null
          end_date?: string | null
          faculty_involvement?: boolean | null
          funding_amount?: number | null
          id?: string
          institute_id?: string
          outcomes?: string | null
          project_name?: string | null
          research_area?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          status?: string | null
          student_involvement?: boolean | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_industry_collaboration_records_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_industry_collaborations: {
        Row: {
          agreement_type: string | null
          collaboration_type: string
          company_name: string
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          department_name: string | null
          end_date: string | null
          funding_amount: number | null
          id: string
          industry_sponsor: boolean | null
          institute_id: string
          official_url: string | null
          outcomes: string | null
          project_name: string | null
          research_area: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          start_date: string | null
          student_involvement: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          agreement_type?: string | null
          collaboration_type: string
          company_name: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          department_name?: string | null
          end_date?: string | null
          funding_amount?: number | null
          id?: string
          industry_sponsor?: boolean | null
          institute_id: string
          official_url?: string | null
          outcomes?: string | null
          project_name?: string | null
          research_area?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          student_involvement?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          agreement_type?: string | null
          collaboration_type?: string
          company_name?: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          department_name?: string | null
          end_date?: string | null
          funding_amount?: number | null
          id?: string
          industry_sponsor?: boolean | null
          institute_id?: string
          official_url?: string | null
          outcomes?: string | null
          project_name?: string | null
          research_area?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          student_involvement?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_industry_collaborations_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_industry_interactions: {
        Row: {
          company_name: string
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          description: string | null
          event_date: string | null
          event_name: string | null
          id: string
          institute_id: string
          interaction_type: string
          official_url: string | null
          opportunities_offered: string | null
          program_name: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          company_name: string
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          institute_id: string
          interaction_type: string
          official_url?: string | null
          opportunities_offered?: string | null
          program_name?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          company_name?: string
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          institute_id?: string
          interaction_type?: string
          official_url?: string | null
          opportunities_offered?: string | null
          program_name?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_industry_interactions_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_industry_projects: {
        Row: {
          company_name: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          deliverables: string | null
          department_name: string | null
          end_date: string | null
          funding_amount: number | null
          id: string
          institute_id: string
          official_url: string | null
          outcome_summary: string | null
          principal_investigator: string | null
          project_name: string
          project_type: string | null
          source_label: string | null
          source_url: string | null
          start_date: string | null
          status: string | null
          student_team: string | null
          technology_domain: string | null
          year: number | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          deliverables?: string | null
          department_name?: string | null
          end_date?: string | null
          funding_amount?: number | null
          id?: string
          institute_id: string
          official_url?: string | null
          outcome_summary?: string | null
          principal_investigator?: string | null
          project_name: string
          project_type?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          status?: string | null
          student_team?: string | null
          technology_domain?: string | null
          year?: number | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          deliverables?: string | null
          department_name?: string | null
          end_date?: string | null
          funding_amount?: number | null
          id?: string
          institute_id?: string
          official_url?: string | null
          outcome_summary?: string | null
          principal_investigator?: string | null
          project_name?: string
          project_type?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          status?: string | null
          student_team?: string | null
          technology_domain?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_industry_projects_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_industry_sponsored_labs: {
        Row: {
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          department_name: string | null
          end_date: string | null
          facilities: string | null
          id: string
          institute_id: string
          lab_name: string
          official_url: string | null
          research_access: string | null
          source_label: string | null
          source_url: string | null
          sponsor_name: string | null
          sponsorship_amount: number | null
          sponsorship_type: string | null
          start_date: string | null
          student_access: string | null
          technology_domain: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          department_name?: string | null
          end_date?: string | null
          facilities?: string | null
          id?: string
          institute_id: string
          lab_name: string
          official_url?: string | null
          research_access?: string | null
          source_label?: string | null
          source_url?: string | null
          sponsor_name?: string | null
          sponsorship_amount?: number | null
          sponsorship_type?: string | null
          start_date?: string | null
          student_access?: string | null
          technology_domain?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          department_name?: string | null
          end_date?: string | null
          facilities?: string | null
          id?: string
          institute_id?: string
          lab_name?: string
          official_url?: string | null
          research_access?: string | null
          source_label?: string | null
          source_url?: string | null
          sponsor_name?: string | null
          sponsorship_amount?: number | null
          sponsorship_type?: string | null
          start_date?: string | null
          student_access?: string | null
          technology_domain?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_industry_sponsored_labs_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_industry_sponsored_projects: {
        Row: {
          company_name: string
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          deliverables: string | null
          department_name: string | null
          funding_amount: number | null
          id: string
          institute_id: string
          principal_investigator: string | null
          project_end: string | null
          project_start: string | null
          project_title: string
          source_document: string | null
          source_label: string | null
          source_url: string | null
          status: string | null
          student_opportunities: string | null
          technology_domain: string | null
          year: number | null
        }
        Insert: {
          company_name: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          deliverables?: string | null
          department_name?: string | null
          funding_amount?: number | null
          id?: string
          institute_id: string
          principal_investigator?: string | null
          project_end?: string | null
          project_start?: string | null
          project_title: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          student_opportunities?: string | null
          technology_domain?: string | null
          year?: number | null
        }
        Update: {
          company_name?: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          deliverables?: string | null
          department_name?: string | null
          funding_amount?: number | null
          id?: string
          institute_id?: string
          principal_investigator?: string | null
          project_end?: string | null
          project_start?: string | null
          project_title?: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          student_opportunities?: string | null
          technology_domain?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_industry_sponsored_projects_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_innovation_commercialization: {
        Row: {
          commercialization_stage: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          deployment_status: string | null
          funding_amount: number | null
          id: string
          impact_summary: string | null
          incubation_entity: string | null
          industry_partner: string | null
          innovation_name: string
          institute_id: string
          inventor_or_team: string | null
          official_url: string | null
          source_label: string | null
          source_url: string | null
          startup_name: string | null
          technology_domain: string | null
          year: number | null
        }
        Insert: {
          commercialization_stage?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          deployment_status?: string | null
          funding_amount?: number | null
          id?: string
          impact_summary?: string | null
          incubation_entity?: string | null
          industry_partner?: string | null
          innovation_name: string
          institute_id: string
          inventor_or_team?: string | null
          official_url?: string | null
          source_label?: string | null
          source_url?: string | null
          startup_name?: string | null
          technology_domain?: string | null
          year?: number | null
        }
        Update: {
          commercialization_stage?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          deployment_status?: string | null
          funding_amount?: number | null
          id?: string
          impact_summary?: string | null
          incubation_entity?: string | null
          industry_partner?: string | null
          innovation_name?: string
          institute_id?: string
          inventor_or_team?: string | null
          official_url?: string | null
          source_label?: string | null
          source_url?: string | null
          startup_name?: string | null
          technology_domain?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_innovation_commercialization_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_innovation_ecosystem: {
        Row: {
          application_url: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          ecosystem_type: string
          eligibility: string | null
          funding_support: string | null
          id: string
          incubation_period: string | null
          institute_id: string
          name: string
          official_url: string | null
          source_label: string | null
          source_url: string | null
          support_offered: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          application_url?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          ecosystem_type: string
          eligibility?: string | null
          funding_support?: string | null
          id?: string
          incubation_period?: string | null
          institute_id: string
          name: string
          official_url?: string | null
          source_label?: string | null
          source_url?: string | null
          support_offered?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          application_url?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          ecosystem_type?: string
          eligibility?: string | null
          funding_support?: string | null
          id?: string
          incubation_period?: string | null
          institute_id?: string
          name?: string
          official_url?: string | null
          source_label?: string | null
          source_url?: string | null
          support_offered?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_innovation_ecosystem_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institute_comparison_metrics: {
        Row: {
          benchmark_group: string | null
          comparison_category: string
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          normalized_score: number | null
          percentile: number | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          benchmark_group?: string | null
          comparison_category: string
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          normalized_score?: number | null
          percentile?: number | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          benchmark_group?: string | null
          comparison_category?: string
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          normalized_score?: number | null
          percentile?: number | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_institute_comparison_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institute_events: {
        Row: {
          applicable_programs: string[] | null
          city: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          department_name: string | null
          description: string | null
          eligibility: string | null
          end_at: string | null
          event_name: string
          event_type: string
          id: string
          institute_id: string
          official_url: string | null
          organizer_name: string | null
          participation_fee: number | null
          participation_mode: string | null
          registration_deadline: string | null
          registration_start: string | null
          registration_url: string | null
          source_label: string | null
          source_url: string | null
          start_at: string | null
          updated_at: string
          venue: string | null
          year: number | null
        }
        Insert: {
          applicable_programs?: string[] | null
          city?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          eligibility?: string | null
          end_at?: string | null
          event_name: string
          event_type: string
          id?: string
          institute_id: string
          official_url?: string | null
          organizer_name?: string | null
          participation_fee?: number | null
          participation_mode?: string | null
          registration_deadline?: string | null
          registration_start?: string | null
          registration_url?: string | null
          source_label?: string | null
          source_url?: string | null
          start_at?: string | null
          updated_at?: string
          venue?: string | null
          year?: number | null
        }
        Update: {
          applicable_programs?: string[] | null
          city?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          eligibility?: string | null
          end_at?: string | null
          event_name?: string
          event_type?: string
          id?: string
          institute_id?: string
          official_url?: string | null
          organizer_name?: string | null
          participation_fee?: number | null
          participation_mode?: string | null
          registration_deadline?: string | null
          registration_start?: string | null
          registration_url?: string | null
          source_label?: string | null
          source_url?: string | null
          start_at?: string | null
          updated_at?: string
          venue?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_institute_events_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institute_facilities: {
        Row: {
          available: boolean
          created_at: string
          details: string | null
          facility_name: string | null
          facility_type: string
          id: string
          institute_id: string
          source_label: string | null
          source_url: string | null
        }
        Insert: {
          available?: boolean
          created_at?: string
          details?: string | null
          facility_name?: string | null
          facility_type: string
          id?: string
          institute_id: string
          source_label?: string | null
          source_url?: string | null
        }
        Update: {
          available?: boolean
          created_at?: string
          details?: string | null
          facility_name?: string | null
          facility_type?: string
          id?: string
          institute_id?: string
          source_label?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_institute_facilities_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institute_profiles: {
        Row: {
          academic_reputation: string | null
          campus_overview: string | null
          coed: boolean | null
          created_at: string
          description: string | null
          faculty_count: number | null
          id: string
          institute_id: string
          mission: string | null
          notable_features: string | null
          research_strength: string | null
          residential: boolean | null
          source_label: string | null
          source_url: string | null
          student_faculty_ratio: number | null
          student_strength: number | null
          updated_at: string
        }
        Insert: {
          academic_reputation?: string | null
          campus_overview?: string | null
          coed?: boolean | null
          created_at?: string
          description?: string | null
          faculty_count?: number | null
          id?: string
          institute_id: string
          mission?: string | null
          notable_features?: string | null
          research_strength?: string | null
          residential?: boolean | null
          source_label?: string | null
          source_url?: string | null
          student_faculty_ratio?: number | null
          student_strength?: number | null
          updated_at?: string
        }
        Update: {
          academic_reputation?: string | null
          campus_overview?: string | null
          coed?: boolean | null
          created_at?: string
          description?: string | null
          faculty_count?: number | null
          id?: string
          institute_id?: string
          mission?: string | null
          notable_features?: string | null
          research_strength?: string | null
          residential?: boolean | null
          source_label?: string | null
          source_url?: string | null
          student_faculty_ratio?: number | null
          student_strength?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_institute_profiles_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: true
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institute_rankings: {
        Row: {
          created_at: string
          id: string
          institute_id: string
          notes: string | null
          rank: number | null
          ranking_body: string
          ranking_category: string | null
          score: number | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          institute_id: string
          notes?: string | null
          rank?: number | null
          ranking_body: string
          ranking_category?: string | null
          score?: number | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          institute_id?: string
          notes?: string | null
          rank?: number | null
          ranking_body?: string
          ranking_category?: string | null
          score?: number | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_institute_rankings_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institute_rankings_detailed: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          global_rank: number | null
          id: string
          institute_id: string
          methodology_version: string | null
          national_rank: number | null
          rank: number | null
          rank_band: string | null
          ranking_category: string | null
          ranking_source_id: string | null
          regional_rank: number | null
          score: number | null
          score_scale: number | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          global_rank?: number | null
          id?: string
          institute_id: string
          methodology_version?: string | null
          national_rank?: number | null
          rank?: number | null
          rank_band?: string | null
          ranking_category?: string | null
          ranking_source_id?: string | null
          regional_rank?: number | null
          score?: number | null
          score_scale?: number | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          global_rank?: number | null
          id?: string
          institute_id?: string
          methodology_version?: string | null
          national_rank?: number | null
          rank?: number | null
          rank_band?: string | null
          ranking_category?: string | null
          ranking_source_id?: string | null
          regional_rank?: number | null
          score?: number | null
          score_scale?: number | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_institute_rankings_detailed_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_institute_rankings_detailed_ranking_source_id_fkey"
            columns: ["ranking_source_id"]
            isOneToOne: false
            referencedRelation: "jee_ranking_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institute_reputation_metrics: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_category: string
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          population: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_category: string
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_category?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_institute_reputation_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institutes: {
        Row: {
          academic_calendar_url: string | null
          accreditation: string | null
          accreditation_grade: string | null
          accreditation_valid_until: string | null
          active: boolean
          address_line: string | null
          admission_url: string | null
          admissions_email: string | null
          admissions_page_url: string | null
          admissions_phone: string | null
          annual_report_url: string | null
          autonomous: boolean | null
          boys_hostel_available: boolean | null
          campus_area_acres: number | null
          campus_area_hectares: number | null
          campus_area_unit: string | null
          campus_type: string | null
          city: string | null
          created_at: string
          data_last_verified_at: string | null
          data_verified_by: string | null
          deemed_university: boolean | null
          doctoral_students: number | null
          established_year: number | null
          faculty_count: number | null
          girls_hostel_available: boolean | null
          google_maps_url: string | null
          hospital_available: boolean | null
          hostel_available: boolean | null
          id: string
          institute_code: string | null
          institute_email: string | null
          institute_group: string | null
          institute_name: string
          institute_slug: string | null
          institute_type: string | null
          landmark: string | null
          latitude: number | null
          legal_name: string | null
          library_available: boolean | null
          longitude: number | null
          nirf_engineering_rank: number | null
          nirf_name: string | null
          nirf_overall_rank: number | null
          nirf_year: number | null
          non_teaching_staff_count: number | null
          official_name: string | null
          official_status: string | null
          official_url: string | null
          ownership: string | null
          phone: string | null
          pincode: string | null
          placement_report_url: string | null
          postal_address: string | null
          postgraduate_students: number | null
          prospectus_url: string | null
          short_name: string | null
          sports_available: boolean | null
          state: string | null
          student_faculty_ratio: number | null
          timezone: string | null
          total_students: number | null
          undergraduate_students: number | null
          university_affiliation: string | null
          updated_at: string
          website_domain: string | null
        }
        Insert: {
          academic_calendar_url?: string | null
          accreditation?: string | null
          accreditation_grade?: string | null
          accreditation_valid_until?: string | null
          active?: boolean
          address_line?: string | null
          admission_url?: string | null
          admissions_email?: string | null
          admissions_page_url?: string | null
          admissions_phone?: string | null
          annual_report_url?: string | null
          autonomous?: boolean | null
          boys_hostel_available?: boolean | null
          campus_area_acres?: number | null
          campus_area_hectares?: number | null
          campus_area_unit?: string | null
          campus_type?: string | null
          city?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          data_verified_by?: string | null
          deemed_university?: boolean | null
          doctoral_students?: number | null
          established_year?: number | null
          faculty_count?: number | null
          girls_hostel_available?: boolean | null
          google_maps_url?: string | null
          hospital_available?: boolean | null
          hostel_available?: boolean | null
          id?: string
          institute_code?: string | null
          institute_email?: string | null
          institute_group?: string | null
          institute_name: string
          institute_slug?: string | null
          institute_type?: string | null
          landmark?: string | null
          latitude?: number | null
          legal_name?: string | null
          library_available?: boolean | null
          longitude?: number | null
          nirf_engineering_rank?: number | null
          nirf_name?: string | null
          nirf_overall_rank?: number | null
          nirf_year?: number | null
          non_teaching_staff_count?: number | null
          official_name?: string | null
          official_status?: string | null
          official_url?: string | null
          ownership?: string | null
          phone?: string | null
          pincode?: string | null
          placement_report_url?: string | null
          postal_address?: string | null
          postgraduate_students?: number | null
          prospectus_url?: string | null
          short_name?: string | null
          sports_available?: boolean | null
          state?: string | null
          student_faculty_ratio?: number | null
          timezone?: string | null
          total_students?: number | null
          undergraduate_students?: number | null
          university_affiliation?: string | null
          updated_at?: string
          website_domain?: string | null
        }
        Update: {
          academic_calendar_url?: string | null
          accreditation?: string | null
          accreditation_grade?: string | null
          accreditation_valid_until?: string | null
          active?: boolean
          address_line?: string | null
          admission_url?: string | null
          admissions_email?: string | null
          admissions_page_url?: string | null
          admissions_phone?: string | null
          annual_report_url?: string | null
          autonomous?: boolean | null
          boys_hostel_available?: boolean | null
          campus_area_acres?: number | null
          campus_area_hectares?: number | null
          campus_area_unit?: string | null
          campus_type?: string | null
          city?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          data_verified_by?: string | null
          deemed_university?: boolean | null
          doctoral_students?: number | null
          established_year?: number | null
          faculty_count?: number | null
          girls_hostel_available?: boolean | null
          google_maps_url?: string | null
          hospital_available?: boolean | null
          hostel_available?: boolean | null
          id?: string
          institute_code?: string | null
          institute_email?: string | null
          institute_group?: string | null
          institute_name?: string
          institute_slug?: string | null
          institute_type?: string | null
          landmark?: string | null
          latitude?: number | null
          legal_name?: string | null
          library_available?: boolean | null
          longitude?: number | null
          nirf_engineering_rank?: number | null
          nirf_name?: string | null
          nirf_overall_rank?: number | null
          nirf_year?: number | null
          non_teaching_staff_count?: number | null
          official_name?: string | null
          official_status?: string | null
          official_url?: string | null
          ownership?: string | null
          phone?: string | null
          pincode?: string | null
          placement_report_url?: string | null
          postal_address?: string | null
          postgraduate_students?: number | null
          prospectus_url?: string | null
          short_name?: string | null
          sports_available?: boolean | null
          state?: string | null
          student_faculty_ratio?: number | null
          timezone?: string | null
          total_students?: number | null
          undergraduate_students?: number | null
          university_affiliation?: string | null
          updated_at?: string
          website_domain?: string | null
        }
        Relationships: []
      }
      jee_institution_benchmarks: {
        Row: {
          average_value: number | null
          benchmark_group: string
          created_at: string
          data_last_verified_at: string | null
          id: string
          max_value: number | null
          median_value: number | null
          methodology: string | null
          metric_name: string
          metric_unit: string | null
          min_value: number | null
          percentile_25: number | null
          percentile_75: number | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          average_value?: number | null
          benchmark_group: string
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          max_value?: number | null
          median_value?: number | null
          methodology?: string | null
          metric_name: string
          metric_unit?: string | null
          min_value?: number | null
          percentile_25?: number | null
          percentile_75?: number | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          average_value?: number | null
          benchmark_group?: string
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          max_value?: number | null
          median_value?: number | null
          methodology?: string | null
          metric_name?: string
          metric_unit?: string | null
          min_value?: number | null
          percentile_25?: number | null
          percentile_75?: number | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: []
      }
      jee_institution_continuity_plans: {
        Row: {
          activation_trigger: string | null
          communication_channel: string | null
          continuity_type: string
          created_at: string
          data_last_verified_at: string | null
          document_url: string | null
          id: string
          institute_id: string
          plan_name: string
          recovery_target: string | null
          responsible_office: string | null
          scope: string | null
          source_label: string | null
          source_url: string | null
          summary: string | null
          year: number | null
        }
        Insert: {
          activation_trigger?: string | null
          communication_channel?: string | null
          continuity_type: string
          created_at?: string
          data_last_verified_at?: string | null
          document_url?: string | null
          id?: string
          institute_id: string
          plan_name: string
          recovery_target?: string | null
          responsible_office?: string | null
          scope?: string | null
          source_label?: string | null
          source_url?: string | null
          summary?: string | null
          year?: number | null
        }
        Update: {
          activation_trigger?: string | null
          communication_channel?: string | null
          continuity_type?: string
          created_at?: string
          data_last_verified_at?: string | null
          document_url?: string | null
          id?: string
          institute_id?: string
          plan_name?: string
          recovery_target?: string | null
          responsible_office?: string | null
          scope?: string | null
          source_label?: string | null
          source_url?: string | null
          summary?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_institution_continuity_plans_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institution_disruptions: {
        Row: {
          affected_population: string | null
          affected_services: string | null
          cause_category: string | null
          created_at: string
          disruption_type: string
          duration_text: string | null
          end_date: string | null
          event_date: string
          id: string
          institute_id: string
          operational_impact: string | null
          recovery_summary: string | null
          response_summary: string | null
          severity: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
        }
        Insert: {
          affected_population?: string | null
          affected_services?: string | null
          cause_category?: string | null
          created_at?: string
          disruption_type: string
          duration_text?: string | null
          end_date?: string | null
          event_date: string
          id?: string
          institute_id: string
          operational_impact?: string | null
          recovery_summary?: string | null
          response_summary?: string | null
          severity?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
        }
        Update: {
          affected_population?: string | null
          affected_services?: string | null
          cause_category?: string | null
          created_at?: string
          disruption_type?: string
          duration_text?: string | null
          end_date?: string | null
          event_date?: string
          id?: string
          institute_id?: string
          operational_impact?: string | null
          recovery_summary?: string | null
          response_summary?: string | null
          severity?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_institution_disruptions_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institution_documents: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          document_number: string | null
          document_type: string
          document_url: string | null
          effective_from: string | null
          effective_until: string | null
          file_format: string | null
          file_size_bytes: number | null
          id: string
          institute_id: string
          language: string | null
          official_document: boolean
          publication_date: string | null
          source_label: string | null
          source_url: string | null
          summary: string | null
          title: string
          updated_at: string
          version: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          document_number?: string | null
          document_type: string
          document_url?: string | null
          effective_from?: string | null
          effective_until?: string | null
          file_format?: string | null
          file_size_bytes?: number | null
          id?: string
          institute_id: string
          language?: string | null
          official_document?: boolean
          publication_date?: string | null
          source_label?: string | null
          source_url?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          version?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          document_number?: string | null
          document_type?: string
          document_url?: string | null
          effective_from?: string | null
          effective_until?: string | null
          file_format?: string | null
          file_size_bytes?: number | null
          id?: string
          institute_id?: string
          language?: string | null
          official_document?: boolean
          publication_date?: string | null
          source_label?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          version?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_institution_documents_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institution_financial_stability: {
        Row: {
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          trend_direction: string | null
          year: number
        }
        Insert: {
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          trend_direction?: string | null
          year: number
        }
        Update: {
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          trend_direction?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_institution_financial_stability_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institution_minutes_resolutions: {
        Row: {
          body_name: string
          created_at: string
          data_last_verified_at: string | null
          decision_status: string | null
          document_url: string | null
          id: string
          institute_id: string
          meeting_date: string | null
          meeting_type: string | null
          resolution_number: string | null
          resolution_summary: string | null
          source_label: string | null
          source_url: string | null
          title: string | null
          year: number | null
        }
        Insert: {
          body_name: string
          created_at?: string
          data_last_verified_at?: string | null
          decision_status?: string | null
          document_url?: string | null
          id?: string
          institute_id: string
          meeting_date?: string | null
          meeting_type?: string | null
          resolution_number?: string | null
          resolution_summary?: string | null
          source_label?: string | null
          source_url?: string | null
          title?: string | null
          year?: number | null
        }
        Update: {
          body_name?: string
          created_at?: string
          data_last_verified_at?: string | null
          decision_status?: string | null
          document_url?: string | null
          id?: string
          institute_id?: string
          meeting_date?: string | null
          meeting_type?: string | null
          resolution_number?: string | null
          resolution_summary?: string | null
          source_label?: string | null
          source_url?: string | null
          title?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_institution_minutes_resolutions_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institution_operational_capacity: {
        Row: {
          capacity_category: string
          capacity_value: number | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_name: string
          source_label: string | null
          source_url: string | null
          unit: string | null
          utilization_percentage: number | null
          utilization_value: number | null
          year: number
        }
        Insert: {
          capacity_category: string
          capacity_value?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_name: string
          source_label?: string | null
          source_url?: string | null
          unit?: string | null
          utilization_percentage?: number | null
          utilization_value?: number | null
          year: number
        }
        Update: {
          capacity_category?: string
          capacity_value?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_name?: string
          source_label?: string | null
          source_url?: string | null
          unit?: string | null
          utilization_percentage?: number | null
          utilization_value?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_institution_operational_capacity_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institution_prospectuses: {
        Row: {
          academic_year: string
          admission_cycle: string | null
          applicable_programs: string[] | null
          created_at: string
          data_last_verified_at: string | null
          document_url: string | null
          id: string
          institute_id: string
          prospectus_type: string
          publication_date: string | null
          source_label: string | null
          source_url: string | null
          summary: string | null
          title: string
        }
        Insert: {
          academic_year: string
          admission_cycle?: string | null
          applicable_programs?: string[] | null
          created_at?: string
          data_last_verified_at?: string | null
          document_url?: string | null
          id?: string
          institute_id: string
          prospectus_type: string
          publication_date?: string | null
          source_label?: string | null
          source_url?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          academic_year?: string
          admission_cycle?: string | null
          applicable_programs?: string[] | null
          created_at?: string
          data_last_verified_at?: string | null
          document_url?: string | null
          id?: string
          institute_id?: string
          prospectus_type?: string
          publication_date?: string | null
          source_label?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_institution_prospectuses_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institution_public_notices: {
        Row: {
          audience: string | null
          created_at: string
          data_last_verified_at: string | null
          document_url: string | null
          id: string
          institute_id: string
          notice_date: string | null
          notice_type: string
          priority: string | null
          source_label: string | null
          source_url: string | null
          summary: string | null
          title: string
          valid_until: string | null
          year: number | null
        }
        Insert: {
          audience?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          document_url?: string | null
          id?: string
          institute_id: string
          notice_date?: string | null
          notice_type: string
          priority?: string | null
          source_label?: string | null
          source_url?: string | null
          summary?: string | null
          title: string
          valid_until?: string | null
          year?: number | null
        }
        Update: {
          audience?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          document_url?: string | null
          id?: string
          institute_id?: string
          notice_date?: string | null
          notice_type?: string
          priority?: string | null
          source_label?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string
          valid_until?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_institution_public_notices_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institution_regulations: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          document_url: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          institute_id: string
          regulation_number: string | null
          regulation_type: string
          scope: string | null
          source_label: string | null
          source_url: string | null
          summary: string | null
          title: string
          year: number | null
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          document_url?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          institute_id: string
          regulation_number?: string | null
          regulation_type: string
          scope?: string | null
          source_label?: string | null
          source_url?: string | null
          summary?: string | null
          title: string
          year?: number | null
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          document_url?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          institute_id?: string
          regulation_number?: string | null
          regulation_type?: string
          scope?: string | null
          source_label?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_institution_regulations_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institution_reports: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          document_url: string | null
          file_format: string | null
          id: string
          institute_id: string
          key_metrics: Json
          publication_date: string | null
          report_number: string | null
          report_type: string
          reporting_period: string | null
          source_label: string | null
          source_url: string | null
          summary: string | null
          title: string
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          document_url?: string | null
          file_format?: string | null
          id?: string
          institute_id: string
          key_metrics?: Json
          publication_date?: string | null
          report_number?: string | null
          report_type: string
          reporting_period?: string | null
          source_label?: string | null
          source_url?: string | null
          summary?: string | null
          title: string
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          document_url?: string | null
          file_format?: string | null
          id?: string
          institute_id?: string
          key_metrics?: Json
          publication_date?: string | null
          report_number?: string | null
          report_type?: string
          reporting_period?: string | null
          source_label?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_institution_reports_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institution_resilience_metrics: {
        Row: {
          benchmark_group: string | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          benchmark_group?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          benchmark_group?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_institution_resilience_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institution_risk_events: {
        Row: {
          affected_area: string | null
          created_at: string
          event_date: string | null
          event_type: string
          id: string
          institute_id: string
          resolution: string | null
          response: string | null
          severity: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          status: string | null
          summary: string | null
          year: number
        }
        Insert: {
          affected_area?: string | null
          created_at?: string
          event_date?: string | null
          event_type: string
          id?: string
          institute_id: string
          resolution?: string | null
          response?: string | null
          severity?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          year: number
        }
        Update: {
          affected_area?: string | null
          created_at?: string
          event_date?: string | null
          event_type?: string
          id?: string
          institute_id?: string
          resolution?: string | null
          response?: string | null
          severity?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_institution_risk_events_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institution_risk_metrics: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          risk_category: string
          severity: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          risk_category: string
          severity?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          risk_category?: string
          severity?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_institution_risk_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institutional_committees: {
        Row: {
          chairperson: string | null
          committee_name: string
          committee_type: string
          contact_email: string | null
          coordinator: string | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          mandate: string | null
          meeting_frequency: string | null
          members_count: number | null
          official_url: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          chairperson?: string | null
          committee_name: string
          committee_type: string
          contact_email?: string | null
          coordinator?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          mandate?: string | null
          meeting_frequency?: string | null
          members_count?: number | null
          official_url?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          chairperson?: string | null
          committee_name?: string
          committee_type?: string
          contact_email?: string | null
          coordinator?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          mandate?: string | null
          meeting_frequency?: string | null
          members_count?: number | null
          official_url?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_institutional_committees_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institutional_governance: {
        Row: {
          body_name: string
          body_type: string
          chairperson_name: string | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          meeting_frequency: string | null
          member_count: number | null
          official_url: string | null
          responsibilities: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          body_name: string
          body_type: string
          chairperson_name?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          meeting_frequency?: string | null
          member_count?: number | null
          official_url?: string | null
          responsibilities?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          body_name?: string
          body_type?: string
          chairperson_name?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          meeting_frequency?: string | null
          member_count?: number | null
          official_url?: string | null
          responsibilities?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_institutional_governance_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institutional_policies: {
        Row: {
          applicable_scope: string | null
          created_at: string
          data_last_verified_at: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          institute_id: string
          policy_name: string
          policy_summary: string | null
          policy_type: string
          policy_url: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          applicable_scope?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          institute_id: string
          policy_name: string
          policy_summary?: string | null
          policy_type: string
          policy_url?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          applicable_scope?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          institute_id?: string
          policy_name?: string
          policy_summary?: string | null
          policy_type?: string
          policy_url?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_institutional_policies_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institutional_statistics: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_category: string
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          population: string | null
          program_name: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_category: string
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          program_name?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_category?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          program_name?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_institutional_statistics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_institutional_trends: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_category: string
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          population: string | null
          program_name: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_category: string
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          program_name?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_category?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          program_name?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_institutional_trends_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_intellectual_property: {
        Row: {
          application_number: string | null
          assignee: string | null
          co_assignees: string[] | null
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          filing_date: string | null
          grant_date: string | null
          grant_number: string | null
          id: string
          institute_id: string
          inventors: string[] | null
          ip_type: string
          licensee_name: string | null
          licensing_status: string | null
          official_url: string | null
          publication_date: string | null
          publication_number: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          status: string | null
          technology_domain: string | null
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          application_number?: string | null
          assignee?: string | null
          co_assignees?: string[] | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          filing_date?: string | null
          grant_date?: string | null
          grant_number?: string | null
          id?: string
          institute_id: string
          inventors?: string[] | null
          ip_type: string
          licensee_name?: string | null
          licensing_status?: string | null
          official_url?: string | null
          publication_date?: string | null
          publication_number?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          technology_domain?: string | null
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          application_number?: string | null
          assignee?: string | null
          co_assignees?: string[] | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          filing_date?: string | null
          grant_date?: string | null
          grant_number?: string | null
          id?: string
          institute_id?: string
          inventors?: string[] | null
          ip_type?: string
          licensee_name?: string | null
          licensing_status?: string | null
          official_url?: string | null
          publication_date?: string | null
          publication_number?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          technology_domain?: string | null
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_intellectual_property_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_international_dual_degree: {
        Row: {
          application_url: string | null
          country: string | null
          created_at: string
          data_last_verified_at: string | null
          degree_awarded: string | null
          duration_text: string | null
          eligibility: string | null
          fee_structure: string | null
          id: string
          institute_id: string
          official_url: string | null
          partner_institution: string
          program_name: string
          scholarship_support: string | null
          selection_process: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          application_url?: string | null
          country?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          degree_awarded?: string | null
          duration_text?: string | null
          eligibility?: string | null
          fee_structure?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          partner_institution: string
          program_name: string
          scholarship_support?: string | null
          selection_process?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          application_url?: string | null
          country?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          degree_awarded?: string | null
          duration_text?: string | null
          eligibility?: string | null
          fee_structure?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          partner_institution?: string
          program_name?: string
          scholarship_support?: string | null
          selection_process?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_international_dual_degree_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_international_faculty_programs: {
        Row: {
          application_url: string | null
          created_at: string
          data_last_verified_at: string | null
          duration_text: string | null
          eligibility: string | null
          funding_details: string | null
          id: string
          institute_id: string
          official_url: string | null
          partner_country: string | null
          partner_institution: string | null
          program_name: string
          program_type: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          application_url?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          duration_text?: string | null
          eligibility?: string | null
          funding_details?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          partner_country?: string | null
          partner_institution?: string | null
          program_name: string
          program_type?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          application_url?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          duration_text?: string | null
          eligibility?: string | null
          funding_details?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          partner_country?: string | null
          partner_institution?: string | null
          program_name?: string
          program_type?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_international_faculty_programs_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_international_opportunities: {
        Row: {
          application_deadline: string | null
          application_url: string | null
          city: string | null
          country: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          duration_text: string | null
          eligibility: string | null
          eligible_programs: string[] | null
          funded: boolean | null
          funding_details: string | null
          host_institution: string | null
          id: string
          institute_id: string
          official_url: string | null
          opportunity_name: string
          opportunity_type: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          application_deadline?: string | null
          application_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          duration_text?: string | null
          eligibility?: string | null
          eligible_programs?: string[] | null
          funded?: boolean | null
          funding_details?: string | null
          host_institution?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          opportunity_name: string
          opportunity_type?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          application_deadline?: string | null
          application_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          duration_text?: string | null
          eligibility?: string | null
          eligible_programs?: string[] | null
          funded?: boolean | null
          funding_details?: string | null
          host_institution?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          opportunity_name?: string
          opportunity_type?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_international_opportunities_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_internet_connectivity: {
        Row: {
          academic_building_access: string | null
          access_method: string | null
          authentication_required: boolean | null
          availability: string | null
          bandwidth: string | null
          coverage_area: string | null
          created_at: string
          data_last_verified_at: string | null
          hostel_access: string | null
          id: string
          institute_id: string
          provider_name: string | null
          service_type: string
          source_label: string | null
          source_url: string | null
          student_access: string | null
          technology: string | null
          updated_at: string
          uptime_metric: number | null
          uptime_unit: string | null
          year: number | null
        }
        Insert: {
          academic_building_access?: string | null
          access_method?: string | null
          authentication_required?: boolean | null
          availability?: string | null
          bandwidth?: string | null
          coverage_area?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          hostel_access?: string | null
          id?: string
          institute_id: string
          provider_name?: string | null
          service_type: string
          source_label?: string | null
          source_url?: string | null
          student_access?: string | null
          technology?: string | null
          updated_at?: string
          uptime_metric?: number | null
          uptime_unit?: string | null
          year?: number | null
        }
        Update: {
          academic_building_access?: string | null
          access_method?: string | null
          authentication_required?: boolean | null
          availability?: string | null
          bandwidth?: string | null
          coverage_area?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          hostel_access?: string | null
          id?: string
          institute_id?: string
          provider_name?: string | null
          service_type?: string
          source_label?: string | null
          source_url?: string | null
          student_access?: string | null
          technology?: string | null
          updated_at?: string
          uptime_metric?: number | null
          uptime_unit?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_internet_connectivity_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_internship_opportunities: {
        Row: {
          application_deadline: string | null
          application_start: string | null
          application_url: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          duration_text: string | null
          eligibility: string | null
          eligible_programs: string[] | null
          id: string
          industry_sector: string | null
          institute_id: string
          location: string | null
          opportunity_name: string
          opportunity_type: string | null
          paid: boolean | null
          provider_name: string | null
          remote_allowed: boolean | null
          source_label: string | null
          source_url: string | null
          stipend_amount: number | null
          year: number | null
        }
        Insert: {
          application_deadline?: string | null
          application_start?: string | null
          application_url?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          duration_text?: string | null
          eligibility?: string | null
          eligible_programs?: string[] | null
          id?: string
          industry_sector?: string | null
          institute_id: string
          location?: string | null
          opportunity_name: string
          opportunity_type?: string | null
          paid?: boolean | null
          provider_name?: string | null
          remote_allowed?: boolean | null
          source_label?: string | null
          source_url?: string | null
          stipend_amount?: number | null
          year?: number | null
        }
        Update: {
          application_deadline?: string | null
          application_start?: string | null
          application_url?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          duration_text?: string | null
          eligibility?: string | null
          eligible_programs?: string[] | null
          id?: string
          industry_sector?: string | null
          institute_id?: string
          location?: string | null
          opportunity_name?: string
          opportunity_type?: string | null
          paid?: boolean | null
          provider_name?: string | null
          remote_allowed?: boolean | null
          source_label?: string | null
          source_url?: string | null
          stipend_amount?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_internship_opportunities_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_internship_statistics: {
        Row: {
          average_stipend: number | null
          batch_label: string | null
          companies_participated: number | null
          created_at: string
          data_last_verified_at: string | null
          eligible_students: number | null
          highest_stipend: number | null
          id: string
          institute_id: string | null
          internship_rate: number | null
          median_stipend: number | null
          program_id: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          stipend_currency: string
          students_with_internship: number | null
          year: number
        }
        Insert: {
          average_stipend?: number | null
          batch_label?: string | null
          companies_participated?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          eligible_students?: number | null
          highest_stipend?: number | null
          id?: string
          institute_id?: string | null
          internship_rate?: number | null
          median_stipend?: number | null
          program_id?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          stipend_currency?: string
          students_with_internship?: number | null
          year: number
        }
        Update: {
          average_stipend?: number | null
          batch_label?: string | null
          companies_participated?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          eligible_students?: number | null
          highest_stipend?: number | null
          id?: string
          institute_id?: string | null
          internship_rate?: number | null
          median_stipend?: number | null
          program_id?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          stipend_currency?: string
          students_with_internship?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_internship_statistics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_internship_statistics_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_ip_portfolio: {
        Row: {
          application_number: string | null
          assignee: string | null
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          description: string | null
          expiry_date: string | null
          filing_date: string | null
          grant_date: string | null
          id: string
          institute_id: string
          inventors: string[] | null
          ip_type: string
          publication_date: string | null
          publication_number: string | null
          registration_number: string | null
          research_area: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          status: string | null
          title: string
          year: number
        }
        Insert: {
          application_number?: string | null
          assignee?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          expiry_date?: string | null
          filing_date?: string | null
          grant_date?: string | null
          id?: string
          institute_id: string
          inventors?: string[] | null
          ip_type: string
          publication_date?: string | null
          publication_number?: string | null
          registration_number?: string | null
          research_area?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          title: string
          year: number
        }
        Update: {
          application_number?: string | null
          assignee?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          expiry_date?: string | null
          filing_date?: string | null
          grant_date?: string | null
          id?: string
          institute_id?: string
          inventors?: string[] | null
          ip_type?: string
          publication_date?: string | null
          publication_number?: string | null
          registration_number?: string | null
          research_area?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          title?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_ip_portfolio_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_it_security_controls: {
        Row: {
          certification: string | null
          contact_office: string | null
          control_name: string
          control_type: string
          created_at: string
          data_last_verified_at: string | null
          id: string
          implementation_status: string | null
          incident_response: string | null
          institute_id: string
          policy_reference: string | null
          scope: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          certification?: string | null
          contact_office?: string | null
          control_name: string
          control_type: string
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          implementation_status?: string | null
          incident_response?: string | null
          institute_id: string
          policy_reference?: string | null
          scope?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          certification?: string | null
          contact_office?: string | null
          control_name?: string
          control_type?: string
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          implementation_status?: string | null
          incident_response?: string | null
          institute_id?: string
          policy_reference?: string | null
          scope?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_it_security_controls_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_it_support_services: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          id: string
          institute_id: string
          operating_hours: string | null
          service_level: string | null
          service_name: string
          source_label: string | null
          source_url: string | null
          support_type: string | null
          support_url: string | null
          target_users: string | null
          ticketing_available: boolean | null
          year: number | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          id?: string
          institute_id: string
          operating_hours?: string | null
          service_level?: string | null
          service_name: string
          source_label?: string | null
          source_url?: string | null
          support_type?: string | null
          support_url?: string | null
          target_users?: string | null
          ticketing_available?: boolean | null
          year?: number | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          id?: string
          institute_id?: string
          operating_hours?: string | null
          service_level?: string | null
          service_name?: string
          source_label?: string | null
          source_url?: string | null
          support_type?: string | null
          support_url?: string | null
          target_users?: string | null
          ticketing_available?: boolean | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_it_support_services_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_laboratory_inventory: {
        Row: {
          capacity: number | null
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          description: string | null
          equipment: string[] | null
          id: string
          institute_id: string
          laboratory_name: string
          laboratory_type: string | null
          major_instruments: string[] | null
          official_url: string | null
          operating_hours: string | null
          research_access: string | null
          safety_features: string | null
          software_tools: string[] | null
          source_label: string | null
          source_url: string | null
          student_access: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          equipment?: string[] | null
          id?: string
          institute_id: string
          laboratory_name: string
          laboratory_type?: string | null
          major_instruments?: string[] | null
          official_url?: string | null
          operating_hours?: string | null
          research_access?: string | null
          safety_features?: string | null
          software_tools?: string[] | null
          source_label?: string | null
          source_url?: string | null
          student_access?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          capacity?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          equipment?: string[] | null
          id?: string
          institute_id?: string
          laboratory_name?: string
          laboratory_type?: string | null
          major_instruments?: string[] | null
          official_url?: string | null
          operating_hours?: string | null
          research_access?: string | null
          safety_features?: string | null
          software_tools?: string[] | null
          source_label?: string | null
          source_url?: string | null
          student_access?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_laboratory_inventory_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_leadership_history: {
        Row: {
          appointment_basis: string | null
          appointment_date: string | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          office_title: string
          office_type: string
          person_name: string
          profile_url: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          status: string | null
          term_end: string | null
          term_start: string | null
        }
        Insert: {
          appointment_basis?: string | null
          appointment_date?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          office_title: string
          office_type: string
          person_name: string
          profile_url?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          term_end?: string | null
          term_start?: string | null
        }
        Update: {
          appointment_basis?: string | null
          appointment_date?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          office_title?: string
          office_type?: string
          person_name?: string
          profile_url?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          term_end?: string | null
          term_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_leadership_history_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_learning_platforms: {
        Row: {
          access_scope: string | null
          created_at: string
          data_last_verified_at: string | null
          features: string[] | null
          id: string
          institute_id: string
          login_method: string | null
          mobile_app_available: boolean | null
          official_url: string | null
          offline_access: boolean | null
          platform_name: string
          platform_type: string | null
          provider: string | null
          purpose: string | null
          source_label: string | null
          source_url: string | null
          supported_programs: string[] | null
          year: number | null
        }
        Insert: {
          access_scope?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          features?: string[] | null
          id?: string
          institute_id: string
          login_method?: string | null
          mobile_app_available?: boolean | null
          official_url?: string | null
          offline_access?: boolean | null
          platform_name: string
          platform_type?: string | null
          provider?: string | null
          purpose?: string | null
          source_label?: string | null
          source_url?: string | null
          supported_programs?: string[] | null
          year?: number | null
        }
        Update: {
          access_scope?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          features?: string[] | null
          id?: string
          institute_id?: string
          login_method?: string | null
          mobile_app_available?: boolean | null
          official_url?: string | null
          offline_access?: boolean | null
          platform_name?: string
          platform_type?: string | null
          provider?: string | null
          purpose?: string | null
          source_label?: string | null
          source_url?: string | null
          supported_programs?: string[] | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_learning_platforms_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_lecture_tracker: {
        Row: {
          chapter_id: string | null
          chapter: string | null
          completed_at: string | null
          created_at: string
          duration_minutes: number
          id: string
          lecture_url: string | null
          notes: string | null
          planned_for: string | null
          priority: string
          source: string | null
          status: string
          subject: string
          teacher: string | null
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
          watched_minutes: number
        }
        Insert: {
          chapter_id?: string | null
          chapter?: string | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          lecture_url?: string | null
          notes?: string | null
          planned_for?: string | null
          priority?: string
          source?: string | null
          status?: string
          subject: string
          teacher?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
          watched_minutes?: number
        }
        Update: {
          chapter_id?: string | null
          chapter?: string | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          lecture_url?: string | null
          notes?: string | null
          planned_for?: string | null
          priority?: string
          source?: string | null
          status?: string
          subject?: string
          teacher?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
          watched_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_lecture_tracker_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_lecture_tracker_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_legal_regulatory_records: {
        Row: {
          authority_name: string | null
          compliance_requirement: string | null
          created_at: string
          data_last_verified_at: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          institute_id: string
          record_type: string
          reference_number: string | null
          regulation_name: string | null
          scope: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          status: string | null
          summary: string | null
          year: number | null
        }
        Insert: {
          authority_name?: string | null
          compliance_requirement?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          institute_id: string
          record_type: string
          reference_number?: string | null
          regulation_name?: string | null
          scope?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          year?: number | null
        }
        Update: {
          authority_name?: string | null
          compliance_requirement?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          institute_id?: string
          record_type?: string
          reference_number?: string | null
          regulation_name?: string | null
          scope?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_legal_regulatory_records_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_library_resources: {
        Row: {
          accessibility_features: string | null
          books_count: number | null
          borrowing_rules: string | null
          collection_size: number | null
          collection_unit: string | null
          created_at: string
          data_last_verified_at: string | null
          databases_available: string[] | null
          description: string | null
          digital_access_url: string | null
          e_resources_count: number | null
          id: string
          institute_id: string
          journals_count: number | null
          library_name: string
          library_type: string | null
          membership_eligibility: string | null
          official_url: string | null
          opening_hours: string | null
          seating_capacity: number | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          accessibility_features?: string | null
          books_count?: number | null
          borrowing_rules?: string | null
          collection_size?: number | null
          collection_unit?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          databases_available?: string[] | null
          description?: string | null
          digital_access_url?: string | null
          e_resources_count?: number | null
          id?: string
          institute_id: string
          journals_count?: number | null
          library_name: string
          library_type?: string | null
          membership_eligibility?: string | null
          official_url?: string | null
          opening_hours?: string | null
          seating_capacity?: number | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          accessibility_features?: string | null
          books_count?: number | null
          borrowing_rules?: string | null
          collection_size?: number | null
          collection_unit?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          databases_available?: string[] | null
          description?: string | null
          digital_access_url?: string | null
          e_resources_count?: number | null
          id?: string
          institute_id?: string
          journals_count?: number | null
          library_name?: string
          library_type?: string | null
          membership_eligibility?: string | null
          official_url?: string | null
          opening_hours?: string | null
          seating_capacity?: number | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_library_resources_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_living_cost_components: {
        Row: {
          amount: number | null
          city: string | null
          cost_category: string
          cost_item: string
          created_at: string
          currency: string
          frequency: string | null
          id: string
          institute_id: string | null
          mandatory: boolean | null
          max_amount: number | null
          min_amount: number | null
          notes: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          amount?: number | null
          city?: string | null
          cost_category: string
          cost_item: string
          created_at?: string
          currency?: string
          frequency?: string | null
          id?: string
          institute_id?: string | null
          mandatory?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          notes?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          amount?: number | null
          city?: string | null
          cost_category?: string
          cost_item?: string
          created_at?: string
          currency?: string
          frequency?: string | null
          id?: string
          institute_id?: string | null
          mandatory?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          notes?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_living_cost_components_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_living_cost_data: {
        Row: {
          amount: number | null
          category: string | null
          city: string | null
          cost_type: string
          created_at: string
          currency: string
          description: string | null
          frequency: string | null
          id: string
          institute_id: string | null
          institute_name: string
          institute_type: string | null
          source_label: string | null
          source_url: string | null
          state: string | null
          updated_at: string
          year: number
        }
        Insert: {
          amount?: number | null
          category?: string | null
          city?: string | null
          cost_type: string
          created_at?: string
          currency?: string
          description?: string | null
          frequency?: string | null
          id?: string
          institute_id?: string | null
          institute_name: string
          institute_type?: string | null
          source_label?: string | null
          source_url?: string | null
          state?: string | null
          updated_at?: string
          year?: number
        }
        Update: {
          amount?: number | null
          category?: string | null
          city?: string | null
          cost_type?: string
          created_at?: string
          currency?: string
          description?: string | null
          frequency?: string | null
          id?: string
          institute_id?: string | null
          institute_name?: string
          institute_type?: string | null
          source_label?: string | null
          source_url?: string | null
          state?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_living_cost_data_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_local_cost_benchmarks: {
        Row: {
          cost_category: string
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          frequency: string | null
          id: string
          institute_id: string
          item_name: string
          locality: string | null
          max_amount: number | null
          methodology: string | null
          min_amount: number | null
          source_label: string | null
          source_url: string | null
          typical_amount: number | null
          year: number
        }
        Insert: {
          cost_category: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          frequency?: string | null
          id?: string
          institute_id: string
          item_name: string
          locality?: string | null
          max_amount?: number | null
          methodology?: string | null
          min_amount?: number | null
          source_label?: string | null
          source_url?: string | null
          typical_amount?: number | null
          year: number
        }
        Update: {
          cost_category?: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          frequency?: string | null
          id?: string
          institute_id?: string
          item_name?: string
          locality?: string | null
          max_amount?: number | null
          methodology?: string | null
          min_amount?: number | null
          source_label?: string | null
          source_url?: string | null
          typical_amount?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_local_cost_benchmarks_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_mess_fee_data: {
        Row: {
          academic_year: string | null
          amount: number | null
          category: string | null
          created_at: string
          currency: string
          data_last_verified_at: string | null
          fee_component: string
          frequency: string | null
          id: string
          institute_id: string | null
          mandatory: boolean | null
          mess_type: string | null
          refundable: boolean | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          academic_year?: string | null
          amount?: number | null
          category?: string | null
          created_at?: string
          currency?: string
          data_last_verified_at?: string | null
          fee_component: string
          frequency?: string | null
          id?: string
          institute_id?: string | null
          mandatory?: boolean | null
          mess_type?: string | null
          refundable?: boolean | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          academic_year?: string | null
          amount?: number | null
          category?: string | null
          created_at?: string
          currency?: string
          data_last_verified_at?: string | null
          fee_component?: string
          frequency?: string | null
          id?: string
          institute_id?: string | null
          mandatory?: boolean | null
          mess_type?: string | null
          refundable?: boolean | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_mess_fee_data_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_mess_services: {
        Row: {
          capacity: number | null
          complaint_contact: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          description: string | null
          dietary_options: string[] | null
          eligibility: string | null
          id: string
          institute_id: string
          location: string | null
          meal_plan: string | null
          meal_types: string[] | null
          menu_url: string | null
          mess_name: string
          monthly_fee: number | null
          official_url: string | null
          operating_hours: string | null
          provider_name: string | null
          refundable: boolean | null
          security_deposit: number | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          capacity?: number | null
          complaint_contact?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          description?: string | null
          dietary_options?: string[] | null
          eligibility?: string | null
          id?: string
          institute_id: string
          location?: string | null
          meal_plan?: string | null
          meal_types?: string[] | null
          menu_url?: string | null
          mess_name: string
          monthly_fee?: number | null
          official_url?: string | null
          operating_hours?: string | null
          provider_name?: string | null
          refundable?: boolean | null
          security_deposit?: number | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          capacity?: number | null
          complaint_contact?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          description?: string | null
          dietary_options?: string[] | null
          eligibility?: string | null
          id?: string
          institute_id?: string
          location?: string | null
          meal_plan?: string | null
          meal_types?: string[] | null
          menu_url?: string | null
          mess_name?: string
          monthly_fee?: number | null
          official_url?: string | null
          operating_hours?: string | null
          provider_name?: string | null
          refundable?: boolean | null
          security_deposit?: number | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_mess_services_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_mistake_book: {
        Row: {
          chapter_id: string | null
          correct_approach: string | null
          created_at: string
          id: string
          last_reattempted_at: string | null
          learning_note: string | null
          mistake_type: string
          question_id: string | null
          reattempt_count: number
          resolved: boolean
          subject: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          correct_approach?: string | null
          created_at?: string
          id?: string
          last_reattempted_at?: string | null
          learning_note?: string | null
          mistake_type: string
          question_id?: string | null
          reattempt_count?: number
          resolved?: boolean
          subject: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          correct_approach?: string | null
          created_at?: string
          id?: string
          last_reattempted_at?: string | null
          learning_note?: string | null
          mistake_type?: string
          question_id?: string | null
          reattempt_count?: number
          resolved?: boolean
          subject?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_mistake_book_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_mistake_book_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "jee_pyq_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_mistake_book_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_mobility_policies: {
        Row: {
          applicable_programs: string[] | null
          created_at: string
          data_last_verified_at: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          institute_id: string
          policy_name: string
          policy_text: string | null
          policy_type: string
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          applicable_programs?: string[] | null
          created_at?: string
          data_last_verified_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          institute_id: string
          policy_name: string
          policy_text?: string | null
          policy_type: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          applicable_programs?: string[] | null
          created_at?: string
          data_last_verified_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          institute_id?: string
          policy_name?: string
          policy_text?: string | null
          policy_type?: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_mobility_policies_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_off_campus_housing: {
        Row: {
          address: string | null
          amenities: string[] | null
          availability_status: string | null
          brokerage_amount: number | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          data_last_verified_at: string | null
          deposit_currency: string | null
          distance_from_campus_km: number | null
          furnished_status: string | null
          gender_policy: string | null
          housing_type: string | null
          id: string
          institute_id: string
          locality: string | null
          monthly_rent_max: number | null
          monthly_rent_min: number | null
          monthly_rent_typical: number | null
          occupancy_options: string[] | null
          property_name: string
          rent_currency: string | null
          room_types: string[] | null
          security_deposit: number | null
          security_features: string[] | null
          source_label: string | null
          source_url: string | null
          student_policy: string | null
          typical_travel_time_minutes: number | null
          updated_at: string
          utilities_included: string | null
          website_url: string | null
          year: number | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          availability_status?: string | null
          brokerage_amount?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          deposit_currency?: string | null
          distance_from_campus_km?: number | null
          furnished_status?: string | null
          gender_policy?: string | null
          housing_type?: string | null
          id?: string
          institute_id: string
          locality?: string | null
          monthly_rent_max?: number | null
          monthly_rent_min?: number | null
          monthly_rent_typical?: number | null
          occupancy_options?: string[] | null
          property_name: string
          rent_currency?: string | null
          room_types?: string[] | null
          security_deposit?: number | null
          security_features?: string[] | null
          source_label?: string | null
          source_url?: string | null
          student_policy?: string | null
          typical_travel_time_minutes?: number | null
          updated_at?: string
          utilities_included?: string | null
          website_url?: string | null
          year?: number | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          availability_status?: string | null
          brokerage_amount?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          deposit_currency?: string | null
          distance_from_campus_km?: number | null
          furnished_status?: string | null
          gender_policy?: string | null
          housing_type?: string | null
          id?: string
          institute_id?: string
          locality?: string | null
          monthly_rent_max?: number | null
          monthly_rent_min?: number | null
          monthly_rent_typical?: number | null
          occupancy_options?: string[] | null
          property_name?: string
          rent_currency?: string | null
          room_types?: string[] | null
          security_deposit?: number | null
          security_features?: string[] | null
          source_label?: string | null
          source_url?: string | null
          student_policy?: string | null
          typical_travel_time_minutes?: number | null
          updated_at?: string
          utilities_included?: string | null
          website_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_off_campus_housing_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_outreach_activities: {
        Row: {
          activity_name: string
          activity_type: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          end_date: string | null
          id: string
          institute_id: string
          location: string | null
          official_url: string | null
          organizer_department: string | null
          participants_count: number | null
          registration_url: string | null
          school_or_community: string | null
          source_label: string | null
          source_url: string | null
          start_date: string | null
          target_audience: string | null
          year: number | null
        }
        Insert: {
          activity_name: string
          activity_type?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          institute_id: string
          location?: string | null
          official_url?: string | null
          organizer_department?: string | null
          participants_count?: number | null
          registration_url?: string | null
          school_or_community?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          target_audience?: string | null
          year?: number | null
        }
        Update: {
          activity_name?: string
          activity_type?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          institute_id?: string
          location?: string | null
          official_url?: string | null
          organizer_department?: string | null
          participants_count?: number | null
          registration_url?: string | null
          school_or_community?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          target_audience?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_outreach_activities_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_patent_portfolio: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          domestic_count: number | null
          filed_count: number | null
          granted_count: number | null
          id: string
          institute_id: string
          international_count: number | null
          patent_count: number | null
          patent_status: string
          pending_count: number | null
          source_label: string | null
          source_url: string | null
          technology_domains: string[] | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          domestic_count?: number | null
          filed_count?: number | null
          granted_count?: number | null
          id?: string
          institute_id: string
          international_count?: number | null
          patent_count?: number | null
          patent_status: string
          pending_count?: number | null
          source_label?: string | null
          source_url?: string | null
          technology_domains?: string[] | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          domestic_count?: number | null
          filed_count?: number | null
          granted_count?: number | null
          id?: string
          institute_id?: string
          international_count?: number | null
          patent_count?: number | null
          patent_status?: string
          pending_count?: number | null
          source_label?: string | null
          source_url?: string | null
          technology_domains?: string[] | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_patent_portfolio_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_patent_portfolios: {
        Row: {
          active_count: number | null
          created_at: string
          data_last_verified_at: string | null
          domestic_count: number | null
          filed_count: number | null
          granted_count: number | null
          id: string
          institute_id: string
          international_count: number | null
          methodology: string | null
          patent_type: string | null
          pending_count: number | null
          published_count: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          technology_domains: string[] | null
          year: number
        }
        Insert: {
          active_count?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          domestic_count?: number | null
          filed_count?: number | null
          granted_count?: number | null
          id?: string
          institute_id: string
          international_count?: number | null
          methodology?: string | null
          patent_type?: string | null
          pending_count?: number | null
          published_count?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          technology_domains?: string[] | null
          year: number
        }
        Update: {
          active_count?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          domestic_count?: number | null
          filed_count?: number | null
          granted_count?: number | null
          id?: string
          institute_id?: string
          international_count?: number | null
          methodology?: string | null
          patent_type?: string | null
          pending_count?: number | null
          published_count?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          technology_domains?: string[] | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_patent_portfolios_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_payment_services: {
        Row: {
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          id: string
          institute_id: string
          official_url: string | null
          payment_type: string
          processing_fee: number | null
          provider_name: string | null
          refund_support: string | null
          settlement_time: string | null
          source_label: string | null
          source_url: string | null
          student_eligibility: string | null
          supported_methods: string[] | null
          year: number | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          payment_type: string
          processing_fee?: number | null
          provider_name?: string | null
          refund_support?: string | null
          settlement_time?: string | null
          source_label?: string | null
          source_url?: string | null
          student_eligibility?: string | null
          supported_methods?: string[] | null
          year?: number | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          payment_type?: string
          processing_fee?: number | null
          provider_name?: string | null
          refund_support?: string | null
          settlement_time?: string | null
          source_label?: string | null
          source_url?: string | null
          student_eligibility?: string | null
          supported_methods?: string[] | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_payment_services_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_placement_data: {
        Row: {
          batch_label: string | null
          city: string | null
          created_at: string
          description: string | null
          id: string
          institute_id: string | null
          institute_name: string
          institute_type: string | null
          metric: string
          program_code: string | null
          program_name: string | null
          source_label: string | null
          source_url: string | null
          state: string | null
          unit: string | null
          updated_at: string
          value: number | null
          year: number
        }
        Insert: {
          batch_label?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          institute_id?: string | null
          institute_name: string
          institute_type?: string | null
          metric: string
          program_code?: string | null
          program_name?: string | null
          source_label?: string | null
          source_url?: string | null
          state?: string | null
          unit?: string | null
          updated_at?: string
          value?: number | null
          year?: number
        }
        Update: {
          batch_label?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          institute_id?: string | null
          institute_name?: string
          institute_type?: string | null
          metric?: string
          program_code?: string | null
          program_name?: string | null
          source_label?: string | null
          source_url?: string | null
          state?: string | null
          unit?: string | null
          updated_at?: string
          value?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_placement_data_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_placement_program_stats: {
        Row: {
          average_package: number | null
          batch_label: string | null
          companies_count: number | null
          created_at: string
          data_last_verified_at: string | null
          eligible_students: number | null
          highest_package: number | null
          id: string
          institute_id: string | null
          lowest_package: number | null
          median_package: number | null
          offers_count: number | null
          package_currency: string
          placement_percentage: number | null
          program_id: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          students_placed: number | null
          year: number
        }
        Insert: {
          average_package?: number | null
          batch_label?: string | null
          companies_count?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          eligible_students?: number | null
          highest_package?: number | null
          id?: string
          institute_id?: string | null
          lowest_package?: number | null
          median_package?: number | null
          offers_count?: number | null
          package_currency?: string
          placement_percentage?: number | null
          program_id?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          students_placed?: number | null
          year: number
        }
        Update: {
          average_package?: number | null
          batch_label?: string | null
          companies_count?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          eligible_students?: number | null
          highest_package?: number | null
          id?: string
          institute_id?: string | null
          lowest_package?: number | null
          median_package?: number | null
          offers_count?: number | null
          package_currency?: string
          placement_percentage?: number | null
          program_id?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          students_placed?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_placement_program_stats_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_placement_program_stats_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_placement_recruiter_stats: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          id: string
          industry: string | null
          institute_id: string | null
          internship_offers: number | null
          offers_count: number | null
          package_average: number | null
          package_currency: string
          package_max: number | null
          package_min: number | null
          program_id: string | null
          recruiter_name: string
          role_category: string | null
          sector: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          students_joined: number | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          industry?: string | null
          institute_id?: string | null
          internship_offers?: number | null
          offers_count?: number | null
          package_average?: number | null
          package_currency?: string
          package_max?: number | null
          package_min?: number | null
          program_id?: string | null
          recruiter_name: string
          role_category?: string | null
          sector?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          students_joined?: number | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          industry?: string | null
          institute_id?: string | null
          internship_offers?: number | null
          offers_count?: number | null
          package_average?: number | null
          package_currency?: string
          package_max?: number | null
          package_min?: number | null
          program_id?: string | null
          recruiter_name?: string
          role_category?: string | null
          sector?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          students_joined?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_placement_recruiter_stats_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_placement_recruiter_stats_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_placement_recruiters: {
        Row: {
          average_package: number | null
          created_at: string
          highest_package: number | null
          id: string
          institute_id: string
          median_package: number | null
          notes: string | null
          offers_count: number | null
          package_currency: string
          program_id: string | null
          recruiter_name: string
          sector: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          average_package?: number | null
          created_at?: string
          highest_package?: number | null
          id?: string
          institute_id: string
          median_package?: number | null
          notes?: string | null
          offers_count?: number | null
          package_currency?: string
          program_id?: string | null
          recruiter_name: string
          sector?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          average_package?: number | null
          created_at?: string
          highest_package?: number | null
          id?: string
          institute_id?: string
          median_package?: number | null
          notes?: string | null
          offers_count?: number | null
          package_currency?: string
          program_id?: string | null
          recruiter_name?: string
          sector?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_placement_recruiters_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_placement_recruiters_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_placement_roles: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string | null
          offers_count: number | null
          package_currency: string
          package_max: number | null
          package_min: number | null
          program_name: string | null
          recruiter_name: string | null
          role_name: string
          sector: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string | null
          offers_count?: number | null
          package_currency?: string
          package_max?: number | null
          package_min?: number | null
          program_name?: string | null
          recruiter_name?: string | null
          role_name: string
          sector?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string | null
          offers_count?: number | null
          package_currency?: string
          package_max?: number | null
          package_min?: number | null
          program_name?: string | null
          recruiter_name?: string | null
          role_name?: string
          sector?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_placement_roles_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_placement_statistics: {
        Row: {
          average_package: number | null
          batch_label: string | null
          companies_participated: number | null
          created_at: string
          data_last_verified_at: string | null
          domestic_highest_package: number | null
          eligible_students: number | null
          highest_package: number | null
          id: string
          institute_id: string | null
          international_highest_package: number | null
          internship_offers: number | null
          lowest_package: number | null
          median_package: number | null
          offers_received: number | null
          package_currency: string
          placement_percentage: number | null
          placement_type: string
          program_id: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          students_placed: number | null
          students_registered: number | null
          students_with_internship: number | null
          unique_offers: number | null
          updated_at: string
          year: number
        }
        Insert: {
          average_package?: number | null
          batch_label?: string | null
          companies_participated?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          domestic_highest_package?: number | null
          eligible_students?: number | null
          highest_package?: number | null
          id?: string
          institute_id?: string | null
          international_highest_package?: number | null
          internship_offers?: number | null
          lowest_package?: number | null
          median_package?: number | null
          offers_received?: number | null
          package_currency?: string
          placement_percentage?: number | null
          placement_type?: string
          program_id?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          students_placed?: number | null
          students_registered?: number | null
          students_with_internship?: number | null
          unique_offers?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          average_package?: number | null
          batch_label?: string | null
          companies_participated?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          domestic_highest_package?: number | null
          eligible_students?: number | null
          highest_package?: number | null
          id?: string
          institute_id?: string | null
          international_highest_package?: number | null
          internship_offers?: number | null
          lowest_package?: number | null
          median_package?: number | null
          offers_received?: number | null
          package_currency?: string
          placement_percentage?: number | null
          placement_type?: string
          program_id?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          students_placed?: number | null
          students_registered?: number | null
          students_with_internship?: number | null
          unique_offers?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_placement_statistics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_placement_statistics_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_placement_trends: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string | null
          metric: string
          program_id: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          unit: string | null
          value: number | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string | null
          metric: string
          program_id?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          unit?: string | null
          value?: number | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string | null
          metric?: string
          program_id?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          unit?: string | null
          value?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_placement_trends_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_placement_trends_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_prediction_models: {
        Row: {
          candidates_count: number | null
          category: string | null
          created_at: string
          exam: string
          id: string
          is_active: boolean
          metric: string
          model_data: Json
          notes: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number
        }
        Insert: {
          candidates_count?: number | null
          category?: string | null
          created_at?: string
          exam: string
          id?: string
          is_active?: boolean
          metric: string
          model_data?: Json
          notes?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          candidates_count?: number | null
          category?: string | null
          created_at?: string
          exam?: string
          id?: string
          is_active?: boolean
          metric?: string
          model_data?: Json
          notes?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      jee_preference_list_items: {
        Row: {
          category: string | null
          city: string | null
          closing_rank: number | null
          created_at: string
          id: string
          institute_name: string
          institute_type: string | null
          notes: string | null
          opening_rank: number | null
          preference_list_id: string
          preference_order: number
          program_code: string | null
          program_name: string
          quota: string | null
          round: number | null
          shortlist_id: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          closing_rank?: number | null
          created_at?: string
          id?: string
          institute_name: string
          institute_type?: string | null
          notes?: string | null
          opening_rank?: number | null
          preference_list_id: string
          preference_order: number
          program_code?: string | null
          program_name: string
          quota?: string | null
          round?: number | null
          shortlist_id?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          city?: string | null
          closing_rank?: number | null
          created_at?: string
          id?: string
          institute_name?: string
          institute_type?: string | null
          notes?: string | null
          opening_rank?: number | null
          preference_list_id?: string
          preference_order?: number
          program_code?: string | null
          program_name?: string
          quota?: string | null
          round?: number | null
          shortlist_id?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_preference_list_items_preference_list_id_fkey"
            columns: ["preference_list_id"]
            isOneToOne: false
            referencedRelation: "jee_preference_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_preference_list_items_shortlist_id_fkey"
            columns: ["shortlist_id"]
            isOneToOne: false
            referencedRelation: "jee_college_shortlists"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_preference_lists: {
        Row: {
          counselling: string
          created_at: string
          exam: string
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          counselling?: string
          created_at?: string
          exam?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          counselling?: string
          created_at?: string
          exam?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      jee_professional_certifications: {
        Row: {
          application_url: string | null
          certification_name: string
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          delivery_mode: string | null
          domain: string | null
          eligibility: string | null
          exam_required: boolean | null
          fee_amount: number | null
          id: string
          institute_id: string
          official_url: string | null
          provider_name: string | null
          source_label: string | null
          source_url: string | null
          student_discount: string | null
          year: number | null
        }
        Insert: {
          application_url?: string | null
          certification_name: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          delivery_mode?: string | null
          domain?: string | null
          eligibility?: string | null
          exam_required?: boolean | null
          fee_amount?: number | null
          id?: string
          institute_id: string
          official_url?: string | null
          provider_name?: string | null
          source_label?: string | null
          source_url?: string | null
          student_discount?: string | null
          year?: number | null
        }
        Update: {
          application_url?: string | null
          certification_name?: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          delivery_mode?: string | null
          domain?: string | null
          eligibility?: string | null
          exam_required?: boolean | null
          fee_amount?: number | null
          id?: string
          institute_id?: string
          official_url?: string | null
          provider_name?: string | null
          source_label?: string | null
          source_url?: string | null
          student_discount?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_professional_certifications_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_program_eligibility_rules: {
        Row: {
          age_rule: string | null
          attempts_rule: string | null
          candidate_category: string | null
          created_at: string
          domicile_rule: string | null
          gender_rule: string | null
          id: string
          minimum_percentage: number | null
          minimum_rank: number | null
          minimum_rank_type: string | null
          nationality_rule: string | null
          other_conditions: string | null
          program_id: string
          qualification: string | null
          required_subjects: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          age_rule?: string | null
          attempts_rule?: string | null
          candidate_category?: string | null
          created_at?: string
          domicile_rule?: string | null
          gender_rule?: string | null
          id?: string
          minimum_percentage?: number | null
          minimum_rank?: number | null
          minimum_rank_type?: string | null
          nationality_rule?: string | null
          other_conditions?: string | null
          program_id: string
          qualification?: string | null
          required_subjects?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          age_rule?: string | null
          attempts_rule?: string | null
          candidate_category?: string | null
          created_at?: string
          domicile_rule?: string | null
          gender_rule?: string | null
          id?: string
          minimum_percentage?: number | null
          minimum_rank?: number | null
          minimum_rank_type?: string | null
          nationality_rule?: string | null
          other_conditions?: string | null
          program_id?: string
          qualification?: string | null
          required_subjects?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_program_eligibility_rules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_program_restrictions: {
        Row: {
          candidate_category: string | null
          condition_text: string
          created_at: string
          data_last_verified_at: string | null
          domicile_state: string | null
          gender: string | null
          id: string
          institute_id: string | null
          maximum_rank: number | null
          minimum_marks: number | null
          minimum_rank: number | null
          minimum_rank_type: string | null
          program_id: string | null
          required_subjects: string | null
          restriction_type: string
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          candidate_category?: string | null
          condition_text: string
          created_at?: string
          data_last_verified_at?: string | null
          domicile_state?: string | null
          gender?: string | null
          id?: string
          institute_id?: string | null
          maximum_rank?: number | null
          minimum_marks?: number | null
          minimum_rank?: number | null
          minimum_rank_type?: string | null
          program_id?: string | null
          required_subjects?: string | null
          restriction_type: string
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          candidate_category?: string | null
          condition_text?: string
          created_at?: string
          data_last_verified_at?: string | null
          domicile_state?: string | null
          gender?: string | null
          id?: string
          institute_id?: string | null
          maximum_rank?: number | null
          minimum_marks?: number | null
          minimum_rank?: number | null
          minimum_rank_type?: string | null
          program_id?: string | null
          required_subjects?: string | null
          restriction_type?: string
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_program_restrictions_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_program_restrictions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_program_seat_details: {
        Row: {
          category: string | null
          created_at: string
          gender: string | null
          id: string
          program_id: string
          quota: string | null
          seat_count: number | null
          seat_type: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          program_id: string
          quota?: string | null
          seat_count?: number | null
          seat_type?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          category?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          program_id?: string
          quota?: string | null
          seat_count?: number | null
          seat_type?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_program_seat_details_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_program_specializations: {
        Row: {
          active: boolean
          created_at: string
          department_name: string | null
          description: string | null
          id: string
          program_id: string
          source_label: string | null
          source_url: string | null
          specialization_code: string | null
          specialization_name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          department_name?: string | null
          description?: string | null
          id?: string
          program_id: string
          source_label?: string | null
          source_url?: string | null
          specialization_code?: string | null
          specialization_name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          department_name?: string | null
          description?: string | null
          id?: string
          program_id?: string
          source_label?: string | null
          source_url?: string | null
          specialization_code?: string | null
          specialization_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_program_specializations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "jee_academic_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_public_activity_archive: {
        Row: {
          activity_name: string
          activity_type: string
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          document_url: string | null
          event_date: string | null
          id: string
          institute_id: string
          organizer_name: string | null
          outcome_summary: string | null
          participant_count: number | null
          recording_url: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          activity_name: string
          activity_type: string
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          document_url?: string | null
          event_date?: string | null
          id?: string
          institute_id: string
          organizer_name?: string | null
          outcome_summary?: string | null
          participant_count?: number | null
          recording_url?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          activity_name?: string
          activity_type?: string
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          document_url?: string | null
          event_date?: string | null
          id?: string
          institute_id?: string
          organizer_name?: string | null
          outcome_summary?: string | null
          participant_count?: number | null
          recording_url?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_public_activity_archive_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_public_lectures: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          description: string | null
          end_time: string | null
          event_date: string | null
          id: string
          institute_id: string
          lecture_title: string
          official_url: string | null
          open_to_public: boolean | null
          recording_url: string | null
          registration_required: boolean | null
          registration_url: string | null
          source_label: string | null
          source_url: string | null
          speaker_affiliation: string | null
          speaker_name: string | null
          start_time: string | null
          topic: string | null
          venue: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string | null
          id?: string
          institute_id: string
          lecture_title: string
          official_url?: string | null
          open_to_public?: boolean | null
          recording_url?: string | null
          registration_required?: boolean | null
          registration_url?: string | null
          source_label?: string | null
          source_url?: string | null
          speaker_affiliation?: string | null
          speaker_name?: string | null
          start_time?: string | null
          topic?: string | null
          venue?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string | null
          id?: string
          institute_id?: string
          lecture_title?: string
          official_url?: string | null
          open_to_public?: boolean | null
          recording_url?: string | null
          registration_required?: boolean | null
          registration_url?: string | null
          source_label?: string | null
          source_url?: string | null
          speaker_affiliation?: string | null
          speaker_name?: string | null
          start_time?: string | null
          topic?: string | null
          venue?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_public_lectures_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_pyq_attempts: {
        Row: {
          attempted_at: string
          is_attempted: boolean
          is_correct: boolean | null
          question_id: string
          selected_answer: Json | null
          time_taken_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attempted_at?: string
          is_attempted?: boolean
          is_correct?: boolean | null
          question_id: string
          selected_answer?: Json | null
          time_taken_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attempted_at?: string
          is_attempted?: boolean
          is_correct?: boolean | null
          question_id?: string
          selected_answer?: Json | null
          time_taken_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_pyq_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "jee_pyq_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_pyq_bookmarks: {
        Row: {
          created_at: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_pyq_bookmarks_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "jee_pyq_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_pyq_questions: {
        Row: {
          chapter_id: string | null
          correct_answer: Json | null
          created_at: string
          difficulty: string | null
          exam: string
          explanation: string | null
          id: string
          marks: number | null
          negative_marks: number | null
          options: Json
          paper: string | null
          question_text: string
          question_type: string
          session: string | null
          source_label: string | null
          source_url: string | null
          subject: string
          topic_id: string | null
          updated_at: string
          year: number
        }
        Insert: {
          chapter_id?: string | null
          correct_answer?: Json | null
          created_at?: string
          difficulty?: string | null
          exam: string
          explanation?: string | null
          id?: string
          marks?: number | null
          negative_marks?: number | null
          options?: Json
          paper?: string | null
          question_text: string
          question_type?: string
          session?: string | null
          source_label?: string | null
          source_url?: string | null
          subject: string
          topic_id?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          chapter_id?: string | null
          correct_answer?: Json | null
          created_at?: string
          difficulty?: string | null
          exam?: string
          explanation?: string | null
          id?: string
          marks?: number | null
          negative_marks?: number | null
          options?: Json
          paper?: string | null
          question_text?: string
          question_type?: string
          session?: string | null
          source_label?: string | null
          source_url?: string | null
          subject?: string
          topic_id?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_pyq_questions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_pyq_questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_quality_assurance: {
        Row: {
          assessment_cycle: string | null
          assessment_date: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          framework_name: string
          framework_type: string | null
          grade: string | null
          id: string
          institute_id: string
          metric_name: string | null
          metric_unit: string | null
          metric_value: number | null
          score: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          assessment_cycle?: string | null
          assessment_date?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          framework_name: string
          framework_type?: string | null
          grade?: string | null
          id?: string
          institute_id: string
          metric_name?: string | null
          metric_unit?: string | null
          metric_value?: number | null
          score?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          assessment_cycle?: string | null
          assessment_date?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          framework_name?: string
          framework_type?: string | null
          grade?: string | null
          id?: string
          institute_id?: string
          metric_name?: string | null
          metric_unit?: string | null
          metric_value?: number | null
          score?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_quality_assurance_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_quality_of_life_metrics: {
        Row: {
          category: string
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          population: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          category: string
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          category?: string
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_quality_of_life_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_question_bookmarks: {
        Row: {
          created_at: string
          id: string
          note: string | null
          question_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          question_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          question_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_question_bookmarks_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "jee_pyq_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_quota_rules: {
        Row: {
          applicable_institute_type: string | null
          applicable_states: string | null
          counselling: string
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          domicile_required: boolean | null
          id: string
          quota_code: string
          quota_name: string
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          applicable_institute_type?: string | null
          applicable_states?: string | null
          counselling: string
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          domicile_required?: boolean | null
          id?: string
          quota_code: string
          quota_name: string
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          applicable_institute_type?: string | null
          applicable_states?: string | null
          counselling?: string
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          domicile_required?: boolean | null
          id?: string
          quota_code?: string
          quota_name?: string
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: []
      }
      jee_ranking_history: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology_version: string | null
          rank: number | null
          rank_change: number | null
          ranking_source_id: string | null
          score: number | null
          score_change: number | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology_version?: string | null
          rank?: number | null
          rank_change?: number | null
          ranking_source_id?: string | null
          score?: number | null
          score_change?: number | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology_version?: string | null
          rank?: number | null
          rank_change?: number | null
          ranking_source_id?: string | null
          score?: number | null
          score_change?: number | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_ranking_history_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_ranking_history_ranking_source_id_fkey"
            columns: ["ranking_source_id"]
            isOneToOne: false
            referencedRelation: "jee_ranking_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_ranking_indicators: {
        Row: {
          created_at: string
          definition: string | null
          id: string
          indicator_category: string | null
          indicator_name: string
          methodology_notes: string | null
          ranking_source_id: string | null
          score_unit: string | null
          source_label: string | null
          source_url: string | null
          weight_percentage: number | null
        }
        Insert: {
          created_at?: string
          definition?: string | null
          id?: string
          indicator_category?: string | null
          indicator_name: string
          methodology_notes?: string | null
          ranking_source_id?: string | null
          score_unit?: string | null
          source_label?: string | null
          source_url?: string | null
          weight_percentage?: number | null
        }
        Update: {
          created_at?: string
          definition?: string | null
          id?: string
          indicator_category?: string | null
          indicator_name?: string
          methodology_notes?: string | null
          ranking_source_id?: string | null
          score_unit?: string | null
          source_label?: string | null
          source_url?: string | null
          weight_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_ranking_indicators_ranking_source_id_fkey"
            columns: ["ranking_source_id"]
            isOneToOne: false
            referencedRelation: "jee_ranking_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_ranking_sources: {
        Row: {
          country_scope: string | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          methodology_summary: string | null
          methodology_url: string | null
          ranking_body: string
          ranking_category: string | null
          ranking_name: string | null
          source_label: string | null
          source_url: string | null
        }
        Insert: {
          country_scope?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          methodology_summary?: string | null
          methodology_url?: string | null
          ranking_body: string
          ranking_category?: string | null
          ranking_name?: string | null
          source_label?: string | null
          source_url?: string | null
        }
        Update: {
          country_scope?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          methodology_summary?: string | null
          methodology_url?: string | null
          ranking_body?: string
          ranking_category?: string | null
          ranking_name?: string | null
          source_label?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      jee_regulatory_actions: {
        Row: {
          action_date: string | null
          action_type: string
          affected_scope: string | null
          authority_name: string | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          reference_number: string | null
          resolution_text: string | null
          response_text: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          status: string | null
          summary: string | null
          year: number | null
        }
        Insert: {
          action_date?: string | null
          action_type: string
          affected_scope?: string | null
          authority_name?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          reference_number?: string | null
          resolution_text?: string | null
          response_text?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          year?: number | null
        }
        Update: {
          action_date?: string | null
          action_type?: string
          affected_scope?: string | null
          authority_name?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          reference_number?: string | null
          resolution_text?: string | null
          response_text?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_regulatory_actions_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_regulatory_approvals: {
        Row: {
          approval_number: string | null
          approval_type: string
          authority_name: string
          conditions: string | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          issue_date: string | null
          scope: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          status: string | null
          valid_from: string | null
          valid_until: string | null
          year: number | null
        }
        Insert: {
          approval_number?: string | null
          approval_type: string
          authority_name: string
          conditions?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          issue_date?: string | null
          scope?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          valid_from?: string | null
          valid_until?: string | null
          year?: number | null
        }
        Update: {
          approval_number?: string | null
          approval_type?: string
          authority_name?: string
          conditions?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          issue_date?: string | null
          scope?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          valid_from?: string | null
          valid_until?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_regulatory_approvals_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_rental_market_data: {
        Row: {
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          frequency: string | null
          furnishing: string | null
          id: string
          institute_id: string
          locality: string
          methodology: string | null
          property_type: string | null
          rent_max: number | null
          rent_median: number | null
          rent_min: number | null
          room_type: string | null
          sample_size: number | null
          security_deposit_median: number | null
          source_label: string | null
          source_url: string | null
          utilities_typical: number | null
          year: number
        }
        Insert: {
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          frequency?: string | null
          furnishing?: string | null
          id?: string
          institute_id: string
          locality: string
          methodology?: string | null
          property_type?: string | null
          rent_max?: number | null
          rent_median?: number | null
          rent_min?: number | null
          room_type?: string | null
          sample_size?: number | null
          security_deposit_median?: number | null
          source_label?: string | null
          source_url?: string | null
          utilities_typical?: number | null
          year: number
        }
        Update: {
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          frequency?: string | null
          furnishing?: string | null
          id?: string
          institute_id?: string
          locality?: string
          methodology?: string | null
          property_type?: string | null
          rent_max?: number | null
          rent_median?: number | null
          rent_min?: number | null
          room_type?: string | null
          sample_size?: number | null
          security_deposit_median?: number | null
          source_label?: string | null
          source_url?: string | null
          utilities_typical?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_rental_market_data_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_research_areas: {
        Row: {
          area_name: string
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          description: string | null
          discipline_group: string | null
          id: string
          institute_id: string
          official_url: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          area_name: string
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          discipline_group?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          area_name?: string
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          discipline_group?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_research_areas_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_research_centres: {
        Row: {
          centre_name: string
          centre_type: string | null
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          description: string | null
          director_name: string | null
          id: string
          institute_id: string
          official_url: string | null
          research_areas: string[] | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          centre_name: string
          centre_type?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          director_name?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          research_areas?: string[] | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          centre_name?: string
          centre_type?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          director_name?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          research_areas?: string[] | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_research_centres_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_research_labs: {
        Row: {
          centre_id: string | null
          collaboration_available: boolean | null
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          description: string | null
          equipment: string | null
          facilities: string | null
          id: string
          institute_id: string
          lab_name: string
          official_url: string | null
          research_area: string | null
          source_label: string | null
          source_url: string | null
          student_access: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          centre_id?: string | null
          collaboration_available?: boolean | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          equipment?: string | null
          facilities?: string | null
          id?: string
          institute_id: string
          lab_name: string
          official_url?: string | null
          research_area?: string | null
          source_label?: string | null
          source_url?: string | null
          student_access?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          centre_id?: string | null
          collaboration_available?: boolean | null
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          equipment?: string | null
          facilities?: string | null
          id?: string
          institute_id?: string
          lab_name?: string
          official_url?: string | null
          research_area?: string | null
          source_label?: string | null
          source_url?: string | null
          student_access?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_research_labs_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "jee_research_centres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_research_labs_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_research_outputs: {
        Row: {
          authors: string | null
          citation_count: number | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          faculty_id: string | null
          id: string
          identifier: string | null
          institute_id: string
          official_url: string | null
          output_type: string
          patent_status: string | null
          publication_date: string | null
          source_label: string | null
          source_url: string | null
          title: string
          updated_at: string
          venue_or_journal: string | null
          year: number | null
        }
        Insert: {
          authors?: string | null
          citation_count?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          faculty_id?: string | null
          id?: string
          identifier?: string | null
          institute_id: string
          official_url?: string | null
          output_type: string
          patent_status?: string | null
          publication_date?: string | null
          source_label?: string | null
          source_url?: string | null
          title: string
          updated_at?: string
          venue_or_journal?: string | null
          year?: number | null
        }
        Update: {
          authors?: string | null
          citation_count?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          faculty_id?: string | null
          id?: string
          identifier?: string | null
          institute_id?: string
          official_url?: string | null
          output_type?: string
          patent_status?: string | null
          publication_date?: string | null
          source_label?: string | null
          source_url?: string | null
          title?: string
          updated_at?: string
          venue_or_journal?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_research_outputs_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "jee_faculty_research"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_research_outputs_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_research_projects: {
        Row: {
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          department_name: string | null
          description: string | null
          end_date: string | null
          funding_agency: string | null
          funding_amount: number | null
          id: string
          industry_partner: string | null
          institute_id: string
          official_url: string | null
          principal_investigator: string | null
          project_title: string
          project_type: string | null
          research_area: string | null
          source_label: string | null
          source_url: string | null
          start_date: string | null
          status: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          end_date?: string | null
          funding_agency?: string | null
          funding_amount?: number | null
          id?: string
          industry_partner?: string | null
          institute_id: string
          official_url?: string | null
          principal_investigator?: string | null
          project_title: string
          project_type?: string | null
          research_area?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          end_date?: string | null
          funding_agency?: string | null
          funding_amount?: number | null
          id?: string
          industry_partner?: string | null
          institute_id?: string
          official_url?: string | null
          principal_investigator?: string | null
          project_title?: string
          project_type?: string | null
          research_area?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_research_projects_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_research_statistics_history: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          research_area: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          research_area?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          research_area?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_research_statistics_history_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_review_source_profiles: {
        Row: {
          collection_method: string | null
          coverage: string | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          limitations: string | null
          methodology: string | null
          rating_scale: number | null
          source_label: string | null
          source_name: string
          source_type: string
          source_url: string | null
        }
        Insert: {
          collection_method?: string | null
          coverage?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          limitations?: string | null
          methodology?: string | null
          rating_scale?: number | null
          source_label?: string | null
          source_name: string
          source_type: string
          source_url?: string | null
        }
        Update: {
          collection_method?: string | null
          coverage?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          limitations?: string | null
          methodology?: string | null
          rating_scale?: number | null
          source_label?: string | null
          source_name?: string
          source_type?: string
          source_url?: string | null
        }
        Relationships: []
      }
      jee_revision_tasks: {
        Row: {
          chapter_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          revision_count: number
          revision_type: string
          scheduled_for: string
          status: string
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          revision_count?: number
          revision_type: string
          scheduled_for: string
          status?: string
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          revision_count?: number
          revision_type?: string
          scheduled_for?: string
          status?: string
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_revision_tasks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_revision_tasks_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_scholarship_data: {
        Row: {
          applicable_programs: string | null
          application_deadline: string | null
          application_method: string | null
          benefit_amount: number | null
          benefit_currency: string
          benefit_frequency: string | null
          category: string | null
          created_at: string
          description: string | null
          eligibility: string | null
          id: string
          institute_id: string | null
          institute_name: string
          institute_type: string | null
          scholarship_name: string
          scholarship_type: string
          source_label: string | null
          source_url: string | null
          state: string | null
          tuition_waiver_percent: number | null
          updated_at: string
          year: number
        }
        Insert: {
          applicable_programs?: string | null
          application_deadline?: string | null
          application_method?: string | null
          benefit_amount?: number | null
          benefit_currency?: string
          benefit_frequency?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          eligibility?: string | null
          id?: string
          institute_id?: string | null
          institute_name: string
          institute_type?: string | null
          scholarship_name: string
          scholarship_type?: string
          source_label?: string | null
          source_url?: string | null
          state?: string | null
          tuition_waiver_percent?: number | null
          updated_at?: string
          year?: number
        }
        Update: {
          applicable_programs?: string | null
          application_deadline?: string | null
          application_method?: string | null
          benefit_amount?: number | null
          benefit_currency?: string
          benefit_frequency?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          eligibility?: string | null
          id?: string
          institute_id?: string | null
          institute_name?: string
          institute_type?: string | null
          scholarship_name?: string
          scholarship_type?: string
          source_label?: string | null
          source_url?: string | null
          state?: string | null
          tuition_waiver_percent?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_scholarship_data_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_seat_allocation_events: {
        Row: {
          applicable_candidate_group: string | null
          counselling: string
          created_at: string
          data_last_verified_at: string | null
          ends_at: string | null
          event_code: string
          event_description: string | null
          event_name: string
          id: string
          mandatory: boolean | null
          round_number: number | null
          source_label: string | null
          source_url: string | null
          starts_at: string | null
          year: number
        }
        Insert: {
          applicable_candidate_group?: string | null
          counselling: string
          created_at?: string
          data_last_verified_at?: string | null
          ends_at?: string | null
          event_code: string
          event_description?: string | null
          event_name: string
          id?: string
          mandatory?: boolean | null
          round_number?: number | null
          source_label?: string | null
          source_url?: string | null
          starts_at?: string | null
          year: number
        }
        Update: {
          applicable_candidate_group?: string | null
          counselling?: string
          created_at?: string
          data_last_verified_at?: string | null
          ends_at?: string | null
          event_code?: string
          event_description?: string | null
          event_name?: string
          id?: string
          mandatory?: boolean | null
          round_number?: number | null
          source_label?: string | null
          source_url?: string | null
          starts_at?: string | null
          year?: number
        }
        Relationships: []
      }
      jee_seat_allocation_rules: {
        Row: {
          action_type: string | null
          applicable_round: string | null
          consequences: string | null
          counselling: string
          created_at: string
          data_last_verified_at: string | null
          deadline_rule: string | null
          eligibility_condition: string | null
          fee_requirement: string | null
          id: string
          refund_rule: string | null
          rule_code: string
          rule_name: string
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          action_type?: string | null
          applicable_round?: string | null
          consequences?: string | null
          counselling: string
          created_at?: string
          data_last_verified_at?: string | null
          deadline_rule?: string | null
          eligibility_condition?: string | null
          fee_requirement?: string | null
          id?: string
          refund_rule?: string | null
          rule_code: string
          rule_name: string
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          action_type?: string | null
          applicable_round?: string | null
          consequences?: string | null
          counselling?: string
          created_at?: string
          data_last_verified_at?: string | null
          deadline_rule?: string | null
          eligibility_condition?: string | null
          fee_requirement?: string | null
          id?: string
          refund_rule?: string | null
          rule_code?: string
          rule_name?: string
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: []
      }
      jee_seat_matrix: {
        Row: {
          academic_program: string | null
          category: string | null
          city: string | null
          counselling: string
          created_at: string
          gender: string | null
          id: string
          institute_id: string | null
          institute_name: string
          institute_type: string | null
          program_code: string | null
          program_name: string
          quota: string | null
          seat_type: string | null
          seats: number | null
          source_label: string | null
          source_url: string | null
          state: string | null
          updated_at: string
          year: number
        }
        Insert: {
          academic_program?: string | null
          category?: string | null
          city?: string | null
          counselling?: string
          created_at?: string
          gender?: string | null
          id?: string
          institute_id?: string | null
          institute_name: string
          institute_type?: string | null
          program_code?: string | null
          program_name: string
          quota?: string | null
          seat_type?: string | null
          seats?: number | null
          source_label?: string | null
          source_url?: string | null
          state?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          academic_program?: string | null
          category?: string | null
          city?: string | null
          counselling?: string
          created_at?: string
          gender?: string | null
          id?: string
          institute_id?: string | null
          institute_name?: string
          institute_type?: string | null
          program_code?: string | null
          program_name?: string
          quota?: string | null
          seat_type?: string | null
          seats?: number | null
          source_label?: string | null
          source_url?: string | null
          state?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_seat_matrix_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_seat_pressure_metrics: {
        Row: {
          category: string | null
          closing_rank: number | null
          counselling: string
          created_at: string
          data_last_verified_at: string | null
          gender: string | null
          id: string
          institute_id: string
          methodology: string | null
          opening_rank: number | null
          pressure_ratio: number | null
          program_name: string | null
          quota: string | null
          round: number | null
          seats_accepted: number | null
          seats_available: number | null
          seats_offered: number | null
          seats_vacant: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          waitlist_count: number | null
          year: number
        }
        Insert: {
          category?: string | null
          closing_rank?: number | null
          counselling: string
          created_at?: string
          data_last_verified_at?: string | null
          gender?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          opening_rank?: number | null
          pressure_ratio?: number | null
          program_name?: string | null
          quota?: string | null
          round?: number | null
          seats_accepted?: number | null
          seats_available?: number | null
          seats_offered?: number | null
          seats_vacant?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          waitlist_count?: number | null
          year: number
        }
        Update: {
          category?: string | null
          closing_rank?: number | null
          counselling?: string
          created_at?: string
          data_last_verified_at?: string | null
          gender?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          opening_rank?: number | null
          pressure_ratio?: number | null
          program_name?: string | null
          quota?: string | null
          round?: number | null
          seats_accepted?: number | null
          seats_available?: number | null
          seats_offered?: number | null
          seats_vacant?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          waitlist_count?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_seat_pressure_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_seat_utilization_history: {
        Row: {
          accepted_seats: number | null
          category: string | null
          counselling: string | null
          created_at: string
          data_last_verified_at: string | null
          gender: string | null
          id: string
          institute_id: string
          joined_count: number | null
          offered_seats: number | null
          program_name: string | null
          quota: string | null
          sanctioned_seats: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          utilization_percentage: number | null
          vacant_seats: number | null
          year: number
        }
        Insert: {
          accepted_seats?: number | null
          category?: string | null
          counselling?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          gender?: string | null
          id?: string
          institute_id: string
          joined_count?: number | null
          offered_seats?: number | null
          program_name?: string | null
          quota?: string | null
          sanctioned_seats?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          utilization_percentage?: number | null
          vacant_seats?: number | null
          year: number
        }
        Update: {
          accepted_seats?: number | null
          category?: string | null
          counselling?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          gender?: string | null
          id?: string
          institute_id?: string
          joined_count?: number | null
          offered_seats?: number | null
          program_name?: string | null
          quota?: string | null
          sanctioned_seats?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          utilization_percentage?: number | null
          vacant_seats?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_seat_utilization_history_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_security_infrastructure: {
        Row: {
          access_control: string | null
          availability: string | null
          coverage: string | null
          created_at: string
          data_last_verified_at: string | null
          emergency_contact: string | null
          id: string
          institute_id: string
          location: string | null
          monitoring_details: string | null
          operating_hours: string | null
          security_feature: string
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          access_control?: string | null
          availability?: string | null
          coverage?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          emergency_contact?: string | null
          id?: string
          institute_id: string
          location?: string | null
          monitoring_details?: string | null
          operating_hours?: string | null
          security_feature: string
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          access_control?: string | null
          availability?: string | null
          coverage?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          emergency_contact?: string | null
          id?: string
          institute_id?: string
          location?: string | null
          monitoring_details?: string | null
          operating_hours?: string | null
          security_feature?: string
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_security_infrastructure_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_seminars_workshops: {
        Row: {
          activity_type: string
          applicable_programs: string[] | null
          certificate_available: boolean | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          department_name: string | null
          description: string | null
          eligibility: string | null
          end_at: string | null
          fee_amount: number | null
          id: string
          institute_id: string
          official_url: string | null
          organizer_name: string | null
          registration_required: boolean | null
          registration_url: string | null
          source_label: string | null
          source_url: string | null
          speaker_affiliation: string | null
          speaker_name: string | null
          start_at: string | null
          title: string
          venue: string | null
          year: number | null
        }
        Insert: {
          activity_type: string
          applicable_programs?: string[] | null
          certificate_available?: boolean | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          eligibility?: string | null
          end_at?: string | null
          fee_amount?: number | null
          id?: string
          institute_id: string
          official_url?: string | null
          organizer_name?: string | null
          registration_required?: boolean | null
          registration_url?: string | null
          source_label?: string | null
          source_url?: string | null
          speaker_affiliation?: string | null
          speaker_name?: string | null
          start_at?: string | null
          title: string
          venue?: string | null
          year?: number | null
        }
        Update: {
          activity_type?: string
          applicable_programs?: string[] | null
          certificate_available?: boolean | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          eligibility?: string | null
          end_at?: string | null
          fee_amount?: number | null
          id?: string
          institute_id?: string
          official_url?: string | null
          organizer_name?: string | null
          registration_required?: boolean | null
          registration_url?: string | null
          source_label?: string | null
          source_url?: string | null
          speaker_affiliation?: string | null
          speaker_name?: string | null
          start_at?: string | null
          title?: string
          venue?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_seminars_workshops_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_sports_activities: {
        Row: {
          activity_type: string | null
          coach_available: boolean | null
          competition_level: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          facility_available: boolean | null
          id: string
          institute_id: string
          membership_fee: number | null
          official_url: string | null
          participation_eligibility: string | null
          schedule_text: string | null
          source_label: string | null
          source_url: string | null
          sport_name: string
          team_available: boolean | null
          year: number | null
        }
        Insert: {
          activity_type?: string | null
          coach_available?: boolean | null
          competition_level?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          facility_available?: boolean | null
          id?: string
          institute_id: string
          membership_fee?: number | null
          official_url?: string | null
          participation_eligibility?: string | null
          schedule_text?: string | null
          source_label?: string | null
          source_url?: string | null
          sport_name: string
          team_available?: boolean | null
          year?: number | null
        }
        Update: {
          activity_type?: string | null
          coach_available?: boolean | null
          competition_level?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          facility_available?: boolean | null
          id?: string
          institute_id?: string
          membership_fee?: number | null
          official_url?: string | null
          participation_eligibility?: string | null
          schedule_text?: string | null
          source_label?: string | null
          source_url?: string | null
          sport_name?: string
          team_available?: boolean | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_sports_activities_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_startup_spinouts: {
        Row: {
          commercialization_status: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          founders: string[] | null
          founding_year: number | null
          funding_amount: number | null
          funding_stage: string | null
          id: string
          incubation_program: string | null
          institute_id: string
          institute_role: string | null
          originating_lab: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          startup_name: string
          technology_domain: string | null
          website_url: string | null
          year: number | null
        }
        Insert: {
          commercialization_status?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          founders?: string[] | null
          founding_year?: number | null
          funding_amount?: number | null
          funding_stage?: string | null
          id?: string
          incubation_program?: string | null
          institute_id: string
          institute_role?: string | null
          originating_lab?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          startup_name: string
          technology_domain?: string | null
          website_url?: string | null
          year?: number | null
        }
        Update: {
          commercialization_status?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          founders?: string[] | null
          founding_year?: number | null
          funding_amount?: number | null
          funding_stage?: string | null
          id?: string
          incubation_program?: string | null
          institute_id?: string
          institute_role?: string | null
          originating_lab?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          startup_name?: string
          technology_domain?: string | null
          website_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_startup_spinouts_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_banking_services: {
        Row: {
          account_opening_requirements: string | null
          bank_name: string
          branch_or_location: string | null
          campus_presence: boolean | null
          contact_phone: string | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          minimum_balance: number | null
          service_type: string
          source_label: string | null
          source_url: string | null
          student_account_available: boolean | null
          student_benefits: string | null
          website_url: string | null
          year: number | null
        }
        Insert: {
          account_opening_requirements?: string | null
          bank_name: string
          branch_or_location?: string | null
          campus_presence?: boolean | null
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          minimum_balance?: number | null
          service_type: string
          source_label?: string | null
          source_url?: string | null
          student_account_available?: boolean | null
          student_benefits?: string | null
          website_url?: string | null
          year?: number | null
        }
        Update: {
          account_opening_requirements?: string | null
          bank_name?: string
          branch_or_location?: string | null
          campus_presence?: boolean | null
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          minimum_balance?: number | null
          service_type?: string
          source_label?: string | null
          source_url?: string | null
          student_account_available?: boolean | null
          student_benefits?: string | null
          website_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_banking_services_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_clubs_activities: {
        Row: {
          activity_name: string | null
          club_name: string
          club_type: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          description: string | null
          id: string
          institute_id: string
          membership_eligibility: string | null
          official_url: string | null
          participation_fee: number | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          activity_name?: string | null
          club_name: string
          club_type?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          description?: string | null
          id?: string
          institute_id: string
          membership_eligibility?: string | null
          official_url?: string | null
          participation_fee?: number | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          activity_name?: string | null
          club_name?: string
          club_type?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          description?: string | null
          id?: string
          institute_id?: string
          membership_eligibility?: string | null
          official_url?: string | null
          participation_fee?: number | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_clubs_activities_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_commute_data: {
        Row: {
          accessibility_notes: string | null
          commute_mode: string
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          distance_km: number | null
          estimated_monthly_cost: number | null
          id: string
          institute_id: string
          safety_notes: string | null
          source_label: string | null
          source_url: string | null
          typical_destination: string | null
          typical_origin: string | null
          typical_time_minutes: number | null
          year: number | null
        }
        Insert: {
          accessibility_notes?: string | null
          commute_mode: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          distance_km?: number | null
          estimated_monthly_cost?: number | null
          id?: string
          institute_id: string
          safety_notes?: string | null
          source_label?: string | null
          source_url?: string | null
          typical_destination?: string | null
          typical_origin?: string | null
          typical_time_minutes?: number | null
          year?: number | null
        }
        Update: {
          accessibility_notes?: string | null
          commute_mode?: string
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          distance_km?: number | null
          estimated_monthly_cost?: number | null
          id?: string
          institute_id?: string
          safety_notes?: string | null
          source_label?: string | null
          source_url?: string | null
          typical_destination?: string | null
          typical_origin?: string | null
          typical_time_minutes?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_commute_data_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_competitions: {
        Row: {
          application_url: string | null
          competition_name: string
          competition_type: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          domain: string | null
          eligibility: string | null
          eligible_programs: string[] | null
          event_end: string | null
          event_start: string | null
          id: string
          institute_id: string
          official_url: string | null
          organizer: string | null
          participation_fee: number | null
          prize_details: string | null
          registration_deadline: string | null
          registration_start: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          application_url?: string | null
          competition_name: string
          competition_type?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          domain?: string | null
          eligibility?: string | null
          eligible_programs?: string[] | null
          event_end?: string | null
          event_start?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          organizer?: string | null
          participation_fee?: number | null
          prize_details?: string | null
          registration_deadline?: string | null
          registration_start?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          application_url?: string | null
          competition_name?: string
          competition_type?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          domain?: string | null
          eligibility?: string | null
          eligible_programs?: string[] | null
          event_end?: string | null
          event_start?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          organizer?: string | null
          participation_fee?: number | null
          prize_details?: string | null
          registration_deadline?: string | null
          registration_start?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_competitions_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_exchange_programs: {
        Row: {
          application_deadline: string | null
          application_start: string | null
          application_url: string | null
          country: string | null
          created_at: string
          data_last_verified_at: string | null
          duration_text: string | null
          eligibility: string | null
          eligible_programs: string[] | null
          exchange_type: string | null
          funding_support: string | null
          id: string
          institute_id: string
          official_url: string | null
          partner_institution: string | null
          program_name: string
          selection_process: string | null
          source_label: string | null
          source_url: string | null
          tuition_rule: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          application_deadline?: string | null
          application_start?: string | null
          application_url?: string | null
          country?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          duration_text?: string | null
          eligibility?: string | null
          eligible_programs?: string[] | null
          exchange_type?: string | null
          funding_support?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          partner_institution?: string | null
          program_name: string
          selection_process?: string | null
          source_label?: string | null
          source_url?: string | null
          tuition_rule?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          application_deadline?: string | null
          application_start?: string | null
          application_url?: string | null
          country?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          duration_text?: string | null
          eligibility?: string | null
          eligible_programs?: string[] | null
          exchange_type?: string | null
          funding_support?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          partner_institution?: string | null
          program_name?: string
          selection_process?: string | null
          source_label?: string | null
          source_url?: string | null
          tuition_rule?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_exchange_programs_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_experience_dimensions: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          dimension: string
          id: string
          institute_id: string
          methodology: string | null
          population: string | null
          sample_size: number | null
          scale: number | null
          score: number | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          dimension: string
          id?: string
          institute_id: string
          methodology?: string | null
          population?: string | null
          sample_size?: number | null
          scale?: number | null
          score?: number | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          dimension?: string
          id?: string
          institute_id?: string
          methodology?: string | null
          population?: string | null
          sample_size?: number | null
          scale?: number | null
          score?: number | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_experience_dimensions_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_experience_metrics: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_category: string
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          population: string | null
          program_name: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_category: string
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          program_name?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_category?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          program_name?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_experience_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_experience_themes: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          mention_count: number | null
          methodology: string | null
          prevalence_percentage: number | null
          sentiment: string | null
          source_label: string | null
          source_url: string | null
          summary: string | null
          theme: string
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          mention_count?: number | null
          methodology?: string | null
          prevalence_percentage?: number | null
          sentiment?: string | null
          source_label?: string | null
          source_url?: string | null
          summary?: string | null
          theme: string
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          mention_count?: number | null
          methodology?: string | null
          prevalence_percentage?: number | null
          sentiment?: string | null
          source_label?: string | null
          source_url?: string | null
          summary?: string | null
          theme?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_experience_themes_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_experience_trends: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          dimension: string
          id: string
          institute_id: string
          methodology: string | null
          sample_size: number | null
          scale: number | null
          score: number | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          dimension: string
          id?: string
          institute_id: string
          methodology?: string | null
          sample_size?: number | null
          scale?: number | null
          score?: number | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          dimension?: string
          id?: string
          institute_id?: string
          methodology?: string | null
          sample_size?: number | null
          scale?: number | null
          score?: number | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_experience_trends_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_feedback_metrics: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_category: string
          metric_name: string
          population: string | null
          response_count: number | null
          response_rate: number | null
          scale_max: number | null
          scale_min: number | null
          score: number | null
          source_label: string | null
          source_url: string | null
          survey_name: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_category: string
          metric_name: string
          population?: string | null
          response_count?: number | null
          response_rate?: number | null
          scale_max?: number | null
          scale_min?: number | null
          score?: number | null
          source_label?: string | null
          source_url?: string | null
          survey_name?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_category?: string
          metric_name?: string
          population?: string | null
          response_count?: number | null
          response_rate?: number | null
          scale_max?: number | null
          scale_min?: number | null
          score?: number | null
          source_label?: string | null
          source_url?: string | null
          survey_name?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_feedback_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_festivals: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          end_date: string | null
          events_count: number | null
          festival_name: string
          festival_type: string | null
          id: string
          institute_id: string
          official_url: string | null
          organizer: string | null
          participation_scope: string | null
          registration_url: string | null
          source_label: string | null
          source_url: string | null
          start_date: string | null
          theme: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          end_date?: string | null
          events_count?: number | null
          festival_name: string
          festival_type?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          organizer?: string | null
          participation_scope?: string | null
          registration_url?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          theme?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          end_date?: string | null
          events_count?: number | null
          festival_name?: string
          festival_type?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          organizer?: string | null
          participation_scope?: string | null
          registration_url?: string | null
          source_label?: string | null
          source_url?: string | null
          start_date?: string | null
          theme?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_festivals_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_financial_rules: {
        Row: {
          applicable_scope: string | null
          created_at: string
          data_last_verified_at: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          institute_id: string
          rule_name: string
          rule_text: string | null
          rule_type: string
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          applicable_scope?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          institute_id: string
          rule_name: string
          rule_text?: string | null
          rule_type: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          applicable_scope?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          institute_id?: string
          rule_name?: string
          rule_text?: string | null
          rule_type?: string
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_financial_rules_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_insurance: {
        Row: {
          claim_process: string | null
          coverage_amount: number | null
          coverage_summary: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          eligibility: string | null
          exclusions: string | null
          id: string
          institute_id: string
          insurance_type: string
          mandatory: boolean | null
          official_url: string | null
          policy_name: string | null
          premium_amount: number | null
          premium_frequency: string | null
          provider_name: string | null
          source_label: string | null
          source_url: string | null
          year: number | null
        }
        Insert: {
          claim_process?: string | null
          coverage_amount?: number | null
          coverage_summary?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          eligibility?: string | null
          exclusions?: string | null
          id?: string
          institute_id: string
          insurance_type: string
          mandatory?: boolean | null
          official_url?: string | null
          policy_name?: string | null
          premium_amount?: number | null
          premium_frequency?: string | null
          provider_name?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Update: {
          claim_process?: string | null
          coverage_amount?: number | null
          coverage_summary?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          eligibility?: string | null
          exclusions?: string | null
          id?: string
          institute_id?: string
          insurance_type?: string
          mandatory?: boolean | null
          official_url?: string | null
          policy_name?: string | null
          premium_amount?: number | null
          premium_frequency?: string | null
          provider_name?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_insurance_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_life_data: {
        Row: {
          access_rule: string | null
          availability: boolean | null
          capacity: number | null
          category: string
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          eligibility: string | null
          fee_amount: number | null
          fee_currency: string | null
          frequency: string | null
          id: string
          institute_id: string | null
          item_name: string
          quantity: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          year: number
        }
        Insert: {
          access_rule?: string | null
          availability?: boolean | null
          capacity?: number | null
          category: string
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          eligibility?: string | null
          fee_amount?: number | null
          fee_currency?: string | null
          frequency?: string | null
          id?: string
          institute_id?: string | null
          item_name: string
          quantity?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year: number
        }
        Update: {
          access_rule?: string | null
          availability?: boolean | null
          capacity?: number | null
          category?: string
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          eligibility?: string | null
          fee_amount?: number | null
          fee_currency?: string | null
          frequency?: string | null
          id?: string
          institute_id?: string | null
          item_name?: string
          quantity?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_life_data_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_mobility: {
        Row: {
          created_at: string
          credit_transfer_rule: string | null
          data_last_verified_at: string | null
          direction: string
          duration_text: string | null
          eligibility: string | null
          funding_support: string | null
          id: string
          institute_id: string
          mobility_type: string
          partner_city: string | null
          partner_country: string | null
          partner_institute: string | null
          program_name: string | null
          selection_process: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          status: string | null
          student_count: number | null
          tuition_rule: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          credit_transfer_rule?: string | null
          data_last_verified_at?: string | null
          direction: string
          duration_text?: string | null
          eligibility?: string | null
          funding_support?: string | null
          id?: string
          institute_id: string
          mobility_type: string
          partner_city?: string | null
          partner_country?: string | null
          partner_institute?: string | null
          program_name?: string | null
          selection_process?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          student_count?: number | null
          tuition_rule?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          credit_transfer_rule?: string | null
          data_last_verified_at?: string | null
          direction?: string
          duration_text?: string | null
          eligibility?: string | null
          funding_support?: string | null
          id?: string
          institute_id?: string
          mobility_type?: string
          partner_city?: string | null
          partner_country?: string | null
          partner_institute?: string | null
          program_name?: string | null
          selection_process?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          student_count?: number | null
          tuition_rule?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_mobility_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_organizations: {
        Row: {
          category: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          description: string | null
          id: string
          institute_id: string
          meeting_frequency: string | null
          membership_eligibility: string | null
          membership_fee: number | null
          official_url: string | null
          organization_name: string
          organization_type: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          description?: string | null
          id?: string
          institute_id: string
          meeting_frequency?: string | null
          membership_eligibility?: string | null
          membership_fee?: number | null
          official_url?: string | null
          organization_name: string
          organization_type?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          description?: string | null
          id?: string
          institute_id?: string
          meeting_frequency?: string | null
          membership_eligibility?: string | null
          membership_fee?: number | null
          official_url?: string | null
          organization_name?: string
          organization_type?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_organizations_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_population_history: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          doctoral_count: number | null
          female_count: number | null
          id: string
          institute_id: string
          international_count: number | null
          male_count: number | null
          other_gender_count: number | null
          postgraduate_count: number | null
          program_name: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          total_count: number | null
          undergraduate_count: number | null
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          doctoral_count?: number | null
          female_count?: number | null
          id?: string
          institute_id: string
          international_count?: number | null
          male_count?: number | null
          other_gender_count?: number | null
          postgraduate_count?: number | null
          program_name?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          total_count?: number | null
          undergraduate_count?: number | null
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          doctoral_count?: number | null
          female_count?: number | null
          id?: string
          institute_id?: string
          international_count?: number | null
          male_count?: number | null
          other_gender_count?: number | null
          postgraduate_count?: number | null
          program_name?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          total_count?: number | null
          undergraduate_count?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_population_history_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_research_opportunities: {
        Row: {
          application_deadline: string | null
          application_start: string | null
          application_url: string | null
          contact_email: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          departments: string[] | null
          description: string | null
          duration_text: string | null
          eligibility: string | null
          id: string
          institute_id: string
          opportunity_name: string
          opportunity_type: string | null
          paid: boolean | null
          source_label: string | null
          source_url: string | null
          stipend_amount: number | null
          updated_at: string
          year: number | null
        }
        Insert: {
          application_deadline?: string | null
          application_start?: string | null
          application_url?: string | null
          contact_email?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          departments?: string[] | null
          description?: string | null
          duration_text?: string | null
          eligibility?: string | null
          id?: string
          institute_id: string
          opportunity_name: string
          opportunity_type?: string | null
          paid?: boolean | null
          source_label?: string | null
          source_url?: string | null
          stipend_amount?: number | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          application_deadline?: string | null
          application_start?: string | null
          application_url?: string | null
          contact_email?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          departments?: string[] | null
          description?: string | null
          duration_text?: string | null
          eligibility?: string | null
          id?: string
          institute_id?: string
          opportunity_name?: string
          opportunity_type?: string | null
          paid?: boolean | null
          source_label?: string | null
          source_url?: string | null
          stipend_amount?: number | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_research_opportunities_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_retention_factors: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          evidence_description: string | null
          factor_category: string
          factor_name: string
          id: string
          institute_id: string
          metric_unit: string | null
          metric_value: number | null
          observed_impact: string | null
          population: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          evidence_description?: string | null
          factor_category: string
          factor_name: string
          id?: string
          institute_id: string
          metric_unit?: string | null
          metric_value?: number | null
          observed_impact?: string | null
          population?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          evidence_description?: string | null
          factor_category?: string
          factor_name?: string
          id?: string
          institute_id?: string
          metric_unit?: string | null
          metric_value?: number | null
          observed_impact?: string | null
          population?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_retention_factors_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_review_signals: {
        Row: {
          average_rating: number | null
          category: string | null
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_name: string | null
          metric_value: number | null
          rating_scale: number | null
          review_count: number | null
          sentiment_label: string | null
          source_label: string | null
          source_name: string | null
          source_type: string
          source_url: string | null
          year: number
        }
        Insert: {
          average_rating?: number | null
          category?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_name?: string | null
          metric_value?: number | null
          rating_scale?: number | null
          review_count?: number | null
          sentiment_label?: string | null
          source_label?: string | null
          source_name?: string | null
          source_type: string
          source_url?: string | null
          year: number
        }
        Update: {
          average_rating?: number | null
          category?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_name?: string | null
          metric_value?: number | null
          rating_scale?: number | null
          review_count?: number | null
          sentiment_label?: string | null
          source_label?: string | null
          source_name?: string | null
          source_type?: string
          source_url?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_review_signals_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_support_services: {
        Row: {
          appointment_required: boolean | null
          availability: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          description: string | null
          eligibility: string | null
          fee_amount: number | null
          hours_text: string | null
          id: string
          institute_id: string
          official_url: string | null
          service_name: string
          service_type: string
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          appointment_required?: boolean | null
          availability?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          description?: string | null
          eligibility?: string | null
          fee_amount?: number | null
          hours_text?: string | null
          id?: string
          institute_id: string
          official_url?: string | null
          service_name: string
          service_type: string
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          appointment_required?: boolean | null
          availability?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          description?: string | null
          eligibility?: string | null
          fee_amount?: number | null
          hours_text?: string | null
          id?: string
          institute_id?: string
          official_url?: string | null
          service_name?: string
          service_type?: string
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_support_services_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_transfers: {
        Row: {
          admission_basis: string | null
          approval_authority: string | null
          created_at: string
          credit_transfer_rule: string | null
          data_last_verified_at: string | null
          destination_institute: string | null
          eligibility: string | null
          id: string
          institute_id: string
          program_name: string | null
          source_document: string | null
          source_institute: string | null
          source_label: string | null
          source_url: string | null
          status: string | null
          student_count: number | null
          transfer_type: string
          year: number
        }
        Insert: {
          admission_basis?: string | null
          approval_authority?: string | null
          created_at?: string
          credit_transfer_rule?: string | null
          data_last_verified_at?: string | null
          destination_institute?: string | null
          eligibility?: string | null
          id?: string
          institute_id: string
          program_name?: string | null
          source_document?: string | null
          source_institute?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          student_count?: number | null
          transfer_type: string
          year: number
        }
        Update: {
          admission_basis?: string | null
          approval_authority?: string | null
          created_at?: string
          credit_transfer_rule?: string | null
          data_last_verified_at?: string | null
          destination_institute?: string | null
          eligibility?: string | null
          id?: string
          institute_id?: string
          program_name?: string | null
          source_document?: string | null
          source_institute?: string | null
          source_label?: string | null
          source_url?: string | null
          status?: string | null
          student_count?: number | null
          transfer_type?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_transfers_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_student_wellbeing: {
        Row: {
          category: string
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          population: string | null
          source_label: string | null
          source_url: string | null
          support_available: string | null
          updated_at: string
          year: number
        }
        Insert: {
          category: string
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          source_label?: string | null
          source_url?: string | null
          support_available?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          category?: string
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          source_label?: string | null
          source_url?: string | null
          support_available?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_student_wellbeing_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_study_goals: {
        Row: {
          created_at: string
          current_value: number
          deadline: string | null
          goal_type: string
          id: string
          notes: string | null
          status: string
          target_value: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          deadline?: string | null
          goal_type?: string
          id?: string
          notes?: string | null
          status?: string
          target_value?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number
          deadline?: string | null
          goal_type?: string
          id?: string
          notes?: string | null
          status?: string
          target_value?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jee_study_plans: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          plan_date: string
          target_hours: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          plan_date: string
          target_hours?: number
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          plan_date?: string
          target_hours?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jee_study_tasks: {
        Row: {
          chapter_id: string | null
          completed_minutes: number
          created_at: string
          id: string
          notes: string | null
          plan_id: string
          planned_minutes: number
          priority: string
          status: string
          subject: string
          task_order: number
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          completed_minutes?: number
          created_at?: string
          id?: string
          notes?: string | null
          plan_id: string
          planned_minutes?: number
          priority?: string
          status?: string
          subject: string
          task_order?: number
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          completed_minutes?: number
          created_at?: string
          id?: string
          notes?: string | null
          plan_id?: string
          planned_minutes?: number
          priority?: string
          status?: string
          subject?: string
          task_order?: number
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_study_tasks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_study_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "jee_study_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_study_tasks_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_surrounding_services: {
        Row: {
          address: string | null
          contact_phone: string | null
          created_at: string
          data_last_verified_at: string | null
          distance_km: number | null
          id: string
          institute_id: string
          official_url: string | null
          operating_hours: string | null
          provider_name: string | null
          service_category: string
          service_name: string
          source_label: string | null
          source_url: string | null
          travel_time_minutes: number | null
          year: number | null
        }
        Insert: {
          address?: string | null
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          distance_km?: number | null
          id?: string
          institute_id: string
          official_url?: string | null
          operating_hours?: string | null
          provider_name?: string | null
          service_category: string
          service_name: string
          source_label?: string | null
          source_url?: string | null
          travel_time_minutes?: number | null
          year?: number | null
        }
        Update: {
          address?: string | null
          contact_phone?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          distance_km?: number | null
          id?: string
          institute_id?: string
          official_url?: string | null
          operating_hours?: string | null
          provider_name?: string | null
          service_category?: string
          service_name?: string
          source_label?: string | null
          source_url?: string | null
          travel_time_minutes?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_surrounding_services_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_sustainability_metrics: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_category: string
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          scope: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_category: string
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          scope?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_category?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          scope?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_sustainability_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_syllabus_chapters: {
        Row: {
          chapter_code: string | null
          chapter_name: string
          chapter_order: number
          created_at: string
          description: string | null
          exam: string
          id: string
          is_active: boolean
          subject: string
          updated_at: string
        }
        Insert: {
          chapter_code?: string | null
          chapter_name: string
          chapter_order?: number
          created_at?: string
          description?: string | null
          exam: string
          id?: string
          is_active?: boolean
          subject: string
          updated_at?: string
        }
        Update: {
          chapter_code?: string | null
          chapter_name?: string
          chapter_order?: number
          created_at?: string
          description?: string | null
          exam?: string
          id?: string
          is_active?: boolean
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      jee_syllabus_progress: {
        Row: {
          chapter_id: string
          last_studied_at: string | null
          notes: string | null
          progress_percent: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          last_studied_at?: string | null
          notes?: string | null
          progress_percent?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          last_studied_at?: string | null
          notes?: string | null
          progress_percent?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_syllabus_progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_syllabus_topics: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          is_active: boolean
          topic_name: string
          topic_order: number
          updated_at: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          topic_name: string
          topic_order?: number
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          topic_name?: string
          topic_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jee_syllabus_topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "jee_syllabus_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_teaching_load_metrics: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          department_name: string | null
          id: string
          institute_id: string
          methodology: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          population: string | null
          program_name: string | null
          semester: number | null
          source_label: string | null
          source_url: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          id?: string
          institute_id: string
          methodology?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          program_name?: string | null
          semester?: number | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          department_name?: string | null
          id?: string
          institute_id?: string
          methodology?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          population?: string | null
          program_name?: string | null
          semester?: number | null
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_teaching_load_metrics_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_technology_licensing: {
        Row: {
          agreement_date: string | null
          commercial_status: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          field_of_use: string | null
          id: string
          institute_id: string
          ip_id: string | null
          license_type: string | null
          licensee_name: string | null
          licensing_revenue: number | null
          royalty_rate: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          technology_name: string
          territory: string | null
          year: number | null
        }
        Insert: {
          agreement_date?: string | null
          commercial_status?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          field_of_use?: string | null
          id?: string
          institute_id: string
          ip_id?: string | null
          license_type?: string | null
          licensee_name?: string | null
          licensing_revenue?: number | null
          royalty_rate?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          technology_name: string
          territory?: string | null
          year?: number | null
        }
        Update: {
          agreement_date?: string | null
          commercial_status?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          field_of_use?: string | null
          id?: string
          institute_id?: string
          ip_id?: string | null
          license_type?: string | null
          licensee_name?: string | null
          licensing_revenue?: number | null
          royalty_rate?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          technology_name?: string
          territory?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_technology_licensing_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jee_technology_licensing_ip_id_fkey"
            columns: ["ip_id"]
            isOneToOne: false
            referencedRelation: "jee_intellectual_property"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_technology_transfer: {
        Row: {
          commercialization_status: string | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          id: string
          institute_id: string
          inventors: string[] | null
          license_date: string | null
          licensee_name: string | null
          licensing_fee: number | null
          licensing_status: string | null
          official_url: string | null
          originating_department: string | null
          royalty_terms: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          technology_domain: string | null
          technology_name: string
          technology_status: string | null
          year: number | null
        }
        Insert: {
          commercialization_status?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          id?: string
          institute_id: string
          inventors?: string[] | null
          license_date?: string | null
          licensee_name?: string | null
          licensing_fee?: number | null
          licensing_status?: string | null
          official_url?: string | null
          originating_department?: string | null
          royalty_terms?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          technology_domain?: string | null
          technology_name: string
          technology_status?: string | null
          year?: number | null
        }
        Update: {
          commercialization_status?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          id?: string
          institute_id?: string
          inventors?: string[] | null
          license_date?: string | null
          licensee_name?: string | null
          licensing_fee?: number | null
          licensing_status?: string | null
          official_url?: string | null
          originating_department?: string | null
          royalty_terms?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          technology_domain?: string | null
          technology_name?: string
          technology_status?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_technology_transfer_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_technology_transfer_records: {
        Row: {
          agreement_date: string | null
          commercialization_date: string | null
          commercialization_value: number | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          department_name: string | null
          description: string | null
          developer_names: string[] | null
          id: string
          institute_id: string
          licensee_name: string | null
          licensing_status: string | null
          licensing_value: number | null
          research_area: string | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          technology_name: string
          technology_type: string | null
          transfer_status: string | null
          year: number
        }
        Insert: {
          agreement_date?: string | null
          commercialization_date?: string | null
          commercialization_value?: number | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          developer_names?: string[] | null
          id?: string
          institute_id: string
          licensee_name?: string | null
          licensing_status?: string | null
          licensing_value?: number | null
          research_area?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          technology_name: string
          technology_type?: string | null
          transfer_status?: string | null
          year: number
        }
        Update: {
          agreement_date?: string | null
          commercialization_date?: string | null
          commercialization_value?: number | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          department_name?: string | null
          description?: string | null
          developer_names?: string[] | null
          id?: string
          institute_id?: string
          licensee_name?: string | null
          licensing_status?: string | null
          licensing_value?: number | null
          research_area?: string | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          technology_name?: string
          technology_type?: string | null
          transfer_status?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_technology_transfer_records_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_transparency_documents: {
        Row: {
          created_at: string
          data_last_verified_at: string | null
          document_number: string | null
          document_title: string
          document_type: string
          document_url: string | null
          id: string
          institute_id: string
          publication_date: string | null
          source_label: string | null
          source_url: string | null
          summary: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          data_last_verified_at?: string | null
          document_number?: string | null
          document_title: string
          document_type: string
          document_url?: string | null
          id?: string
          institute_id: string
          publication_date?: string | null
          source_label?: string | null
          source_url?: string | null
          summary?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          data_last_verified_at?: string | null
          document_number?: string | null
          document_title?: string
          document_type?: string
          document_url?: string | null
          id?: string
          institute_id?: string
          publication_date?: string | null
          source_label?: string | null
          source_url?: string | null
          summary?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_transparency_documents_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_transport_access: {
        Row: {
          availability: string | null
          created_at: string
          data_last_verified_at: string | null
          distance_km: number | null
          id: string
          institute_id: string | null
          location_name: string | null
          route_details: string | null
          source_label: string | null
          source_url: string | null
          transport_type: string
          travel_time_minutes: number | null
          year: number
        }
        Insert: {
          availability?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          distance_km?: number | null
          id?: string
          institute_id?: string | null
          location_name?: string | null
          route_details?: string | null
          source_label?: string | null
          source_url?: string | null
          transport_type: string
          travel_time_minutes?: number | null
          year: number
        }
        Update: {
          availability?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          distance_km?: number | null
          id?: string
          institute_id?: string | null
          location_name?: string | null
          route_details?: string | null
          source_label?: string | null
          source_url?: string | null
          transport_type?: string
          travel_time_minutes?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_transport_access_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_transport_options: {
        Row: {
          accessibility: string | null
          booking_method: string | null
          created_at: string
          currency: string | null
          data_last_verified_at: string | null
          destination: string | null
          distance_km: number | null
          fare_amount: number | null
          frequency_text: string | null
          id: string
          institute_id: string
          operating_hours: string | null
          origin: string | null
          provider_name: string | null
          route_name: string | null
          source_label: string | null
          source_url: string | null
          stop_name: string | null
          student_discount: string | null
          transport_type: string
          travel_time_minutes: number | null
          year: number | null
        }
        Insert: {
          accessibility?: string | null
          booking_method?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          destination?: string | null
          distance_km?: number | null
          fare_amount?: number | null
          frequency_text?: string | null
          id?: string
          institute_id: string
          operating_hours?: string | null
          origin?: string | null
          provider_name?: string | null
          route_name?: string | null
          source_label?: string | null
          source_url?: string | null
          stop_name?: string | null
          student_discount?: string | null
          transport_type: string
          travel_time_minutes?: number | null
          year?: number | null
        }
        Update: {
          accessibility?: string | null
          booking_method?: string | null
          created_at?: string
          currency?: string | null
          data_last_verified_at?: string | null
          destination?: string | null
          distance_km?: number | null
          fare_amount?: number | null
          frequency_text?: string | null
          id?: string
          institute_id?: string
          operating_hours?: string | null
          origin?: string | null
          provider_name?: string | null
          route_name?: string | null
          source_label?: string | null
          source_url?: string | null
          stop_name?: string | null
          student_discount?: string | null
          transport_type?: string
          travel_time_minutes?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jee_transport_options_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_waste_management: {
        Row: {
          authorized_vendor: string | null
          collection_method: string | null
          compliance_status: string | null
          created_at: string
          data_last_verified_at: string | null
          disposal_method: string | null
          hazardous: boolean | null
          id: string
          institute_id: string
          quantity_unit: string | null
          quantity_value: number | null
          recycling_percentage: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          treatment_method: string | null
          waste_type: string
          year: number
        }
        Insert: {
          authorized_vendor?: string | null
          collection_method?: string | null
          compliance_status?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          disposal_method?: string | null
          hazardous?: boolean | null
          id?: string
          institute_id: string
          quantity_unit?: string | null
          quantity_value?: number | null
          recycling_percentage?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          treatment_method?: string | null
          waste_type: string
          year: number
        }
        Update: {
          authorized_vendor?: string | null
          collection_method?: string | null
          compliance_status?: string | null
          created_at?: string
          data_last_verified_at?: string | null
          disposal_method?: string | null
          hazardous?: boolean | null
          id?: string
          institute_id?: string
          quantity_unit?: string | null
          quantity_value?: number | null
          recycling_percentage?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          treatment_method?: string | null
          waste_type?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_waste_management_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      jee_water_management: {
        Row: {
          capacity_unit: string | null
          capacity_value: number | null
          consumption_unit: string | null
          consumption_value: number | null
          created_at: string
          data_last_verified_at: string | null
          description: string | null
          facility_name: string | null
          id: string
          institute_id: string
          rainwater_harvesting: boolean | null
          reuse_percentage: number | null
          source_document: string | null
          source_label: string | null
          source_url: string | null
          system_type: string
          treatment_capacity: number | null
          treatment_unit: string | null
          year: number
        }
        Insert: {
          capacity_unit?: string | null
          capacity_value?: number | null
          consumption_unit?: string | null
          consumption_value?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          facility_name?: string | null
          id?: string
          institute_id: string
          rainwater_harvesting?: boolean | null
          reuse_percentage?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          system_type: string
          treatment_capacity?: number | null
          treatment_unit?: string | null
          year: number
        }
        Update: {
          capacity_unit?: string | null
          capacity_value?: number | null
          consumption_unit?: string | null
          consumption_value?: number | null
          created_at?: string
          data_last_verified_at?: string | null
          description?: string | null
          facility_name?: string | null
          id?: string
          institute_id?: string
          rainwater_harvesting?: boolean | null
          reuse_percentage?: number | null
          source_document?: string | null
          source_label?: string | null
          source_url?: string | null
          system_type?: string
          treatment_capacity?: number | null
          treatment_unit?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "jee_water_management_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "jee_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_weekly_totals: {
        Row: {
          session_count: number
          total_seconds: number
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          session_count?: number
          total_seconds?: number
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          session_count?: number
          total_seconds?: number
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      live_session_participants: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          left_at: string | null
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          host_id: string
          id: string
          max_participants: number | null
          recording_url: string | null
          room_id: string | null
          room_url: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["live_session_status"]
          subject: Database["public"]["Enums"]["subject"] | null
          title: string
          type: Database["public"]["Enums"]["live_session_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          host_id: string
          id?: string
          max_participants?: number | null
          recording_url?: string | null
          room_id?: string | null
          room_url?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["live_session_status"]
          subject?: Database["public"]["Enums"]["subject"] | null
          title: string
          type: Database["public"]["Enums"]["live_session_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          host_id?: string
          id?: string
          max_participants?: number | null
          recording_url?: string | null
          room_id?: string | null
          room_url?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["live_session_status"]
          subject?: Database["public"]["Enums"]["subject"] | null
          title?: string
          type?: Database["public"]["Enums"]["live_session_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      material_gate: {
        Row: {
          id: boolean
          password_hash: string
          updated_at: string
        }
        Insert: {
          id?: boolean
          password_hash: string
          updated_at?: string
        }
        Update: {
          id?: boolean
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_trusted_users: {
        Row: {
          created_at: string
          granted_by: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string
          user_id?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          class_level: Database["public"]["Enums"]["class_level"]
          created_at: string
          description: string | null
          drive_url: string
          id: string
          resource_type: Database["public"]["Enums"]["resource_type"]
          subject: Database["public"]["Enums"]["subject"]
          title: string
          topic: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          class_level?: Database["public"]["Enums"]["class_level"]
          created_at?: string
          description?: string | null
          drive_url: string
          id?: string
          resource_type?: Database["public"]["Enums"]["resource_type"]
          subject: Database["public"]["Enums"]["subject"]
          title: string
          topic?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          class_level?: Database["public"]["Enums"]["class_level"]
          created_at?: string
          description?: string | null
          drive_url?: string
          id?: string
          resource_type?: Database["public"]["Enums"]["resource_type"]
          subject?: Database["public"]["Enums"]["subject"]
          title?: string
          topic?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      meeting_participants: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          left_at: string | null
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "meeting_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_recordings: {
        Row: {
          created_at: string
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          room_id: string
          storage_url: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          room_id: string
          storage_url: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          room_id?: string
          storage_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_recordings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "meeting_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_rooms: {
        Row: {
          created_at: string
          ended_at: string | null
          host_id: string
          id: string
          livekit_room_name: string
          room_type: string
          scheduled_at: string | null
          started_at: string | null
          status: string
          title: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          host_id: string
          id?: string
          livekit_room_name: string
          room_type: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          title?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          host_id?: string
          id?: string
          livekit_room_name?: string
          room_type?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          title?: string | null
        }
        Relationships: []
      }
      moderation_appeals: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          message: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          message: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          message?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      moderator_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          permissions: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          permissions?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          permissions?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes_chapters: {
        Row: {
          chapter_number: number
          class_level: number
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          chapter_number: number
          class_level: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          chapter_number?: number
          class_level?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      notes_progress: {
        Row: {
          chapter_id: string
          completed: boolean
          favourite: boolean
          last_opened_at: string
          updated_at: string
          user_id: string
          viewed_types: string[]
        }
        Insert: {
          chapter_id: string
          completed?: boolean
          favourite?: boolean
          last_opened_at?: string
          updated_at?: string
          user_id: string
          viewed_types?: string[]
        }
        Update: {
          chapter_id?: string
          completed?: boolean
          favourite?: boolean
          last_opened_at?: string
          updated_at?: string
          user_id?: string
          viewed_types?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "notes_progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "notes_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_resources: {
        Row: {
          chapter_id: string
          content_md: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          downloadable: boolean
          file_kind: string
          file_url: string | null
          id: string
          published: boolean
          resource_type: string
          source: string
          storage_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          chapter_id: string
          content_md?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          downloadable?: boolean
          file_kind?: string
          file_url?: string | null
          id?: string
          published?: boolean
          resource_type: string
          source?: string
          storage_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          content_md?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          downloadable?: boolean
          file_kind?: string
          file_url?: string | null
          id?: string
          published?: boolean
          resource_type?: string
          source?: string
          storage_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_resources_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "notes_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          body: string
          category: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          link_label: string | null
          link_url: string | null
          pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          link_label?: string | null
          link_url?: string | null
          pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          link_label?: string | null
          link_url?: string | null
          pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience: string
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          link: string | null
          priority: string
          target_user_id: string | null
          title: string
        }
        Insert: {
          audience?: string
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          priority?: string
          target_user_id?: string | null
          title: string
        }
        Update: {
          audience?: string
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          priority?: string
          target_user_id?: string | null
          title?: string
        }
        Relationships: []
      }
      nta_alerts: {
        Row: {
          alert_type: string
          created_at: string
          document_id: string | null
          id: string
          is_published: boolean
          official_url: string
          priority: string
          published_at: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          alert_type?: string
          created_at?: string
          document_id?: string | null
          id?: string
          is_published?: boolean
          official_url: string
          priority?: string
          published_at?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          document_id?: string | null
          id?: string
          is_published?: boolean
          official_url?: string
          priority?: string
          published_at?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nta_alerts_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "nta_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      nta_documents: {
        Row: {
          category: string
          created_at: string
          discovered_at: string
          document_type: string | null
          exam_year: number | null
          external_url: string
          id: string
          is_active: boolean
          last_seen_at: string
          metadata: Json
          normalized_title: string | null
          official: boolean
          paper: string | null
          published_at: string | null
          session: string | null
          source_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          discovered_at?: string
          document_type?: string | null
          exam_year?: number | null
          external_url: string
          id?: string
          is_active?: boolean
          last_seen_at?: string
          metadata?: Json
          normalized_title?: string | null
          official?: boolean
          paper?: string | null
          published_at?: string | null
          session?: string | null
          source_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          discovered_at?: string
          document_type?: string | null
          exam_year?: number | null
          external_url?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string
          metadata?: Json
          normalized_title?: string | null
          official?: boolean
          paper?: string | null
          published_at?: string | null
          session?: string | null
          source_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nta_documents_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "nta_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      nta_fetch_requests: {
        Row: {
          error_message: string | null
          id: string
          processed_at: string | null
          request_id: number | null
          requested_at: string
          source_id: string
          status: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          processed_at?: string | null
          request_id?: number | null
          requested_at?: string
          source_id: string
          status?: string
        }
        Update: {
          error_message?: string | null
          id?: string
          processed_at?: string | null
          request_id?: number | null
          requested_at?: string
          source_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "nta_fetch_requests_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "nta_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      nta_question_papers: {
        Row: {
          answer_key_url: string | null
          created_at: string
          document_id: string | null
          exam_date: string | null
          id: string
          metadata: Json
          official_url: string
          paper_type: string
          session: string | null
          shift: string | null
          subject: string | null
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          answer_key_url?: string | null
          created_at?: string
          document_id?: string | null
          exam_date?: string | null
          id?: string
          metadata?: Json
          official_url: string
          paper_type?: string
          session?: string | null
          shift?: string | null
          subject?: string | null
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          answer_key_url?: string | null
          created_at?: string
          document_id?: string | null
          exam_date?: string | null
          id?: string
          metadata?: Json
          official_url?: string
          paper_type?: string
          session?: string | null
          shift?: string | null
          subject?: string | null
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "nta_question_papers_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "nta_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      nta_sources: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          last_checked_at: string | null
          last_error: string | null
          last_success_at: string | null
          name: string
          source_key: string
          source_type: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          last_checked_at?: string | null
          last_error?: string | null
          last_success_at?: string | null
          name: string
          source_key: string
          source_type?: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          last_checked_at?: string | null
          last_error?: string | null
          last_success_at?: string | null
          name?: string
          source_key?: string
          source_type?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      nta_sync_runs: {
        Row: {
          created_at: string
          discovered_count: number
          error_count: number
          error_message: string | null
          finished_at: string | null
          id: string
          inserted_count: number
          source_count: number
          started_at: string
          status: string
          updated_count: number
        }
        Insert: {
          created_at?: string
          discovered_count?: number
          error_count?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          inserted_count?: number
          source_count?: number
          started_at?: string
          status?: string
          updated_count?: number
        }
        Update: {
          created_at?: string
          discovered_count?: number
          error_count?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          inserted_count?: number
          source_count?: number
          started_at?: string
          status?: string
          updated_count?: number
        }
        Relationships: []
      }
      official_bot_posts: {
        Row: {
          approved_by: string | null
          body: string
          content_type: string
          content_version: number
          created_at: string
          follow_up_comment: string | null
          id: string
          options: Json | null
          published_at: string | null
          published_ref_id: string | null
          scheduled_for: string | null
          status: string
          template_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          body: string
          content_type: string
          content_version?: number
          created_at?: string
          follow_up_comment?: string | null
          id?: string
          options?: Json | null
          published_at?: string | null
          published_ref_id?: string | null
          scheduled_for?: string | null
          status?: string
          template_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          body?: string
          content_type?: string
          content_version?: number
          created_at?: string
          follow_up_comment?: string | null
          id?: string
          options?: Json | null
          published_at?: string | null
          published_ref_id?: string | null
          scheduled_for?: string | null
          status?: string
          template_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_bot_posts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_bot_posts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          closes_at: string | null
          created_at: string
          created_by: string
          id: string
          location: string
          multi: boolean
          options: Json
          question: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          location: string
          multi?: boolean
          options: Json
          question: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          location?: string
          multi?: boolean
          options?: Json
          question?: string
        }
        Relationships: []
      }
      pro_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_by: string | null
          id: string
          note: string | null
          plan: Database["public"]["Enums"]["pro_plan"]
          started_at: string
          status: Database["public"]["Enums"]["pro_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          note?: string | null
          plan: Database["public"]["Enums"]["pro_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["pro_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          note?: string | null
          plan?: Database["public"]["Enums"]["pro_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["pro_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_post_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "profile_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "profile_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_posts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          bio: string | null
          class_level: Database["public"]["Enums"]["class_level"] | null
          created_at: string
          dm_disabled: boolean
          full_name: string | null
          guest_left_at: string | null
          has_seen_onboarding: boolean
          header_theme: string
          id: string
          instagram: string | null
          is_bot: boolean
          is_guest: boolean
          last_seen_at: string | null
          last_streak_popup_shown: string | null
          migrated: boolean
          migrated_at: string | null
          telegram: string | null
          updated_at: string
          username: string | null
          verified: boolean
          verified_at: string | null
          verified_source: string | null
          website: string | null
          youtube: string | null
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          bio?: string | null
          class_level?: Database["public"]["Enums"]["class_level"] | null
          created_at?: string
          dm_disabled?: boolean
          full_name?: string | null
          guest_left_at?: string | null
          has_seen_onboarding?: boolean
          header_theme?: string
          id: string
          instagram?: string | null
          is_bot?: boolean
          is_guest?: boolean
          last_seen_at?: string | null
          last_streak_popup_shown?: string | null
          migrated?: boolean
          migrated_at?: string | null
          telegram?: string | null
          updated_at?: string
          username?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_source?: string | null
          website?: string | null
          youtube?: string | null
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          bio?: string | null
          class_level?: Database["public"]["Enums"]["class_level"] | null
          created_at?: string
          dm_disabled?: boolean
          full_name?: string | null
          guest_left_at?: string | null
          has_seen_onboarding?: boolean
          header_theme?: string
          id?: string
          instagram?: string | null
          is_bot?: boolean
          is_guest?: boolean
          last_seen_at?: string | null
          last_streak_popup_shown?: string | null
          migrated?: boolean
          migrated_at?: string | null
          telegram?: string | null
          updated_at?: string
          username?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_source?: string | null
          website?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      protected_identities: {
        Row: {
          created_at: string | null
          id: string
          owner_id: string | null
          protected_full_name: string
          protected_username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          owner_id?: string | null
          protected_full_name: string
          protected_username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          owner_id?: string | null
          protected_full_name?: string
          protected_username?: string
        }
        Relationships: []
      }
      quiz_achievement_awards: {
        Row: {
          awarded_at: string
          code: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          code: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_achievement_awards_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "quiz_achievements"
            referencedColumns: ["code"]
          },
        ]
      }
      quiz_achievements: {
        Row: {
          active: boolean
          code: string
          description: string
          icon: string
          metric: string
          name: string
          sort_order: number
          threshold: number
          xp_reward: number
        }
        Insert: {
          active?: boolean
          code: string
          description: string
          icon?: string
          metric: string
          name: string
          sort_order?: number
          threshold: number
          xp_reward?: number
        }
        Update: {
          active?: boolean
          code?: string
          description?: string
          icon?: string
          metric?: string
          name?: string
          sort_order?: number
          threshold?: number
          xp_reward?: number
        }
        Relationships: []
      }
      quiz_battle_invitations: {
        Row: {
          battle_id: string | null
          chapter: string | null
          created_at: string
          expires_at: string
          format: string
          from_user: string
          id: string
          mode: string
          status: string
          subject: string
          to_user: string
        }
        Insert: {
          battle_id?: string | null
          chapter?: string | null
          created_at?: string
          expires_at?: string
          format?: string
          from_user: string
          id?: string
          mode?: string
          status?: string
          subject?: string
          to_user: string
        }
        Update: {
          battle_id?: string | null
          chapter?: string | null
          created_at?: string
          expires_at?: string
          format?: string
          from_user?: string
          id?: string
          mode?: string
          status?: string
          subject?: string
          to_user?: string
        }
        Relationships: []
      }
      quiz_battle_players: {
        Row: {
          answered_count: number
          battle_id: string
          correct_count: number
          cur_streak: number
          forfeited: boolean
          joined_at: string
          last_seen_at: string
          rating_after: number | null
          rating_before: number | null
          rating_delta: number | null
          ready: boolean
          result: string | null
          score: number
          total_time_ms: number
          user_id: string
          xp_awarded: number
        }
        Insert: {
          answered_count?: number
          battle_id: string
          correct_count?: number
          cur_streak?: number
          forfeited?: boolean
          joined_at?: string
          last_seen_at?: string
          rating_after?: number | null
          rating_before?: number | null
          rating_delta?: number | null
          ready?: boolean
          result?: string | null
          score?: number
          total_time_ms?: number
          user_id: string
          xp_awarded?: number
        }
        Update: {
          answered_count?: number
          battle_id?: string
          correct_count?: number
          cur_streak?: number
          forfeited?: boolean
          joined_at?: string
          last_seen_at?: string
          rating_after?: number | null
          rating_before?: number | null
          rating_delta?: number | null
          ready?: boolean
          result?: string | null
          score?: number
          total_time_ms?: number
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_battle_players_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "quiz_battles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_battle_questions: {
        Row: {
          battle_id: string
          closed_at: string | null
          closes_at: string | null
          key: Json
          opens_at: string | null
          qtype: string
          question_id: string
          seconds: number
          seq: number
          snapshot: Json
        }
        Insert: {
          battle_id: string
          closed_at?: string | null
          closes_at?: string | null
          key: Json
          opens_at?: string | null
          qtype: string
          question_id: string
          seconds: number
          seq: number
          snapshot: Json
        }
        Update: {
          battle_id?: string
          closed_at?: string | null
          closes_at?: string | null
          key?: Json
          opens_at?: string | null
          qtype?: string
          question_id?: string
          seconds?: number
          seq?: number
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "quiz_battle_questions_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "quiz_battles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_battle_responses: {
        Row: {
          answered_at: string
          battle_id: string
          is_correct: boolean
          numerical_answer: number | null
          points: number
          selected_option_ids: string[]
          seq: number
          time_ms: number
          user_id: string
        }
        Insert: {
          answered_at?: string
          battle_id: string
          is_correct: boolean
          numerical_answer?: number | null
          points: number
          selected_option_ids?: string[]
          seq: number
          time_ms: number
          user_id: string
        }
        Update: {
          answered_at?: string
          battle_id?: string
          is_correct?: boolean
          numerical_answer?: number | null
          points?: number
          selected_option_ids?: string[]
          seq?: number
          time_ms?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_battle_responses_battle_id_seq_fkey"
            columns: ["battle_id", "seq"]
            isOneToOne: false
            referencedRelation: "quiz_battle_questions"
            referencedColumns: ["battle_id", "seq"]
          },
        ]
      }
      quiz_battles: {
        Row: {
          chapter: string | null
          created_at: string
          created_by: string | null
          current_seq: number
          difficulty: string
          end_reason: string | null
          finished_at: string | null
          format: string
          id: string
          join_code: string | null
          kind: string
          lobby_expires_at: string
          mode: string
          question_count: number
          seconds_per_question: number
          starts_at: string | null
          status: string
          subject: string
          winner_id: string | null
        }
        Insert: {
          chapter?: string | null
          created_at?: string
          created_by?: string | null
          current_seq?: number
          difficulty?: string
          end_reason?: string | null
          finished_at?: string | null
          format: string
          id?: string
          join_code?: string | null
          kind?: string
          lobby_expires_at?: string
          mode?: string
          question_count: number
          seconds_per_question: number
          starts_at?: string | null
          status?: string
          subject?: string
          winner_id?: string | null
        }
        Update: {
          chapter?: string | null
          created_at?: string
          created_by?: string | null
          current_seq?: number
          difficulty?: string
          end_reason?: string | null
          finished_at?: string | null
          format?: string
          id?: string
          join_code?: string | null
          kind?: string
          lobby_expires_at?: string
          mode?: string
          question_count?: number
          seconds_per_question?: number
          starts_at?: string | null
          status?: string
          subject?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      quiz_config: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      quiz_daily_attempts: {
        Row: {
          answered_count: number
          challenge_date: string
          correct_count: number
          finished_at: string | null
          score: number
          started_at: string
          status: string
          total_time_ms: number | null
          user_id: string
          xp_awarded: number
        }
        Insert: {
          answered_count?: number
          challenge_date: string
          correct_count?: number
          finished_at?: string | null
          score?: number
          started_at?: string
          status?: string
          total_time_ms?: number | null
          user_id: string
          xp_awarded?: number
        }
        Update: {
          answered_count?: number
          challenge_date?: string
          correct_count?: number
          finished_at?: string | null
          score?: number
          started_at?: string
          status?: string
          total_time_ms?: number | null
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_daily_attempts_challenge_date_fkey"
            columns: ["challenge_date"]
            isOneToOne: false
            referencedRelation: "quiz_daily_challenges"
            referencedColumns: ["challenge_date"]
          },
        ]
      }
      quiz_daily_challenges: {
        Row: {
          challenge_date: string
          created_at: string
          published_by: string | null
          question_count: number
          seconds_total: number
          status: string
        }
        Insert: {
          challenge_date: string
          created_at?: string
          published_by?: string | null
          question_count: number
          seconds_total: number
          status?: string
        }
        Update: {
          challenge_date?: string
          created_at?: string
          published_by?: string | null
          question_count?: number
          seconds_total?: number
          status?: string
        }
        Relationships: []
      }
      quiz_daily_questions: {
        Row: {
          challenge_date: string
          key: Json
          qtype: string
          question_id: string
          seq: number
          snapshot: Json
        }
        Insert: {
          challenge_date: string
          key: Json
          qtype: string
          question_id: string
          seq: number
          snapshot: Json
        }
        Update: {
          challenge_date?: string
          key?: Json
          qtype?: string
          question_id?: string
          seq?: number
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "quiz_daily_questions_challenge_date_fkey"
            columns: ["challenge_date"]
            isOneToOne: false
            referencedRelation: "quiz_daily_challenges"
            referencedColumns: ["challenge_date"]
          },
        ]
      }
      quiz_daily_responses: {
        Row: {
          answered_at: string
          challenge_date: string
          is_correct: boolean
          numerical_answer: number | null
          points: number
          selected_option_ids: string[]
          seq: number
          time_ms: number
          user_id: string
        }
        Insert: {
          answered_at?: string
          challenge_date: string
          is_correct: boolean
          numerical_answer?: number | null
          points: number
          selected_option_ids?: string[]
          seq: number
          time_ms?: number
          user_id: string
        }
        Update: {
          answered_at?: string
          challenge_date?: string
          is_correct?: boolean
          numerical_answer?: number | null
          points?: number
          selected_option_ids?: string[]
          seq?: number
          time_ms?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_daily_responses_challenge_date_user_id_fkey"
            columns: ["challenge_date", "user_id"]
            isOneToOne: false
            referencedRelation: "quiz_daily_attempts"
            referencedColumns: ["challenge_date", "user_id"]
          },
        ]
      }
      quiz_matchmaking_queue: {
        Row: {
          battle_id: string | null
          expires_at: string
          format: string
          is_ranked: boolean
          joined_at: string
          rating: number
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          battle_id?: string | null
          expires_at: string
          format?: string
          is_ranked?: boolean
          joined_at?: string
          rating: number
          status?: string
          subject?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          battle_id?: string | null
          expires_at?: string
          format?: string
          is_ranked?: boolean
          joined_at?: string
          rating?: number
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_mission_progress: {
        Row: {
          completed_at: string | null
          mission_code: string
          period_start: string
          progress: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          mission_code: string
          period_start: string
          progress?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          mission_code?: string
          period_start?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_mission_progress_mission_code_fkey"
            columns: ["mission_code"]
            isOneToOne: false
            referencedRelation: "quiz_missions"
            referencedColumns: ["code"]
          },
        ]
      }
      quiz_missions: {
        Row: {
          active: boolean
          code: string
          description: string
          metric: string
          name: string
          period: string
          target: number
          xp_reward: number
        }
        Insert: {
          active?: boolean
          code: string
          description: string
          metric: string
          name: string
          period: string
          target: number
          xp_reward?: number
        }
        Update: {
          active?: boolean
          code?: string
          description?: string
          metric?: string
          name?: string
          period?: string
          target?: number
          xp_reward?: number
        }
        Relationships: []
      }
      quiz_practice_items: {
        Row: {
          answered_at: string | null
          is_correct: boolean | null
          key: Json
          numerical_answer: number | null
          qtype: string
          question_id: string
          selected_option_ids: string[] | null
          seq: number
          session_id: string
          snapshot: Json
          time_ms: number | null
        }
        Insert: {
          answered_at?: string | null
          is_correct?: boolean | null
          key: Json
          numerical_answer?: number | null
          qtype: string
          question_id: string
          selected_option_ids?: string[] | null
          seq: number
          session_id: string
          snapshot: Json
          time_ms?: number | null
        }
        Update: {
          answered_at?: string | null
          is_correct?: boolean | null
          key?: Json
          numerical_answer?: number | null
          qtype?: string
          question_id?: string
          selected_option_ids?: string[] | null
          seq?: number
          session_id?: string
          snapshot?: Json
          time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_practice_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_practice_sessions: {
        Row: {
          answered_count: number
          chapter: string | null
          correct_count: number
          created_at: string
          difficulty: string
          finished_at: string | null
          id: string
          question_count: number
          seconds_per_question: number | null
          status: string
          subject: string
          timed: boolean
          user_id: string
          xp_awarded: number
        }
        Insert: {
          answered_count?: number
          chapter?: string | null
          correct_count?: number
          created_at?: string
          difficulty?: string
          finished_at?: string | null
          id?: string
          question_count: number
          seconds_per_question?: number | null
          status?: string
          subject: string
          timed?: boolean
          user_id: string
          xp_awarded?: number
        }
        Update: {
          answered_count?: number
          chapter?: string | null
          correct_count?: number
          created_at?: string
          difficulty?: string
          finished_at?: string | null
          id?: string
          question_count?: number
          seconds_per_question?: number | null
          status?: string
          subject?: string
          timed?: boolean
          user_id?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      quiz_question_exclusions: {
        Row: {
          created_at: string
          excluded_by: string | null
          question_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          excluded_by?: string | null
          question_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          excluded_by?: string | null
          question_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_question_exclusions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "test_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_rating_history: {
        Row: {
          battle_id: string | null
          created_at: string
          delta: number
          id: string
          rating_after: number
          rating_before: number
          season: string | null
          user_id: string
        }
        Insert: {
          battle_id?: string | null
          created_at?: string
          delta: number
          id?: string
          rating_after: number
          rating_before: number
          season?: string | null
          user_id: string
        }
        Update: {
          battle_id?: string | null
          created_at?: string
          delta?: number
          id?: string
          rating_after?: number
          rating_before?: number
          season?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quiz_security_events: {
        Row: {
          battle_id: string | null
          created_at: string
          details: Json | null
          id: string
          kind: string
          user_id: string | null
        }
        Insert: {
          battle_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          kind: string
          user_id?: string | null
        }
        Update: {
          battle_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          kind?: string
          user_id?: string | null
        }
        Relationships: []
      }
      quiz_stats: {
        Row: {
          answered: number
          battle_answered: number
          battle_best: number
          battle_best_sec: number | null
          battle_correct: number
          battles: number
          best_win_streak: number
          comeback_wins: number
          correct: number
          daily_best: number
          daily_completed: number
          draws: number
          last_battle_at: string | null
          last_day: string | null
          level: number
          longest_streak: number
          losses: number
          peak_rating: number
          perfect_battles: number
          played: number
          practice_answered: number
          practice_correct: number
          ranked_battles: number
          rating: number
          streak: number
          updated_at: string
          user_id: string
          win_streak: number
          wins: number
          xp: number
        }
        Insert: {
          answered?: number
          battle_answered?: number
          battle_best?: number
          battle_best_sec?: number | null
          battle_correct?: number
          battles?: number
          best_win_streak?: number
          comeback_wins?: number
          correct?: number
          daily_best?: number
          daily_completed?: number
          draws?: number
          last_battle_at?: string | null
          last_day?: string | null
          level?: number
          longest_streak?: number
          losses?: number
          peak_rating?: number
          perfect_battles?: number
          played?: number
          practice_answered?: number
          practice_correct?: number
          ranked_battles?: number
          rating?: number
          streak?: number
          updated_at?: string
          user_id: string
          win_streak?: number
          wins?: number
          xp?: number
        }
        Update: {
          answered?: number
          battle_answered?: number
          battle_best?: number
          battle_best_sec?: number | null
          battle_correct?: number
          battles?: number
          best_win_streak?: number
          comeback_wins?: number
          correct?: number
          daily_best?: number
          daily_completed?: number
          draws?: number
          last_battle_at?: string | null
          last_day?: string | null
          level?: number
          longest_streak?: number
          losses?: number
          peak_rating?: number
          perfect_battles?: number
          played?: number
          practice_answered?: number
          practice_correct?: number
          ranked_battles?: number
          rating?: number
          streak?: number
          updated_at?: string
          user_id?: string
          win_streak?: number
          wins?: number
          xp?: number
        }
        Relationships: []
      }
      quiz_subject_stats: {
        Row: {
          answered: number
          correct: number
          subject: string
          total_time_ms: number
          updated_at: string
          user_id: string
        }
        Insert: {
          answered?: number
          correct?: number
          subject: string
          total_time_ms?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          answered?: number
          correct?: number
          subject?: string
          total_time_ms?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_topic_stats: {
        Row: {
          answered: number
          correct: number
          subject: string
          topic: string
          total_time_ms: number
          updated_at: string
          user_id: string
        }
        Insert: {
          answered?: number
          correct?: number
          subject: string
          topic: string
          total_time_ms?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          answered?: number
          correct?: number
          subject?: string
          topic?: string
          total_time_ms?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          bucket: string
          count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          bucket: string
          count?: number
          updated_at?: string
          window_start?: string
        }
        Update: {
          bucket?: string
          count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      resource_bookmarks: {
        Row: {
          created_at: string
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_bookmarks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "search_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      sahai_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          label: string
          query: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          label: string
          query: string
          user_id?: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          label?: string
          query?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_tests: {
        Row: {
          created_at: string
          error: string | null
          generated_test_id: string | null
          id: string
          scheduled_date: string
          status: string
          subjects: Json
          test_name: string
          test_number: number
          total_questions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          generated_test_id?: string | null
          id?: string
          scheduled_date: string
          status?: string
          subjects: Json
          test_name: string
          test_number: number
          total_questions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          generated_test_id?: string | null
          id?: string
          scheduled_date?: string
          status?: string
          subjects?: Json
          test_name?: string
          test_number?: number
          total_questions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_tests_generated_test_id_fkey"
            columns: ["generated_test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      search_documents: {
        Row: {
          audience: string
          class_level: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          keywords: string | null
          published_at: string | null
          search_vector: unknown
          slug: string | null
          source_id: string
          source_type: string
          subject: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          class_level?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          keywords?: string | null
          published_at?: string | null
          search_vector?: unknown
          slug?: string | null
          source_id: string
          source_type: string
          subject?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          class_level?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          keywords?: string | null
          published_at?: string | null
          search_vector?: unknown
          slug?: string | null
          source_id?: string
          source_type?: string
          subject?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      server_security_events: {
        Row: {
          action: string | null
          created_at: string
          detail: Json
          id: string
          ip_hash: string | null
          kind: string
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          detail?: Json
          id?: string
          ip_hash?: string | null
          kind: string
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          detail?: Json
          id?: string
          ip_hash?: string | null
          kind?: string
          user_id?: string | null
        }
        Relationships: []
      }
      squad_notification_prefs: {
        Row: {
          group_id: string
          mode: Database["public"]["Enums"]["squad_notify_mode"]
          updated_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          mode?: Database["public"]["Enums"]["squad_notify_mode"]
          updated_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          mode?: Database["public"]["Enums"]["squad_notify_mode"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_notification_prefs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      streak_claims: {
        Row: {
          claim_date: string
          created_at: string
          user_id: string
        }
        Insert: {
          claim_date: string
          created_at?: string
          user_id: string
        }
        Update: {
          claim_date?: string
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      streak_recoveries: {
        Row: {
          created_at: string
          id: string
          recovered_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recovered_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recovered_date?: string
          user_id?: string
        }
        Relationships: []
      }
      study_activity_events: {
        Row: {
          activity_date: string
          created_at: string
          id: string
          source: string
          user_id: string
        }
        Insert: {
          activity_date: string
          created_at?: string
          id?: string
          source: string
          user_id: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      study_goals: {
        Row: {
          created_at: string
          current_value: number
          goal_date: string
          id: string
          target_value: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          goal_date?: string
          id?: string
          target_value: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number
          goal_date?: string
          id?: string
          target_value?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_group_messages: {
        Row: {
          attachment_name: string | null
          attachment_path: string | null
          attachment_size: number | null
          attachment_type: string | null
          body: string | null
          created_at: string
          deleted_at: string | null
          deleted_for_everyone: boolean
          delivered_at: string | null
          group_id: string
          id: string
          read_at: string | null
          type: Database["public"]["Enums"]["group_message_kind"]
          user_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          body?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_for_everyone?: boolean
          delivered_at?: string | null
          group_id: string
          id?: string
          read_at?: string | null
          type?: Database["public"]["Enums"]["group_message_kind"]
          user_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          body?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_for_everyone?: boolean
          delivered_at?: string | null
          group_id?: string
          id?: string
          read_at?: string | null
          type?: Database["public"]["Enums"]["group_message_kind"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_planner_goals: {
        Row: {
          created_at: string
          id: string
          priority: string
          status: string
          subject: string | null
          target_date: string | null
          title: string
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string | null
          target_date?: string | null
          title: string
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string | null
          target_date?: string | null
          title?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_planner_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          estimated_minutes: number
          goal_id: string | null
          id: string
          priority: string
          scheduled_date: string
          source: string
          source_id: string | null
          status: string
          subject: string | null
          task_type: string
          title: string
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number
          goal_id?: string | null
          id?: string
          priority?: string
          scheduled_date?: string
          source?: string
          source_id?: string | null
          status?: string
          subject?: string | null
          task_type?: string
          title: string
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number
          goal_id?: string | null
          id?: string
          priority?: string
          scheduled_date?: string
          source?: string
          source_id?: string | null
          status?: string
          subject?: string | null
          task_type?: string
          title?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_planner_tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "study_planner_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          duration_seconds: number
          ended_at: string
          id: string
          note: string | null
          session_type: Database["public"]["Enums"]["session_type"]
          subject: Database["public"]["Enums"]["subject"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds: number
          ended_at?: string
          id?: string
          note?: string | null
          session_type?: Database["public"]["Enums"]["session_type"]
          subject?: Database["public"]["Enums"]["subject"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          ended_at?: string
          id?: string
          note?: string | null
          session_type?: Database["public"]["Enums"]["session_type"]
          subject?: Database["public"]["Enums"]["subject"] | null
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      synced_playlists: {
        Row: {
          added_by: string
          chapter: string | null
          created_at: string
          id: string
          last_error: string | null
          last_status: string
          last_synced_at: string | null
          subject: string
          title: string | null
          updated_at: string
          videos_added: number
          youtube_playlist_id: string
        }
        Insert: {
          added_by: string
          chapter?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_status?: string
          last_synced_at?: string | null
          subject: string
          title?: string | null
          updated_at?: string
          videos_added?: number
          youtube_playlist_id: string
        }
        Update: {
          added_by?: string
          chapter?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_status?: string
          last_synced_at?: string | null
          subject?: string
          title?: string | null
          updated_at?: string
          videos_added?: number
          youtube_playlist_id?: string
        }
        Relationships: []
      }
      test_ai_access: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test_attempts: {
        Row: {
          accuracy: number
          correct_count: number
          created_at: string
          duration_sec: number | null
          fullscreen_exit_count: number
          id: string
          max_score: number
          negative_total: number
          option_order: Json | null
          percentile: number | null
          question_order: string[] | null
          result_dm_sent: boolean
          results_at: string | null
          results_notified: boolean
          score: number
          skipped_count: number
          started_at: string
          status: Database["public"]["Enums"]["test_attempt_status"]
          submitted_at: string | null
          tab_switch_count: number
          test_id: string
          user_id: string
          wrong_count: number
        }
        Insert: {
          accuracy?: number
          correct_count?: number
          created_at?: string
          duration_sec?: number | null
          fullscreen_exit_count?: number
          id?: string
          max_score?: number
          negative_total?: number
          option_order?: Json | null
          percentile?: number | null
          question_order?: string[] | null
          result_dm_sent?: boolean
          results_at?: string | null
          results_notified?: boolean
          score?: number
          skipped_count?: number
          started_at?: string
          status?: Database["public"]["Enums"]["test_attempt_status"]
          submitted_at?: string | null
          tab_switch_count?: number
          test_id: string
          user_id: string
          wrong_count?: number
        }
        Update: {
          accuracy?: number
          correct_count?: number
          created_at?: string
          duration_sec?: number | null
          fullscreen_exit_count?: number
          id?: string
          max_score?: number
          negative_total?: number
          option_order?: Json | null
          percentile?: number | null
          question_order?: string[] | null
          result_dm_sent?: boolean
          results_at?: string | null
          results_notified?: boolean
          score?: number
          skipped_count?: number
          started_at?: string
          status?: Database["public"]["Enums"]["test_attempt_status"]
          submitted_at?: string | null
          tab_switch_count?: number
          test_id?: string
          user_id?: string
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_bookmarks: {
        Row: {
          created_at: string
          test_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          test_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          test_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_bookmarks_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_options: {
        Row: {
          created_at: string
          id: string
          image_path: string | null
          is_correct: boolean
          label: string
          order_no: number
          question_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_path?: string | null
          is_correct?: boolean
          label: string
          order_no?: number
          question_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string | null
          is_correct?: boolean
          label?: string
          order_no?: number
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "test_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_pdf_uploads: {
        Row: {
          created_at: string
          error: string | null
          file_name: string
          file_path: string
          id: string
          kind: string
          parsed_json: Json | null
          question_count: number
          status: string
          test_id: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          file_name: string
          file_path: string
          id?: string
          kind?: string
          parsed_json?: Json | null
          question_count?: number
          status?: string
          test_id?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          error?: string | null
          file_name?: string
          file_path?: string
          id?: string
          kind?: string
          parsed_json?: Json | null
          question_count?: number
          status?: string
          test_id?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_pdf_uploads_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          archived: boolean
          archived_at: string | null
          chapter: string | null
          correct_numerical: number | null
          created_at: string
          difficulty: string | null
          exam_category: string | null
          explanation: string | null
          id: string
          image_url: string | null
          images: Json
          marks: number
          negative_marks: number
          numerical_tolerance: number
          order_no: number
          partial_marking: string
          question_text: string
          question_type: Database["public"]["Enums"]["test_question_type"]
          range_max: number | null
          range_min: number | null
          section: string | null
          solution_content: string | null
          solution_images: Json
          subject: Database["public"]["Enums"]["test_subject_kind"] | null
          test_id: string
          topic: string | null
          unanswered_marks: number
          updated_at: string
        }
        Insert: {
          archived?: boolean
          archived_at?: string | null
          chapter?: string | null
          correct_numerical?: number | null
          created_at?: string
          difficulty?: string | null
          exam_category?: string | null
          explanation?: string | null
          id?: string
          image_url?: string | null
          images?: Json
          marks?: number
          negative_marks?: number
          numerical_tolerance?: number
          order_no?: number
          partial_marking?: string
          question_text: string
          question_type?: Database["public"]["Enums"]["test_question_type"]
          range_max?: number | null
          range_min?: number | null
          section?: string | null
          solution_content?: string | null
          solution_images?: Json
          subject?: Database["public"]["Enums"]["test_subject_kind"] | null
          test_id: string
          topic?: string | null
          unanswered_marks?: number
          updated_at?: string
        }
        Update: {
          archived?: boolean
          archived_at?: string | null
          chapter?: string | null
          correct_numerical?: number | null
          created_at?: string
          difficulty?: string | null
          exam_category?: string | null
          explanation?: string | null
          id?: string
          image_url?: string | null
          images?: Json
          marks?: number
          negative_marks?: number
          numerical_tolerance?: number
          order_no?: number
          partial_marking?: string
          question_text?: string
          question_type?: Database["public"]["Enums"]["test_question_type"]
          range_max?: number | null
          range_min?: number | null
          section?: string | null
          solution_content?: string | null
          solution_images?: Json
          subject?: Database["public"]["Enums"]["test_subject_kind"] | null
          test_id?: string
          topic?: string | null
          unanswered_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_reports: {
        Row: {
          created_at: string
          id: string
          question_id: string
          reason: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          reason: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          reason?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_reports_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "test_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_responses: {
        Row: {
          attempt_id: string
          id: string
          is_correct: boolean | null
          marked_for_review: boolean
          marks_awarded: number
          numerical_answer: number | null
          question_id: string
          selected_option_ids: string[]
          time_spent_sec: number
          updated_at: string
          visited: boolean
        }
        Insert: {
          attempt_id: string
          id?: string
          is_correct?: boolean | null
          marked_for_review?: boolean
          marks_awarded?: number
          numerical_answer?: number | null
          question_id: string
          selected_option_ids?: string[]
          time_spent_sec?: number
          updated_at?: string
          visited?: boolean
        }
        Update: {
          attempt_id?: string
          id?: string
          is_correct?: boolean | null
          marked_for_review?: boolean
          marks_awarded?: number
          numerical_answer?: number | null
          question_id?: string
          selected_option_ids?: string[]
          time_spent_sec?: number
          updated_at?: string
          visited?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "test_responses_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "test_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          approval_status: string
          chapters: string[]
          created_at: string
          created_by: string
          default_marking_scheme: Json | null
          default_marks_per_question: number
          default_negative_per_question: number
          description: string | null
          difficulty: Database["public"]["Enums"]["test_difficulty"]
          duration_min: number
          ends_at: string | null
          exam_type: Database["public"]["Enums"]["test_exam_type"]
          id: string
          instructions: string | null
          is_premium: boolean
          language: string
          max_attempts: number
          mode: Database["public"]["Enums"]["test_mode"]
          name: string
          navigation_mode: string
          navigation_rules: Json | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sections: Json
          sections_config: Json | null
          shuffle_options: boolean
          shuffle_questions: boolean
          solution_visibility: string
          starts_at: string | null
          status: Database["public"]["Enums"]["test_status"]
          subject: Database["public"]["Enums"]["test_subject_kind"]
          total_marks: number
          updated_at: string
          visibility: Database["public"]["Enums"]["test_visibility"]
        }
        Insert: {
          approval_status?: string
          chapters?: string[]
          created_at?: string
          created_by: string
          default_marking_scheme?: Json | null
          default_marks_per_question?: number
          default_negative_per_question?: number
          description?: string | null
          difficulty?: Database["public"]["Enums"]["test_difficulty"]
          duration_min?: number
          ends_at?: string | null
          exam_type?: Database["public"]["Enums"]["test_exam_type"]
          id?: string
          instructions?: string | null
          is_premium?: boolean
          language?: string
          max_attempts?: number
          mode?: Database["public"]["Enums"]["test_mode"]
          name: string
          navigation_mode?: string
          navigation_rules?: Json | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sections?: Json
          sections_config?: Json | null
          shuffle_options?: boolean
          shuffle_questions?: boolean
          solution_visibility?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["test_status"]
          subject?: Database["public"]["Enums"]["test_subject_kind"]
          total_marks?: number
          updated_at?: string
          visibility?: Database["public"]["Enums"]["test_visibility"]
        }
        Update: {
          approval_status?: string
          chapters?: string[]
          created_at?: string
          created_by?: string
          default_marking_scheme?: Json | null
          default_marks_per_question?: number
          default_negative_per_question?: number
          description?: string | null
          difficulty?: Database["public"]["Enums"]["test_difficulty"]
          duration_min?: number
          ends_at?: string | null
          exam_type?: Database["public"]["Enums"]["test_exam_type"]
          id?: string
          instructions?: string | null
          is_premium?: boolean
          language?: string
          max_attempts?: number
          mode?: Database["public"]["Enums"]["test_mode"]
          name?: string
          navigation_mode?: string
          navigation_rules?: Json | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sections?: Json
          sections_config?: Json | null
          shuffle_options?: boolean
          shuffle_questions?: boolean
          solution_visibility?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["test_status"]
          subject?: Database["public"]["Enums"]["test_subject_kind"]
          total_marks?: number
          updated_at?: string
          visibility?: Database["public"]["Enums"]["test_visibility"]
        }
        Relationships: []
      }
      topic_progress: {
        Row: {
          id: string
          status: Database["public"]["Enums"]["progress_status"]
          subject: Database["public"]["Enums"]["subject"]
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          status?: Database["public"]["Enums"]["progress_status"]
          subject: Database["public"]["Enums"]["subject"]
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          status?: Database["public"]["Enums"]["progress_status"]
          subject?: Database["public"]["Enums"]["subject"]
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      topper_congrats: {
        Row: {
          created_at: string
          id: string
          message: string | null
          topper_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          topper_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          topper_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topper_congrats_topper_id_fkey"
            columns: ["topper_id"]
            isOneToOne: false
            referencedRelation: "toppers"
            referencedColumns: ["id"]
          },
        ]
      }
      toppers: {
        Row: {
          achievements: string | null
          board_name: string | null
          city: string | null
          congrats_count: number
          created_at: string
          created_by: string | null
          exam: string
          featured: boolean
          id: string
          marks: string | null
          name: string
          notes: string | null
          percentage: number | null
          percentile: string | null
          photo_url: string | null
          quote: string | null
          rank: number
          school: string | null
          source_url: string | null
          state: string | null
          stream: string | null
          subject_marks: Json
          updated_at: string
          year: number
        }
        Insert: {
          achievements?: string | null
          board_name?: string | null
          city?: string | null
          congrats_count?: number
          created_at?: string
          created_by?: string | null
          exam: string
          featured?: boolean
          id?: string
          marks?: string | null
          name: string
          notes?: string | null
          percentage?: number | null
          percentile?: string | null
          photo_url?: string | null
          quote?: string | null
          rank: number
          school?: string | null
          source_url?: string | null
          state?: string | null
          stream?: string | null
          subject_marks?: Json
          updated_at?: string
          year: number
        }
        Update: {
          achievements?: string | null
          board_name?: string | null
          city?: string | null
          congrats_count?: number
          created_at?: string
          created_by?: string | null
          exam?: string
          featured?: boolean
          id?: string
          marks?: string | null
          name?: string
          notes?: string | null
          percentage?: number | null
          percentile?: string | null
          photo_url?: string | null
          quote?: string | null
          rank?: number
          school?: string | null
          source_url?: string | null
          state?: string | null
          stream?: string | null
          subject_marks?: Json
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      trusted_unlock_codes: {
        Row: {
          created_at: string
          id: string
          label: string
          password_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          password_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          password_hash?: string
        }
        Relationships: []
      }
      user_birthdays: {
        Row: {
          birthday_day: number
          birthday_month: number
          created_at: string
          music_enabled: boolean
          notifications_enabled: boolean
          reminder_days_before: number
          reminders_enabled: boolean
          setup_completed_at: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          birthday_day: number
          birthday_month: number
          created_at?: string
          music_enabled?: boolean
          notifications_enabled?: boolean
          reminder_days_before?: number
          reminders_enabled?: boolean
          setup_completed_at?: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          birthday_day?: number
          birthday_month?: number
          created_at?: string
          music_enabled?: boolean
          notifications_enabled?: boolean
          reminder_days_before?: number
          reminders_enabled?: boolean
          setup_completed_at?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      user_certificates: {
        Row: {
          awarded_at: string
          awarded_by: string | null
          certificate_kind: string
          certificate_type_id: string | null
          custom_description: string | null
          custom_title: string | null
          exam_category: string | null
          id: string
          issuer_name: string | null
          maximum_marks: number | null
          rank_text: string | null
          revoke_reason: string | null
          revoked_at: string | null
          score: number | null
          test_name: string | null
          user_id: string
          verification_code: string
        }
        Insert: {
          awarded_at?: string
          awarded_by?: string | null
          certificate_kind?: string
          certificate_type_id?: string | null
          custom_description?: string | null
          custom_title?: string | null
          exam_category?: string | null
          id?: string
          issuer_name?: string | null
          maximum_marks?: number | null
          rank_text?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          score?: number | null
          test_name?: string | null
          user_id: string
          verification_code: string
        }
        Update: {
          awarded_at?: string
          awarded_by?: string | null
          certificate_kind?: string
          certificate_type_id?: string | null
          custom_description?: string | null
          custom_title?: string | null
          exam_category?: string | null
          id?: string
          issuer_name?: string | null
          maximum_marks?: number | null
          rank_text?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          score?: number | null
          test_name?: string | null
          user_id?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_certificates_certificate_type_id_fkey"
            columns: ["certificate_type_id"]
            isOneToOne: false
            referencedRelation: "certificate_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          address_line: string | null
          browser: string | null
          city: string | null
          class_level: string | null
          consent_version: string | null
          consented_at: string
          created_at: string
          device_pixel_ratio: number | null
          dob: string | null
          full_name: string | null
          gps_accuracy: number | null
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          ip_address: string | null
          ip_city: string | null
          ip_country: string | null
          ip_isp: string | null
          ip_region: string | null
          language: string | null
          os: string | null
          parent_name: string | null
          parent_phone: string | null
          phone: string | null
          pincode: string | null
          platform: string | null
          purpose: string
          school: string | null
          screen_size: string | null
          state: string | null
          timezone: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          address_line?: string | null
          browser?: string | null
          city?: string | null
          class_level?: string | null
          consent_version?: string | null
          consented_at?: string
          created_at?: string
          device_pixel_ratio?: number | null
          dob?: string | null
          full_name?: string | null
          gps_accuracy?: number | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          ip_address?: string | null
          ip_city?: string | null
          ip_country?: string | null
          ip_isp?: string | null
          ip_region?: string | null
          language?: string | null
          os?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          pincode?: string | null
          platform?: string | null
          purpose: string
          school?: string | null
          screen_size?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          address_line?: string | null
          browser?: string | null
          city?: string | null
          class_level?: string | null
          consent_version?: string | null
          consented_at?: string
          created_at?: string
          device_pixel_ratio?: number | null
          dob?: string | null
          full_name?: string | null
          gps_accuracy?: number | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          ip_address?: string | null
          ip_city?: string | null
          ip_country?: string | null
          ip_isp?: string | null
          ip_region?: string | null
          language?: string | null
          os?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          pincode?: string | null
          platform?: string | null
          purpose?: string
          school?: string | null
          screen_size?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_daily_targets: {
        Row: {
          created_at: string
          done: boolean
          estimated_minutes: number | null
          id: string
          priority: string
          sort_order: number
          subject: string | null
          task_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          estimated_minutes?: number | null
          id?: string
          priority?: string
          sort_order?: number
          subject?: string | null
          task_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          estimated_minutes?: number | null
          id?: string
          priority?: string
          sort_order?: number
          subject?: string | null
          task_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_login_days: {
        Row: {
          created_at: string
          login_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          login_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          login_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_login_days_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_login_days_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_moderation: {
        Row: {
          can_message: boolean
          can_post: boolean
          created_at: string
          reason: string | null
          set_by: string | null
          status: string
          suspended_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          can_message?: boolean
          can_post?: boolean
          created_at?: string
          reason?: string | null
          set_by?: string | null
          status?: string
          suspended_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          can_message?: boolean
          can_post?: boolean
          created_at?: string
          reason?: string | null
          set_by?: string | null
          status?: string
          suspended_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_security_events: {
        Row: {
          created_at: string
          device: string | null
          event_type: string
          id: string
          ip_hash: string | null
          metadata: Json
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device?: string | null
          event_type: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device?: string | null
          event_type?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_xp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_xp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_lectures"
            referencedColumns: ["id"]
          },
        ]
      }
      video_lectures: {
        Row: {
          added_by: string
          chapter: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean
          subject: string
          title: string
          updated_at: string
          view_count: number
          youtube_video_id: string
        }
        Insert: {
          added_by: string
          chapter: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean
          subject: string
          title: string
          updated_at?: string
          view_count?: number
          youtube_video_id: string
        }
        Update: {
          added_by?: string
          chapter?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean
          subject?: string
          title?: string
          updated_at?: string
          view_count?: number
          youtube_video_id?: string
        }
        Relationships: []
      }
      video_likes: {
        Row: {
          created_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_lectures"
            referencedColumns: ["id"]
          },
        ]
      }
      video_watch_progress: {
        Row: {
          completed: boolean
          created_at: string
          duration_seconds: number | null
          position_seconds: number
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          duration_seconds?: number | null
          position_seconds?: number
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          duration_seconds?: number | null
          position_seconds?: number
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_watch_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_lectures"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_room_completions: {
        Row: {
          completed_at: string
          queue_item_id: string
          room_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          queue_item_id: string
          room_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          queue_item_id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_room_completions_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "watch_room_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watch_room_completions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "watch_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_room_events: {
        Row: {
          actor_id: string
          created_at: string
          event_type: string
          id: number
          payload: Json
          room_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          event_type: string
          id?: never
          payload?: Json
          room_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          event_type?: string
          id?: never
          payload?: Json
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_room_events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "watch_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_room_members: {
        Row: {
          joined_at: string
          left_at: string | null
          role: string
          room_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          left_at?: string | null
          role?: string
          room_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          joined_at?: string
          left_at?: string | null
          role?: string
          room_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "watch_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_room_messages: {
        Row: {
          body: string
          created_at: string
          deleted_at: string | null
          id: string
          room_id: string
          timestamp_seconds: number | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          room_id: string
          timestamp_seconds?: number | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          room_id?: string
          timestamp_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "watch_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_room_queue: {
        Row: {
          added_by: string
          created_at: string
          duration_seconds: number | null
          id: string
          position: number
          room_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          position: number
          room_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          position?: number
          room_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_room_queue_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "watch_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_rooms: {
        Row: {
          allow_participant_control: boolean
          category: string
          created_at: string
          current_queue_item_id: string | null
          current_video_id: string
          description: string | null
          host_id: string
          id: string
          is_playing: boolean
          playback_rate: number
          playback_sequence: number
          playback_updated_at: string | null
          playback_updated_by: string | null
          position_seconds: number
          source_type: string
          source_url: string | null
          status: string
          subject: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          allow_participant_control?: boolean
          category?: string
          created_at?: string
          current_queue_item_id?: string | null
          current_video_id: string
          description?: string | null
          host_id: string
          id?: string
          is_playing?: boolean
          playback_rate?: number
          playback_sequence?: number
          playback_updated_at?: string | null
          playback_updated_by?: string | null
          position_seconds?: number
          source_type?: string
          source_url?: string | null
          status?: string
          subject: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          allow_participant_control?: boolean
          category?: string
          created_at?: string
          current_queue_item_id?: string | null
          current_video_id?: string
          description?: string | null
          host_id?: string
          id?: string
          is_playing?: boolean
          playback_rate?: number
          playback_sequence?: number
          playback_updated_at?: string | null
          playback_updated_by?: string | null
          position_seconds?: number
          source_type?: string
          source_url?: string | null
          status?: string
          subject?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_rooms_current_queue_item_id_fkey"
            columns: ["current_queue_item_id"]
            isOneToOne: false
            referencedRelation: "watch_room_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_winners: {
        Row: {
          finalized_at: string
          pro_expires_at: string | null
          total_seconds: number
          user_id: string
          week_start: string
        }
        Insert: {
          finalized_at?: string
          pro_expires_at?: string | null
          total_seconds: number
          user_id: string
          week_start: string
        }
        Update: {
          finalized_at?: string
          pro_expires_at?: string | null
          total_seconds?: number
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          source_id: string
          source_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          source_id: string
          source_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          source_id?: string
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      youtube_checklist_items: {
        Row: {
          checklist_id: string
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          is_completed: boolean
          position: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          youtube_video_id: string
        }
        Insert: {
          checklist_id: string
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_completed?: boolean
          position?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          youtube_video_id: string
        }
        Update: {
          checklist_id?: string
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_completed?: boolean
          position?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "youtube_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "youtube_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      youtube_checklists: {
        Row: {
          completed_items: number
          created_at: string
          current_item_id: string | null
          description: string | null
          id: string
          is_archived: boolean
          source_type: string
          source_url: string
          title: string
          total_items: number
          updated_at: string
          user_id: string
          youtube_playlist_id: string | null
        }
        Insert: {
          completed_items?: number
          created_at?: string
          current_item_id?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          source_type: string
          source_url: string
          title: string
          total_items?: number
          updated_at?: string
          user_id: string
          youtube_playlist_id?: string | null
        }
        Update: {
          completed_items?: number
          created_at?: string
          current_item_id?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          source_type?: string
          source_url?: string
          title?: string
          total_items?: number
          updated_at?: string
          user_id?: string
          youtube_playlist_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          class_level: Database["public"]["Enums"]["class_level"] | null
          created_at: string | null
          full_name: string | null
          header_theme: string | null
          id: string | null
          instagram: string | null
          telegram: string | null
          username: string | null
          verified: boolean | null
          website: string | null
          youtube: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          class_level?: Database["public"]["Enums"]["class_level"] | null
          created_at?: string | null
          full_name?: string | null
          header_theme?: string | null
          id?: string | null
          instagram?: string | null
          telegram?: string | null
          username?: string | null
          verified?: boolean | null
          website?: string | null
          youtube?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          class_level?: Database["public"]["Enums"]["class_level"] | null
          created_at?: string | null
          full_name?: string | null
          header_theme?: string | null
          id?: string | null
          instagram?: string | null
          telegram?: string | null
          username?: string | null
          verified?: boolean | null
          website?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      pulse_feed_items: {
        Row: {
          author_avatar_url: string | null
          author_id: string | null
          author_is_admin: boolean | null
          author_name: string | null
          body_text: string | null
          chapter: string | null
          comment_count: number | null
          created_at: string | null
          id: string | null
          image_url: string | null
          item_type: string | null
          like_count: number | null
          subject: string | null
          title: string | null
          youtube_video_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _jph_consent_key: { Args: never; Returns: string }
      _jph_safe_decrypt: { Args: { k: string; val: string }; Returns: string }
      account_verification_is_complete: {
        Args: { _user_id: string }
        Returns: boolean
      }
      add_jee_backlog_item: {
        Args: {
          _chapter_id?: string
          _deadline?: string
          _estimated_minutes?: number
          _notes?: string
          _priority?: string
          _subject: string
          _title: string
          _topic_id?: string
        }
        Returns: Json
      }
      add_jee_dpp: {
        Args: {
          _chapter_id?: string
          _dpp_url?: string
          _notes?: string
          _planned_for?: string
          _source?: string
          _subject: string
          _title: string
          _topic_id?: string
          _total_questions?: number
        }
        Returns: Json
      }
      add_jee_exam_milestone: {
        Args: {
          _exam?: string
          _exam_date?: string
          _notes?: string
          _title: string
        }
        Returns: Json
      }
      add_jee_formula: {
        Args: {
          _chapter_id?: string
          _difficulty?: string
          _explanation?: string
          _formula: string
          _subject: string
          _title: string
          _topic_id?: string
        }
        Returns: Json
      }
      add_jee_lecture: {
        Args: {
          _chapter_id?: string
          _duration_minutes?: number
          _lecture_url?: string
          _notes?: string
          _planned_for?: string
          _source?: string
          _subject: string
          _title: string
          _topic_id?: string
        }
        Returns: Json
      }
      add_jee_mistake: {
        Args: {
          _chapter_id?: string
          _correct_approach?: string
          _learning_note?: string
          _mistake_type?: string
          _question_id?: string
          _subject?: string
          _topic_id?: string
        }
        Returns: Json
      }
      add_jee_question_bookmark: {
        Args: { _note?: string; _question_id: string }
        Returns: Json
      }
      add_jee_study_goal: {
        Args: {
          _deadline?: string
          _goal_type?: string
          _notes?: string
          _target_value?: number
          _title: string
        }
        Returns: Json
      }
      add_jee_study_task: {
        Args: {
          _chapter_id?: string
          _notes?: string
          _plan_id: string
          _planned_minutes?: number
          _priority?: string
          _subject: string
          _title: string
          _topic_id?: string
        }
        Returns: Json
      }
      admin_approve_account_restriction: {
        Args: { _user_id: string }
        Returns: Json
      }
      admin_email_audience_count: {
        Args: { _audience: string; _target_user_id?: string }
        Returns: Json
      }
      admin_generate_account_verification_code: {
        Args: { _user_id: string }
        Returns: Json
      }
      admin_get_consents_decrypted: {
        Args: never
        Returns: {
          address_line: string
          browser: string
          city: string
          class_level: string
          consented_at: string
          created_at: string
          device_pixel_ratio: number
          dob: string
          full_name: string
          gps_accuracy: number
          gps_latitude: number
          gps_longitude: number
          id: string
          ip_address: string
          ip_city: string
          ip_country: string
          ip_isp: string
          ip_region: string
          language: string
          os: string
          parent_name: string
          parent_phone: string
          phone: string
          pincode: string
          platform: string
          purpose: string
          school: string
          screen_size: string
          state: string
          timezone: string
          updated_at: string
          user_agent: string
          user_id: string
        }[]
      }
      admin_list_pending_account_verifications: {
        Args: never
        Returns: {
          attempts: number
          code_expires_at: string
          created_at: string
          email: string
          full_name: string
          last_code_sent_at: string
          status: string
          user_id: string
          username: string
        }[]
      }
      admin_queue_broadcast_email: {
        Args: {
          _audience: string
          _body: string
          _from_email: string
          _sender_domain: string
          _subject: string
          _target_user_id?: string
        }
        Returns: Json
      }
      admin_verify_account: {
        Args: { _source?: string; _user_id: string }
        Returns: Json
      }
      birthday_delete_wish: { Args: { _wish_id: string }; Returns: boolean }
      birthday_generate_my_reminders: { Args: never; Returns: number }
      birthday_hub: {
        Args: { _days_ahead?: number }
        Returns: {
          avatar_url: string
          birthday_on: string
          days_until: number
          display_name: string
          unique_wisher_count: number
          user_id: string
          wish_count: number
        }[]
      }
      birthday_moderation_queue: {
        Args: { _limit?: number }
        Returns: {
          message: string
          reason: string
          recipient_id: string
          report_id: string
          reported_at: string
          reporter_name: string
          sender_name: string
          wish_id: string
        }[]
      }
      birthday_my_badges: {
        Args: never
        Returns: {
          awarded_at: string
          badge_key: string
        }[]
      }
      birthday_my_party_theme: { Args: never; Returns: string }
      birthday_my_settings: {
        Args: never
        Returns: {
          birthday_day: number
          birthday_month: number
          birthday_reminder_days_before: number
          birthday_reminders_enabled: boolean
          music_enabled: boolean
          notifications_enabled: boolean
          reminder_days_before: number
          reminders_enabled: boolean
          setup_completed_at: string
          visibility: string
        }[]
      }
      birthday_next_occurrence: {
        Args: { _d: number; _m: number; _today: string }
        Returns: string
      }
      birthday_record_activity: {
        Args: { _activity: string }
        Returns: boolean
      }
      birthday_report_wish: {
        Args: { _reason: string; _wish_id: string }
        Returns: boolean
      }
      birthday_resolve_report: {
        Args: { _delete_wish?: boolean; _report_id: string }
        Returns: boolean
      }
      birthday_save_my_party_theme: {
        Args: { _theme: string }
        Returns: boolean
      }
      birthday_save_my_settings: {
        Args: {
          _birthday_day: number
          _birthday_month: number
          _birthday_reminder_days_before?: number
          _birthday_reminders_enabled?: boolean
          _music_enabled?: boolean
          _notifications_enabled?: boolean
          _visibility?: string
        }
        Returns: boolean
      }
      birthday_send_wish: {
        Args: { _message: string; _reaction?: string; _recipient_id: string }
        Returns: string
      }
      birthday_viewer_ok: {
        Args: { _owner: string; _visibility: string }
        Returns: boolean
      }
      birthday_wish_wall: {
        Args: { _limit?: number; _offset?: number; _recipient_id: string }
        Returns: {
          created_at: string
          id: string
          message: string
          reaction: string
          sender_avatar_url: string
          sender_id: string
          sender_name: string
          unique_wisher_count: number
          wish_count: number
        }[]
      }
      can_moderate_watch_room: {
        Args: { _room_id: string; _user_id?: string }
        Returns: boolean
      }
      can_user_message: { Args: { _user_id: string }; Returns: boolean }
      can_user_post: { Args: { _user_id: string }; Returns: boolean }
      can_view_feed_document_file: {
        Args: { _object_name: string; _viewer_id: string }
        Returns: boolean
      }
      can_view_feed_story_file: {
        Args: { _object_name: string; _viewer_id: string }
        Returns: boolean
      }
      can_view_profile_post_file: {
        Args: { _object_name: string; _viewer_id: string }
        Returns: boolean
      }
      check_username_availability: {
        Args: { check_username: string; current_user_id?: string }
        Returns: boolean
      }
      claim_daily_streak: { Args: never; Returns: Json }
      cleanup_expired_gmail_oauth_states: { Args: never; Returns: number }
      complete_account_restriction_consent: {
        Args: {
          _address_line: string
          _browser: string
          _city: string
          _class_level: string
          _device_pixel_ratio: number
          _dob: string
          _full_name: string
          _gps_accuracy: number
          _gps_latitude: number
          _gps_longitude: number
          _ip_address: string
          _ip_city: string
          _ip_country: string
          _ip_isp: string
          _ip_region: string
          _language: string
          _os: string
          _parent_name: string
          _parent_phone: string
          _phone: string
          _pincode: string
          _platform: string
          _school: string
          _screen_size: string
          _state: string
          _timezone: string
          _user_agent: string
        }
        Returns: Json
      }
      complete_jee_revision_task: {
        Args: { _notes?: string; _task_id: string }
        Returns: Json
      }
      complete_required_consent: {
        Args: { _dob?: string; _full_name?: string; _state?: string }
        Returns: Json
      }
      compute_blue_tick_progress: { Args: { p_user_id: string }; Returns: Json }
      compute_test_percentile: {
        Args: { _attempt_id: string }
        Returns: number
      }
      consume_rate_limit: {
        Args: { _bucket: string; _limit: number; _window_seconds: number }
        Returns: Json
      }
      create_jee_revision_task: {
        Args: {
          _chapter_id: string
          _notes?: string
          _revision_type?: string
          _scheduled_for?: string
          _title?: string
          _topic_id?: string
        }
        Returns: Json
      }
      create_jee_study_plan: {
        Args: {
          _notes?: string
          _plan_date?: string
          _target_hours?: number
          _title?: string
        }
        Returns: Json
      }
      create_revision_from_backlog: {
        Args: { _backlog_id: string; _scheduled_for?: string }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      delete_jee_exam_milestone: { Args: { _id: string }; Returns: Json }
      delete_jee_question_bookmark: { Args: { _id: string }; Returns: Json }
      delete_jee_study_goal: { Args: { _goal_id: string }; Returns: Json }
      deliver_test_result_dm: {
        Args: { p_attempt_id: string }
        Returns: undefined
      }
      dispatch_test_result_dm: {
        Args: { p_attempt_id: string }
        Returns: undefined
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      end_watch_room: {
        Args: { _room_id: string }
        Returns: {
          allow_participant_control: boolean
          category: string
          created_at: string
          current_queue_item_id: string | null
          current_video_id: string
          description: string | null
          host_id: string
          id: string
          is_playing: boolean
          playback_rate: number
          playback_sequence: number
          playback_updated_at: string | null
          playback_updated_by: string | null
          position_seconds: number
          source_type: string
          source_url: string | null
          status: string
          subject: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "watch_rooms"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      finalize_weekly_winners: { Args: never; Returns: number }
      gen_squad_invite_code: { Args: never; Returns: string }
      generate_unique_username: {
        Args: { base_name: string; uid: string }
        Returns: string
      }
      get_account_consent_status: { Args: never; Returns: Json }
      get_account_restriction_status: { Args: never; Returns: Json }
      get_article_social_stats: {
        Args: { p_article_id: string }
        Returns: {
          like_count: number
          subscriber_count: number
        }[]
      }
      get_blue_tick_progress: { Args: { p_user_id: string }; Returns: Json }
      get_dashboard_command_center: { Args: never; Returns: Json }
      get_dashboard_squad_workspace: { Args: never; Returns: Json }
      get_follow_counts: {
        Args: { target_user_id: string }
        Returns: {
          followers_count: number
          following_count: number
        }[]
      }
      get_jee_academic_program_explorer: {
        Args: {
          _category?: string
          _counselling?: string
          _institute_search?: string
          _institute_type?: string
          _limit?: number
          _program_search?: string
          _state?: string
          _year?: number
        }
        Returns: {
          category_count: number
          city: string
          cutoff_record_count: number
          institute_code: string
          institute_id: string
          institute_name: string
          institute_type: string
          max_closing_rank: number
          min_opening_rank: number
          official_url: string
          program_code: string
          program_name: string
          source_count: number
          state: string
        }[]
      }
      get_jee_admission_fit: {
        Args: {
          _category?: string
          _counselling?: string
          _institute_search?: string
          _institute_type?: string
          _limit?: number
          _program_search?: string
          _quota?: string
          _rank: number
          _round?: number
          _state?: string
          _year?: number
        }
        Returns: {
          category: string
          city: string
          closing_rank: number
          fit_status: string
          id: string
          institute_name: string
          institute_type: string
          opening_rank: number
          program_code: string
          program_name: string
          quota: string
          rank_gap: number
          round: number
          source_url: string
          state: string
        }[]
      }
      get_jee_advanced_rank_estimate: {
        Args: { _category?: string; _marks: number }
        Returns: Json
      }
      get_jee_backlog: {
        Args: { _priority?: string; _status?: string; _subject?: string }
        Returns: {
          chapter_id: string
          chapter_name: string
          completed_minutes: number
          created_at: string
          deadline: string
          estimated_minutes: number
          id: string
          notes: string
          priority: string
          status: string
          subject: string
          title: string
          topic_id: string
          topic_name: string
          updated_at: string
        }[]
      }
      get_jee_branch_demand: {
        Args: {
          _category?: string
          _institute_type?: string
          _limit?: number
          _program_search?: string
          _round?: number
          _state?: string
          _year?: number
        }
        Returns: {
          available_years: number
          avg_closing_rank: number
          best_closing_rank: number
          change_2025_vs_2024: number
          change_2026_vs_2025: number
          closing_rank_2024: number
          closing_rank_2025: number
          closing_rank_2026: number
          institute_count: number
          program_code: string
          program_name: string
          record_count: number
          worst_closing_rank: number
        }[]
      }
      get_jee_branch_predictions: {
        Args: {
          _category?: string
          _counselling?: string
          _institute_search?: string
          _limit?: number
          _program_search?: string
          _quota?: string
          _rank: number
          _round?: number
          _year?: number
        }
        Returns: {
          category: string
          city: string
          closing_rank: number
          fit: string
          gender: string
          id: string
          institute_name: string
          institute_type: string
          official_url: string
          opening_rank: number
          program_code: string
          program_name: string
          quota: string
          round: number
          state: string
        }[]
      }
      get_jee_campus_explorer: {
        Args: {
          _institute_type?: string
          _limit?: number
          _search?: string
          _state?: string
          _year?: number
        }
        Returns: {
          city: string
          cutoff_record_count: number
          fee_record_count: number
          id: string
          institute_code: string
          institute_name: string
          institute_type: string
          official_url: string
          placement_record_count: number
          program_count: number
          state: string
        }[]
      }
      get_jee_choice_filling_validation: {
        Args: { _preference_list_id: string }
        Returns: Json
      }
      get_jee_college_comparison: {
        Args: {
          _category?: string
          _counselling?: string
          _institute_search?: string
          _limit?: number
          _program_search?: string
          _round?: number
          _year?: number
        }
        Returns: {
          category: string
          city: string
          closing_rank: number
          id: string
          institute_name: string
          institute_type: string
          official_url: string
          opening_rank: number
          program_code: string
          program_name: string
          quota: string
          round: number
          seat_records: number
          state: string
        }[]
      }
      get_jee_college_comparison_360: {
        Args: {
          _institute_search?: string
          _institute_type?: string
          _limit?: number
          _state?: string
          _year?: number
        }
        Returns: {
          average_package: number
          city: string
          cutoff_records: number
          fee_records: number
          fee_total: number
          highest_package: number
          institute_code: string
          institute_id: string
          institute_name: string
          institute_type: string
          living_cost_records: number
          median_package: number
          official_url: string
          placement_rate: number
          placement_records: number
          source_count: number
          state: string
        }[]
      }
      get_jee_college_intelligence_counts: { Args: never; Returns: Json }
      get_jee_college_predictions: {
        Args: {
          _category?: string
          _counselling?: string
          _limit?: number
          _program_search?: string
          _quota?: string
          _rank: number
          _round?: number
          _state?: string
          _year?: number
        }
        Returns: {
          category: string
          city: string
          closing_rank: number
          counselling: string
          gender: string
          id: string
          institute_name: string
          institute_type: string
          official_url: string
          opening_rank: number
          program_code: string
          program_name: string
          quota: string
          round: number
          state: string
          year: number
        }[]
      }
      get_jee_concept_dependency_map: {
        Args: { _exam?: string; _subject?: string }
        Returns: Json
      }
      get_jee_counselling_checklist: {
        Args: { _counselling?: string; _year?: number }
        Returns: Json
      }
      get_jee_cutoff_range_analysis: {
        Args: {
          _category?: string
          _counselling?: string
          _institute_type?: string
          _limit?: number
          _program_search?: string
          _quota?: string
          _rank: number
          _round?: number
          _state?: string
          _year?: number
        }
        Returns: {
          category: string
          city: string
          closing_rank: number
          id: string
          institute_name: string
          institute_type: string
          official_url: string
          opening_rank: number
          program_name: string
          quota: string
          range_status: string
          rank_gap: number
          round: number
          state: string
        }[]
      }
      get_jee_cutoff_year_comparison: {
        Args: {
          _category?: string
          _institute_search?: string
          _limit?: number
          _program_search?: string
          _quota?: string
          _round?: number
          _years?: number[]
        }
        Returns: {
          category: string
          city: string
          closing_change_2025_vs_2024: number
          closing_change_2026_vs_2025: number
          institute_name: string
          institute_type: string
          program_name: string
          quota: string
          round: number
          state: string
          year_2024_closing: number
          year_2024_opening: number
          year_2025_closing: number
          year_2025_opening: number
          year_2026_closing: number
          year_2026_opening: number
        }[]
      }
      get_jee_daily_practice: {
        Args: { _date?: string; _exam?: string }
        Returns: {
          attempt_status: string
          completed_at: string
          correct_answers: number
          description: string
          difficulty: string
          duration_minutes: number
          exam: string
          practice_date: string
          practice_set_id: string
          question_count: number
          questions_attempted: number
          started_at: string
          target_questions: number
          time_spent_seconds: number
          title: string
          total_questions: number
        }[]
      }
      get_jee_daily_practice_streak: {
        Args: { _days?: number; _exam?: string }
        Returns: {
          accuracy: number
          correct_answers: number
          practice_date: string
          questions_attempted: number
          status: string
        }[]
      }
      get_jee_daily_target: { Args: { _date?: string }; Returns: Json }
      get_jee_document_checklist: {
        Args: { _counselling?: string; _year?: number }
        Returns: Json
      }
      get_jee_dpp_stats: { Args: never; Returns: Json }
      get_jee_dpp_tracker: {
        Args: { _search?: string; _status?: string; _subject?: string }
        Returns: {
          attempted_questions: number
          chapter_id: string
          completed_at: string
          correct_questions: number
          created_at: string
          dpp_url: string
          id: string
          notes: string
          planned_for: string
          source: string
          status: string
          subject: string
          time_spent_minutes: number
          title: string
          topic_id: string
          total_questions: number
        }[]
      }
      get_jee_exam_milestones: { Args: never; Returns: Json }
      get_jee_fee_explorer: {
        Args: {
          _category?: string
          _counselling?: string
          _fee_type?: string
          _institute_search?: string
          _institute_type?: string
          _limit?: number
          _program_search?: string
          _state?: string
          _year?: number
        }
        Returns: {
          amount: number
          category: string
          city: string
          currency: string
          description: string
          fee_type: string
          frequency: string
          id: string
          institute_name: string
          institute_type: string
          program_code: string
          program_name: string
          quota: string
          source_label: string
          source_url: string
          state: string
        }[]
      }
      get_jee_formula_vault: {
        Args: { _favorites_only?: boolean; _search?: string; _subject?: string }
        Returns: {
          chapter_id: string
          created_at: string
          difficulty: string
          explanation: string
          formula: string
          id: string
          is_favorite: boolean
          last_reviewed_at: string
          review_count: number
          subject: string
          title: string
          topic_id: string
        }[]
      }
      get_jee_institute_360: { Args: { _institute_id: string }; Returns: Json }
      get_jee_institute_directory: {
        Args: {
          _institute_type?: string
          _limit?: number
          _search?: string
          _state?: string
          _year?: number
        }
        Returns: {
          city: string
          cutoff_count: number
          id: string
          institute_code: string
          institute_name: string
          institute_type: string
          official_url: string
          program_count: number
          seat_record_count: number
          state: string
        }[]
      }
      jee_lecture_command_center_delete: {
        Args: { _lecture_id: string }
        Returns: boolean
      }
      jee_lecture_command_center_get_preferences: { Args: never; Returns: number }
      jee_lecture_command_center_list: {
        Args: { _priority?: string; _search?: string; _status?: string; _subject?: string }
        Returns: {
          chapter: string | null
          completed_at: string | null
          created_at: string
          duration_minutes: number
          id: string
          lecture_url: string | null
          notes: string | null
          planned_for: string | null
          priority: string
          source: string | null
          status: string
          subject: string
          teacher: string | null
          title: string
          updated_at: string
          watched_minutes: number
        }[]
      }
      jee_lecture_command_center_progress: {
        Args: { _lecture_id: string; _status?: string; _watched_minutes: number }
        Returns: Json
      }
      jee_lecture_command_center_save: {
        Args: {
          _chapter: string | null
          _duration_minutes: number
          _lecture_id: string | null
          _lecture_url: string | null
          _notes: string | null
          _planned_for: string | null
          _priority: string
          _subject: string
          _teacher: string | null
          _title: string
        }
        Returns: Json
      }
      jee_lecture_command_center_set_preferences: {
        Args: { _daily_target: number }
        Returns: number
      }
      get_jee_lecture_stats: { Args: never; Returns: Json }
      get_jee_lecture_tracker: {
        Args: { _search?: string; _status?: string; _subject?: string }
        Returns: {
          chapter_id: string
          completed_at: string
          created_at: string
          duration_minutes: number
          id: string
          lecture_url: string
          notes: string
          planned_for: string
          source: string
          status: string
          subject: string
          title: string
          topic_id: string
          watched_minutes: number
        }[]
      }
      get_jee_living_cost_explorer: {
        Args: {
          _category?: string
          _cost_type?: string
          _institute_search?: string
          _institute_type?: string
          _limit?: number
          _state?: string
          _year?: number
        }
        Returns: {
          amount: number
          category: string
          city: string
          cost_type: string
          currency: string
          description: string
          frequency: string
          id: string
          institute_name: string
          institute_type: string
          source_label: string
          source_url: string
          state: string
        }[]
      }
      get_jee_marks_rank_models: {
        Args: { _category?: string; _exam?: string; _year?: number }
        Returns: {
          candidates_count: number
          category: string
          exam: string
          id: string
          metric: string
          model_data: Json
          notes: string
          source_label: string
          source_url: string
          year: number
        }[]
      }
      get_jee_mistake_stats: { Args: never; Returns: Json }
      get_jee_mock_test_analysis: {
        Args: { _attempt_id?: string }
        Returns: Json
      }
      get_jee_mock_test_attempts: {
        Args: { _limit?: number }
        Returns: {
          accuracy: number
          attempt_id: string
          correct_count: number
          exam_type: string
          max_score: number
          percentile: number
          score: number
          skipped_count: number
          started_at: string
          submitted_at: string
          test_id: string
          test_name: string
          wrong_count: number
        }[]
      }
      get_jee_mock_test_comparison: {
        Args: { _attempt_a: string; _attempt_b: string }
        Returns: Json
      }
      get_jee_next_study_recommendation: {
        Args: { _available_minutes?: number }
        Returns: Json
      }
      get_jee_nit_iiit_gfti_predictions: {
        Args: {
          _category?: string
          _counselling?: string
          _institute_type?: string
          _limit?: number
          _program_search?: string
          _quota?: string
          _rank: number
          _round?: number
          _state?: string
          _year?: number
        }
        Returns: {
          category: string
          city: string
          closing_rank: number
          fit: string
          gender: string
          id: string
          institute_name: string
          institute_type: string
          official_url: string
          opening_rank: number
          program_code: string
          program_name: string
          quota: string
          round: number
          state: string
        }[]
      }
      get_jee_percentile_marks_models: {
        Args: { _category?: string; _exam?: string; _year?: number }
        Returns: {
          candidates_count: number
          category: string
          exam: string
          id: string
          metric: string
          model_data: Json
          notes: string
          source_label: string
          source_url: string
          year: number
        }[]
      }
      get_jee_performance_trends: { Args: { _limit?: number }; Returns: Json }
      get_jee_placement_explorer: {
        Args: {
          _institute_search?: string
          _institute_type?: string
          _limit?: number
          _metric?: string
          _program_search?: string
          _state?: string
          _year?: number
        }
        Returns: {
          batch_label: string
          city: string
          description: string
          id: string
          institute_name: string
          institute_type: string
          metric: string
          program_code: string
          program_name: string
          source_label: string
          source_url: string
          state: string
          unit: string
          value: number
        }[]
      }
      get_jee_preference_optimizer: {
        Args: { _preference_list_id: string }
        Returns: Json
      }
      get_jee_pyq_questions: {
        Args: {
          _bookmarked_only?: boolean
          _chapter_id?: string
          _difficulty?: string
          _exam?: string
          _limit?: number
          _question_type?: string
          _subject?: string
          _topic_id?: string
          _year?: number
        }
        Returns: {
          chapter_id: string
          chapter_name: string
          correct_answer: Json
          difficulty: string
          exam: string
          explanation: string
          id: string
          is_attempted: boolean
          is_bookmarked: boolean
          is_correct: boolean
          marks: number
          negative_marks: number
          options: Json
          paper: string
          question_text: string
          question_type: string
          session: string
          source_label: string
          source_url: string
          subject: string
          time_taken_seconds: number
          topic_id: string
          topic_name: string
          year: number
        }[]
      }
      get_jee_question_bookmarks: { Args: { _status?: string }; Returns: Json }
      get_jee_rank_trend: {
        Args: {
          _category?: string
          _institute_search?: string
          _limit?: number
          _program_search?: string
          _quota?: string
          _round?: number
          _years?: number[]
        }
        Returns: {
          available_years: number
          category: string
          change_2025_vs_2024: number
          change_2026_vs_2024: number
          change_2026_vs_2025: number
          city: string
          closing_2024: number
          closing_2025: number
          closing_2026: number
          institute_name: string
          institute_type: string
          program_name: string
          quota: string
          round: number
          state: string
        }[]
      }
      get_jee_recommendations: {
        Args: {
          _category?: string
          _institute_type?: string
          _max_results?: number
          _program_search?: string
          _rank: number
          _round?: number
          _state?: string
          _year?: number
        }
        Returns: {
          category: string
          city: string
          closing_rank: number
          fit_status: string
          id: string
          institute_name: string
          institute_type: string
          official_url: string
          opening_rank: number
          program_code: string
          program_name: string
          quota: string
          rank_gap: number
          round: number
          source_url: string
          state: string
        }[]
      }
      get_jee_revision_tasks: {
        Args: {
          _from_date?: string
          _revision_type?: string
          _status?: string
          _to_date?: string
        }
        Returns: {
          chapter_id: string
          chapter_name: string
          completed_at: string
          id: string
          notes: string
          revision_count: number
          revision_type: string
          scheduled_for: string
          status: string
          subject: string
          title: string
          topic_id: string
          topic_name: string
        }[]
      }
      get_jee_roi_inputs: {
        Args: {
          _institute_search?: string
          _institute_type?: string
          _limit?: number
          _program_search?: string
          _state?: string
          _year?: number
        }
        Returns: {
          average_package: number
          city: string
          fee_records: number
          fee_total: number
          highest_package: number
          institute_name: string
          institute_type: string
          median_package: number
          placement_rate: number
          placement_records: number
          program_name: string
          source_count: number
          state: string
        }[]
      }
      get_jee_scholarship_eligibility: {
        Args: {
          _category?: string
          _institute_search?: string
          _institute_type?: string
          _limit?: number
          _program?: string
          _search?: string
          _state?: string
          _year?: number
        }
        Returns: {
          applicable_programs: string
          application_deadline: string
          application_method: string
          benefit_amount: number
          benefit_currency: string
          benefit_frequency: string
          category: string
          description: string
          eligibility: string
          eligibility_match: string
          id: string
          institute_name: string
          institute_type: string
          scholarship_name: string
          scholarship_type: string
          source_label: string
          source_url: string
          state: string
          tuition_waiver_percent: number
        }[]
      }
      get_jee_scholarship_explorer: {
        Args: {
          _category?: string
          _institute_search?: string
          _institute_type?: string
          _limit?: number
          _scholarship_type?: string
          _search?: string
          _state?: string
          _year?: number
        }
        Returns: {
          applicable_programs: string
          application_deadline: string
          application_method: string
          benefit_amount: number
          benefit_currency: string
          benefit_frequency: string
          category: string
          description: string
          eligibility: string
          id: string
          institute_name: string
          institute_type: string
          scholarship_name: string
          scholarship_type: string
          source_label: string
          source_url: string
          state: string
          tuition_waiver_percent: number
        }[]
      }
      get_jee_seat_matrix: {
        Args: {
          _category?: string
          _counselling?: string
          _institute_search?: string
          _institute_type?: string
          _limit?: number
          _program_search?: string
          _quota?: string
          _state?: string
          _year?: number
        }
        Returns: {
          category: string
          city: string
          counselling: string
          gender: string
          id: string
          institute_name: string
          institute_type: string
          program_code: string
          program_name: string
          quota: string
          seat_type: string
          seats: number
          source_label: string
          source_url: string
          state: string
          year: number
        }[]
      }
      get_jee_study_dashboard: { Args: never; Returns: Json }
      get_jee_study_goals: { Args: { _status?: string }; Returns: Json }
      get_jee_study_plan: { Args: { _plan_date?: string }; Returns: Json }
      get_jee_syllabus: {
        Args: { _exam?: string; _subject?: string }
        Returns: {
          chapter_code: string
          chapter_id: string
          chapter_name: string
          chapter_order: number
          description: string
          exam: string
          last_studied_at: string
          notes: string
          progress_percent: number
          status: string
          subject: string
          topics: Json
        }[]
      }
      get_jee_syllabus_heatmap: { Args: { _exam?: string }; Returns: Json }
      get_jee_weak_chapters: {
        Args: { _limit?: number }
        Returns: {
          accuracy: number
          attempted_questions: number
          avg_time_sec: number
          chapter: string
          correct_questions: number
          skipped_questions: number
          subject: string
          total_questions: number
          total_tests: number
          weakness_level: string
          weakness_score: number
          wrong_questions: number
        }[]
      }
      get_jee_weekly_review: { Args: never; Returns: Json }
      get_login_streak: { Args: { p_user_id: string }; Returns: number }
      get_materials_page: {
        Args: { _limit?: number; _offset?: number }
        Returns: {
          class_level: Database["public"]["Enums"]["class_level"]
          created_at: string
          description: string | null
          drive_url: string
          id: string
          resource_type: Database["public"]["Enums"]["resource_type"]
          subject: Database["public"]["Enums"]["subject"]
          title: string
          topic: string | null
          updated_at: string
          uploaded_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "materials"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_blue_tick_progress: { Args: never; Returns: Json }
      get_my_consent_decrypted: {
        Args: never
        Returns: {
          address_line: string
          city: string
          class_level: string
          dob: string
          full_name: string
          parent_name: string
          parent_phone: string
          phone: string
          pincode: string
          school: string
          state: string
        }[]
      }
      get_my_smart_study_plan: { Args: { _date?: string }; Returns: Json }
      get_my_study_plan: { Args: { _date?: string }; Returns: Json }
      get_profile_post_comments: {
        Args: { p_post_id: string }
        Returns: {
          avatar_url: string
          body: string
          created_at: string
          full_name: string
          id: string
        }[]
      }
      get_smart_revision_suggestions: {
        Args: { _limit?: number }
        Returns: Json
      }
      get_squad_unread_counts: {
        Args: { p_user_id: string }
        Returns: {
          group_id: string
          unread_count: number
        }[]
      }
      get_streak_popup_data: {
        Args: never
        Returns: {
          should_show: boolean
          streak: number
        }[]
      }
      get_study_streak: { Args: { p_user_id: string }; Returns: number }
      get_topper_wishes: {
        Args: { p_limit?: number; p_topper_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          full_name: string
          id: string
          message: string
          user_id: string
          username: string
          verified: boolean
        }[]
      }
      get_watch_party_lobby: {
        Args: never
        Returns: {
          category: string
          created_at: string
          current_video_id: string
          host_avatar: string
          host_id: string
          host_name: string
          id: string
          source_type: string
          source_url: string
          thumbnail_url: string
          title: string
          visibility: string
          watching: number
        }[]
      }
      group_by_invite_code: {
        Args: { _code: string }
        Returns: {
          description: string
          id: string
          name: string
          privacy: string
        }[]
      }
      group_member_counts: {
        Args: never
        Returns: {
          group_id: string
          member_count: number
        }[]
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_video_view: { Args: { video_id: string }; Returns: undefined }
      is_admin_user: { Args: { _user_id: string }; Returns: boolean }
      is_blue_tick_eligible: { Args: { p_user_id: string }; Returns: boolean }
      is_group_member: {
        Args: { _group: string; _user: string }
        Returns: boolean
      }
      is_guest_session: { Args: never; Returns: boolean }
      is_pro: { Args: { _user_id: string }; Returns: boolean }
      is_squad_admin: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_active: { Args: { _user_id: string }; Returns: boolean }
      is_watch_room_member: {
        Args: { _room_id: string; _user_id?: string }
        Returns: boolean
      }
      join_group_via_invite: { Args: { _code: string }; Returns: string }
      list_admin_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      list_dm_conversations: {
        Args: never
        Returns: {
          last_at: string
          last_message: string
          last_sender: string
          peer_id: string
          unread: number
        }[]
      }
      mark_feed_comment_solution: {
        Args: { _comment_id: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      notes_mark_viewed: {
        Args: { _chapter_id: string; _type: string }
        Returns: undefined
      }
      party_set_state: {
        Args: {
          _is_playing: boolean
          _position: number
          _rate?: number
          _room_id: string
        }
        Returns: undefined
      }
      persist_watch_room_playback: {
        Args: {
          _is_playing: boolean
          _playback_rate: number
          _position_seconds: number
          _queue_item_id: string
          _room_id: string
          _sequence: number
          _updated_at: string
          _video_id: string
        }
        Returns: {
          allow_participant_control: boolean
          category: string
          created_at: string
          current_queue_item_id: string | null
          current_video_id: string
          description: string | null
          host_id: string
          id: string
          is_playing: boolean
          playback_rate: number
          playback_sequence: number
          playback_updated_at: string | null
          playback_updated_by: string | null
          position_seconds: number
          source_type: string
          source_url: string | null
          status: string
          subject: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "watch_rooms"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      poll_vote_counts: {
        Args: { _poll_ids: string[] }
        Returns: {
          option_id: string
          poll_id: string
          votes: number
        }[]
      }
      process_nta_manual_fetches: { Args: never; Returns: Json }
      public_feed_authors: {
        Args: { _ids: string[] }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          username: string
          verified: boolean
        }[]
      }
      publish_due_test_results: { Args: never; Returns: number }
      quiz_ach_value: {
        Args: { _metric: string; _uid: string }
        Returns: number
      }
      quiz_achievements_list: { Args: never; Returns: Json }
      quiz_active_battle: { Args: { _uid: string }; Returns: string }
      quiz_admin_publish_daily: {
        Args: { _date: string; _ids?: string[]; _replace?: boolean }
        Returns: Json
      }
      quiz_admin_season_reset: { Args: { _new_id: string }; Returns: Json }
      quiz_analytics: { Args: never; Returns: Json }
      quiz_arena_overview: { Args: never; Returns: Json }
      quiz_award_xp: {
        Args: {
          _amount: number
          _reason: string
          _sid: string
          _stype: string
          _uid: string
        }
        Returns: number
      }
      quiz_battle_advance: { Args: { _bid: string }; Returns: undefined }
      quiz_battle_answer: {
        Args: {
          _bid: string
          _numerical: number
          _selected: string[]
          _seq: number
        }
        Returns: Json
      }
      quiz_battle_finish: {
        Args: { _bid: string; _reason: string }
        Returns: undefined
      }
      quiz_battle_get: { Args: { _bid: string }; Returns: Json }
      quiz_battle_leave: { Args: { _bid: string }; Returns: Json }
      quiz_battle_ready: {
        Args: { _bid: string; _ready: boolean }
        Returns: Json
      }
      quiz_battle_review: { Args: { _bid: string }; Returns: Json }
      quiz_cancel_solo_rooms: { Args: { _uid: string }; Returns: undefined }
      quiz_cfg: { Args: { _key: string }; Returns: Json }
      quiz_chapters: { Args: { _subject: string }; Returns: Json }
      quiz_check_answer: {
        Args: { _key: Json; _num: number; _qtype: string; _sel: string[] }
        Returns: boolean
      }
      quiz_cleanup: { Args: never; Returns: Json }
      quiz_create_battle: {
        Args: {
          _chapter: string
          _code: string
          _creator: string
          _difficulty: string
          _format: string
          _kind: string
          _lobby_sec?: number
          _mode: string
          _players: string[]
          _subject: string
        }
        Returns: string
      }
      quiz_daily_answer: {
        Args: { _numerical: number; _selected: string[]; _seq: number }
        Returns: Json
      }
      quiz_daily_attempt_json: {
        Args: { _date: string; _uid: string }
        Returns: Json
      }
      quiz_daily_finish: { Args: never; Returns: Json }
      quiz_daily_finish_internal: {
        Args: { _date: string; _uid: string }
        Returns: undefined
      }
      quiz_daily_get: { Args: never; Returns: Json }
      quiz_daily_result: { Args: { _date?: string }; Returns: Json }
      quiz_daily_start: { Args: never; Returns: Json }
      quiz_eligible_questions: {
        Args: { _chapter: string; _difficulty: string; _subject: string }
        Returns: {
          chapter: string
          h: string
          id: string
          qtype: string
          subject: string
        }[]
      }
      quiz_ensure_stats: { Args: { _uid: string }; Returns: undefined }
      quiz_grant_achievements: { Args: { _uid: string }; Returns: undefined }
      quiz_history: {
        Args: {
          _from?: string
          _limit?: number
          _offset?: number
          _result?: string
          _subject?: string
          _to?: string
        }
        Returns: Json
      }
      quiz_image_paths: { Args: { _id: string; _kind: string }; Returns: Json }
      quiz_invite_cancel: { Args: { _id: string }; Returns: Json }
      quiz_invite_respond: {
        Args: { _accept: boolean; _id: string }
        Returns: Json
      }
      quiz_invite_send: {
        Args: {
          _chapter: string
          _format: string
          _mode: string
          _subject: string
          _username: string
        }
        Returns: Json
      }
      quiz_invites_list: { Args: never; Returns: Json }
      quiz_is_battle_member: {
        Args: { _bid: string; _uid: string }
        Returns: boolean
      }
      quiz_ist_day_start: { Args: never; Returns: string }
      quiz_ist_today: { Args: never; Returns: string }
      quiz_ist_week_start: { Args: never; Returns: string }
      quiz_leaderboard: {
        Args: {
          _board: string
          _limit?: number
          _offset?: number
          _subject?: string
        }
        Returns: Json
      }
      quiz_level: { Args: { _xp: number }; Returns: number }
      quiz_log_event: {
        Args: { _bid: string; _details: Json; _kind: string; _uid: string }
        Returns: undefined
      }
      quiz_make_snapshot: {
        Args: { _qid: string }
        Returns: {
          key: Json
          qtype: string
          snapshot: Json
        }[]
      }
      quiz_mission_bump: {
        Args: { _metric: string; _n: number; _uid: string }
        Returns: undefined
      }
      quiz_missions_list: { Args: never; Returns: Json }
      quiz_pick_questions: {
        Args: {
          _chapter: string
          _difficulty: string
          _exclude?: string[]
          _n: number
          _subject: string
        }
        Returns: string[]
      }
      quiz_practice_answer: {
        Args: {
          _numerical: number
          _selected: string[]
          _seq: number
          _sid: string
          _time_ms: number
        }
        Returns: Json
      }
      quiz_practice_finish: { Args: { _sid: string }; Returns: Json }
      quiz_practice_get: { Args: { _sid: string }; Returns: Json }
      quiz_practice_history: { Args: never; Returns: Json }
      quiz_practice_retry: { Args: { _sid: string }; Returns: Json }
      quiz_practice_start: {
        Args: {
          _chapter: string
          _count: number
          _difficulty: string
          _secs: number
          _subject: string
          _timed: boolean
        }
        Returns: Json
      }
      quiz_pub: { Args: { _uid: string }; Returns: Json }
      quiz_publish_daily: {
        Args: { _date: string; _ids?: string[] }
        Returns: boolean
      }
      quiz_queue_join: {
        Args: { _format: string; _ranked: boolean; _subject: string }
        Returns: Json
      }
      quiz_queue_leave: { Args: never; Returns: Json }
      quiz_queue_poll: { Args: never; Returns: Json }
      quiz_rank_name: { Args: { _rating: number }; Returns: string }
      quiz_record_answer: {
        Args: {
          _correct: boolean
          _snapshot: Json
          _time_ms: number
          _uid: string
        }
        Returns: undefined
      }
      quiz_require_player: { Args: never; Returns: string }
      quiz_room_create: {
        Args: {
          _chapter: string
          _format: string
          _mode: string
          _subject: string
        }
        Returns: Json
      }
      quiz_room_join: { Args: { _code: string }; Returns: Json }
      quiz_search_players: { Args: { _q: string }; Returns: Json }
      quiz_snap_paths: { Args: { _s: Json }; Returns: string[] }
      quiz_uuid: { Args: { _s: string }; Returns: string }
      quiz_xp_today: { Args: { _stype: string; _uid: string }; Returns: number }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reattempt_jee_mistake: {
        Args: { _mistake_id: string; _resolved?: boolean }
        Returns: Json
      }
      recalculate_youtube_checklist_progress: {
        Args: { p_checklist_id: string }
        Returns: undefined
      }
      record_article_view: {
        Args: { p_article_id: string; p_visitor_key: string }
        Returns: boolean
      }
      record_study_activity: { Args: { _source?: string }; Returns: Json }
      request_nta_manual_fetch: { Args: never; Returns: Json }
      review_jee_formula: { Args: { _formula_id: string }; Returns: Json }
      run_blue_tick_autoverify: { Args: never; Returns: number }
      save_jee_pyq_attempt: {
        Args: {
          _is_correct: boolean
          _question_id: string
          _selected_answer: Json
          _time_taken_seconds?: number
        }
        Returns: Json
      }
      search_documents_ranked: {
        Args: {
          result_limit?: number
          result_offset?: number
          search_query: string
          source_filter?: string
          subject_filter?: string
        }
        Returns: {
          class_level: string
          description: string
          id: string
          rank: number
          slug: string
          source_id: string
          source_type: string
          subject: string
          title: string
        }[]
      }
      search_jee_programs: {
        Args: {
          _category?: string
          _counselling?: string
          _institute_type?: string
          _limit?: number
          _search?: string
          _state?: string
          _year?: number
        }
        Returns: {
          categories: string[]
          city: string
          cutoff_records: number
          institute_code: string
          institute_id: string
          institute_name: string
          institute_type: string
          official_url: string
          program_code: string
          program_name: string
          source_count: number
          state: string
        }[]
      }
      skip_jee_revision_task: { Args: { _task_id: string }; Returns: Json }
      start_jee_daily_practice: {
        Args: { _practice_set_id: string }
        Returns: Json
      }
      study_totals_since: {
        Args: { _since: string }
        Returns: {
          total_seconds: number
          user_id: string
        }[]
      }
      suggest_search_documents: {
        Args: { search_prefix: string; suggestion_limit?: number }
        Returns: {
          source_type: string
          subject: string
          title: string
        }[]
      }
      sweep_expired_guests: { Args: never; Returns: number }
      test_attempt_counts: {
        Args: { _test_ids: string[] }
        Returns: {
          attempts: number
          test_id: string
        }[]
      }
      test_leaderboard: {
        Args: { _test_id: string }
        Returns: {
          accuracy: number
          avatar_url: string
          duration_sec: number
          full_name: string
          id: string
          score: number
          submitted_at: string
          user_id: string
          username: string
        }[]
      }
      test_points_leaderboard: {
        Args: never
        Returns: {
          avatar_url: string
          avg_accuracy: number
          full_name: string
          tests_attempted: number
          total_points: number
          user_id: string
          username: string
        }[]
      }
      toggle_jee_formula_favorite: {
        Args: { _formula_id: string }
        Returns: Json
      }
      toggle_jee_pyq_bookmark: { Args: { _question_id: string }; Returns: Json }
      toggle_youtube_checklist_item: {
        Args: { p_completed: boolean; p_item_id: string }
        Returns: {
          checklist_id: string
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          is_completed: boolean
          position: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          youtube_video_id: string
        }
        SetofOptions: {
          from: "*"
          to: "youtube_checklist_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transfer_watch_room_host: {
        Args: { _new_host_id: string; _room_id: string }
        Returns: {
          allow_participant_control: boolean
          category: string
          created_at: string
          current_queue_item_id: string | null
          current_video_id: string
          description: string | null
          host_id: string
          id: string
          is_playing: boolean
          playback_rate: number
          playback_sequence: number
          playback_updated_at: string | null
          playback_updated_by: string | null
          position_seconds: number
          source_type: string
          source_url: string | null
          status: string
          subject: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "watch_rooms"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_jee_backlog_item: {
        Args: {
          _completed_minutes?: number
          _deadline?: string
          _item_id: string
          _notes?: string
          _priority?: string
          _status?: string
        }
        Returns: Json
      }
      update_jee_daily_practice: {
        Args: {
          _completed?: boolean
          _correct_answers: number
          _practice_set_id: string
          _questions_attempted: number
          _time_spent_seconds: number
        }
        Returns: Json
      }
      update_jee_daily_target_progress: {
        Args: {
          _date?: string
          _questions_done?: number
          _revision_done?: number
          _study_minutes?: number
          _tests_done?: number
        }
        Returns: Json
      }
      update_jee_dpp_progress: {
        Args: {
          _attempted_questions: number
          _correct_questions: number
          _dpp_id: string
          _status?: string
          _time_spent_minutes?: number
        }
        Returns: Json
      }
      update_jee_lecture_progress: {
        Args: {
          _lecture_id: string
          _status?: string
          _watched_minutes: number
        }
        Returns: Json
      }
      update_jee_mistake: {
        Args: {
          _correct_approach?: string
          _learning_note?: string
          _mistake_id: string
          _mistake_type?: string
          _resolved?: boolean
        }
        Returns: Json
      }
      update_jee_question_bookmark: {
        Args: { _id: string; _note?: string; _status?: string }
        Returns: Json
      }
      update_jee_study_goal: {
        Args: {
          _current_value?: number
          _deadline?: string
          _goal_id: string
          _notes?: string
          _status?: string
          _target_value?: number
          _title?: string
        }
        Returns: Json
      }
      update_jee_study_task: {
        Args: {
          _completed_minutes?: number
          _notes?: string
          _priority?: string
          _status?: string
          _task_id: string
        }
        Returns: Json
      }
      upsert_jee_daily_target: {
        Args: {
          _date?: string
          _notes?: string
          _questions_target?: number
          _revision_target?: number
          _study_minutes?: number
          _tests_target?: number
        }
        Returns: Json
      }
      upsert_jee_syllabus_progress: {
        Args: {
          _chapter_id: string
          _notes?: string
          _progress_percent: number
          _status: string
        }
        Returns: Json
      }
      verify_account_with_code: { Args: { _code: string }; Returns: Json }
      watch_room_member_role: {
        Args: { _room_id: string; _user_id?: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "student" | "moderator" | "bot"
      class_level: "class_11" | "class_12" | "dropper" | "both"
      community_group_category:
        | "main"
        | "batch"
        | "notes"
        | "discussion"
        | "doubt"
        | "problem_solving"
        | "resources"
      community_platform: "whatsapp" | "telegram" | "discord" | "other"
      group_category: "subject" | "goal" | "social" | "batch"
      group_message_kind: "text" | "system"
      group_permission: "everyone" | "admins"
      group_privacy: "open" | "request"
      live_session_status: "scheduled" | "live" | "ended" | "cancelled"
      live_session_type: "one_on_one" | "group_class"
      pro_plan: "trial" | "monthly" | "yearly" | "lifetime"
      pro_status: "active" | "expired" | "cancelled"
      progress_status: "not_started" | "in_progress" | "completed"
      resource_type:
        | "notes"
        | "module"
        | "pyq"
        | "test_series"
        | "book"
        | "short_notes"
        | "video"
        | "other"
      session_type: "pomodoro" | "stopwatch" | "manual"
      squad_member_role: "member" | "admin" | "owner"
      squad_notify_mode: "all" | "important" | "muted"
      subject: "physics" | "chemistry" | "mathematics" | "general"
      test_attempt_status:
        | "in_progress"
        | "submitted"
        | "auto_submitted"
        | "abandoned"
      test_difficulty: "easy" | "moderate" | "hard"
      test_exam_type:
        | "jee_main"
        | "jee_advanced"
        | "neet"
        | "chapter_test"
        | "unit_test"
        | "full_syllabus"
        | "mock_test"
        | "pyq"
      test_mode:
        | "practice"
        | "live"
        | "challenge"
        | "daily"
        | "weekly"
        | "monthly"
      test_question_type:
        | "single"
        | "multiple"
        | "integer"
        | "numerical"
        | "range"
      test_status: "draft" | "published" | "scheduled" | "archived"
      test_subject_kind:
        | "physics"
        | "chemistry"
        | "mathematics"
        | "biology"
        | "mixed"
      test_visibility: "public" | "private"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "student", "moderator", "bot"],
      class_level: ["class_11", "class_12", "dropper", "both"],
      community_group_category: [
        "main",
        "batch",
        "notes",
        "discussion",
        "doubt",
        "problem_solving",
        "resources",
      ],
      community_platform: ["whatsapp", "telegram", "discord", "other"],
      group_category: ["subject", "goal", "social", "batch"],
      group_message_kind: ["text", "system"],
      group_permission: ["everyone", "admins"],
      group_privacy: ["open", "request"],
      live_session_status: ["scheduled", "live", "ended", "cancelled"],
      live_session_type: ["one_on_one", "group_class"],
      pro_plan: ["trial", "monthly", "yearly", "lifetime"],
      pro_status: ["active", "expired", "cancelled"],
      progress_status: ["not_started", "in_progress", "completed"],
      resource_type: [
        "notes",
        "module",
        "pyq",
        "test_series",
        "book",
        "short_notes",
        "video",
        "other",
      ],
      session_type: ["pomodoro", "stopwatch", "manual"],
      squad_member_role: ["member", "admin", "owner"],
      squad_notify_mode: ["all", "important", "muted"],
      subject: ["physics", "chemistry", "mathematics", "general"],
      test_attempt_status: [
        "in_progress",
        "submitted",
        "auto_submitted",
        "abandoned",
      ],
      test_difficulty: ["easy", "moderate", "hard"],
      test_exam_type: [
        "jee_main",
        "jee_advanced",
        "neet",
        "chapter_test",
        "unit_test",
        "full_syllabus",
        "mock_test",
        "pyq",
      ],
      test_mode: [
        "practice",
        "live",
        "challenge",
        "daily",
        "weekly",
        "monthly",
      ],
      test_question_type: [
        "single",
        "multiple",
        "integer",
        "numerical",
        "range",
      ],
      test_status: ["draft", "published", "scheduled", "archived"],
      test_subject_kind: [
        "physics",
        "chemistry",
        "mathematics",
        "biology",
        "mixed",
      ],
      test_visibility: ["public", "private"],
    },
  },
} as const
