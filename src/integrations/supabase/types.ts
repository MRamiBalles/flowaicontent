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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          developer_id: string
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          scopes: string[] | null
          total_requests: number | null
        }
        Insert: {
          created_at?: string | null
          developer_id: string
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          scopes?: string[] | null
          total_requests?: number | null
        }
        Update: {
          created_at?: string | null
          developer_id?: string
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          scopes?: string[] | null
          total_requests?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developer_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_logs: {
        Row: {
          api_key_id: string
          created_at: string | null
          credits_consumed: number | null
          endpoint: string
          id: string
          method: string
          response_time_ms: number | null
          status_code: number | null
        }
        Insert: {
          api_key_id: string
          created_at?: string | null
          credits_consumed?: number | null
          endpoint: string
          id?: string
          method: string
          response_time_ms?: number | null
          status_code?: number | null
        }
        Update: {
          api_key_id?: string
          created_at?: string | null
          credits_consumed?: number | null
          endpoint?: string
          id?: string
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_campaigns: {
        Row: {
          brand_id: string
          budget_per_creator: number
          content_deadline: string | null
          content_type: string
          created_at: string | null
          description: string | null
          id: string
          min_followers: number | null
          status: string | null
          target_niches: string[] | null
          title: string
          total_budget: number | null
          updated_at: string | null
        }
        Insert: {
          brand_id: string
          budget_per_creator: number
          content_deadline?: string | null
          content_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          min_followers?: number | null
          status?: string | null
          target_niches?: string[] | null
          title: string
          total_budget?: number | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string
          budget_per_creator?: number
          content_deadline?: string | null
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          min_followers?: number | null
          status?: string | null
          target_niches?: string[] | null
          title?: string
          total_budget?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_deals: {
        Row: {
          agreed_amount_cents: number | null
          campaign_id: string
          created_at: string | null
          creator_id: string
          id: string
          match_score: number | null
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agreed_amount_cents?: number | null
          campaign_id: string
          created_at?: string | null
          creator_id: string
          id?: string
          match_score?: number | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agreed_amount_cents?: number | null
          campaign_id?: string
          created_at?: string | null
          creator_id?: string
          id?: string
          match_score?: number | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_deals_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "brand_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          updated_at: string | null
          user_id: string
          verified: boolean | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          website_url?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      content_licenses: {
        Row: {
          allows_ai_training: boolean | null
          content_id: string
          content_preview_url: string | null
          content_title: string
          content_type: string
          created_at: string | null
          creator_id: string
          duration_days: number | null
          id: string
          is_active: boolean | null
          license_type: string
          price_cents: number
          requires_attribution: boolean | null
          royalty_percentage: number | null
          territory: string[] | null
          total_purchases: number | null
          updated_at: string | null
          usage_rights: string[] | null
        }
        Insert: {
          allows_ai_training?: boolean | null
          content_id: string
          content_preview_url?: string | null
          content_title: string
          content_type: string
          created_at?: string | null
          creator_id: string
          duration_days?: number | null
          id?: string
          is_active?: boolean | null
          license_type: string
          price_cents?: number
          requires_attribution?: boolean | null
          royalty_percentage?: number | null
          territory?: string[] | null
          total_purchases?: number | null
          updated_at?: string | null
          usage_rights?: string[] | null
        }
        Update: {
          allows_ai_training?: boolean | null
          content_id?: string
          content_preview_url?: string | null
          content_title?: string
          content_type?: string
          created_at?: string | null
          creator_id?: string
          duration_days?: number | null
          id?: string
          is_active?: boolean | null
          license_type?: string
          price_cents?: number
          requires_attribution?: boolean | null
          royalty_percentage?: number | null
          territory?: string[] | null
          total_purchases?: number | null
          updated_at?: string | null
          usage_rights?: string[] | null
        }
        Relationships: []
      }
      creator_earnings: {
        Row: {
          amount_cents: number
          created_at: string
          creator_id: string
          id: string
          paid_at: string | null
          payout_method: string | null
          platform_fee_cents: number
          purchase_id: string
          status: string
          style_pack_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          creator_id: string
          id?: string
          paid_at?: string | null
          payout_method?: string | null
          platform_fee_cents: number
          purchase_id: string
          status?: string
          style_pack_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          creator_id?: string
          id?: string
          paid_at?: string | null
          payout_method?: string | null
          platform_fee_cents?: number
          purchase_id?: string
          status?: string
          style_pack_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_earnings_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "style_pack_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_earnings_style_pack_id_fkey"
            columns: ["style_pack_id"]
            isOneToOne: false
            referencedRelation: "user_style_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_media_kits: {
        Row: {
          bio: string | null
          content_niches: string[] | null
          created_at: string | null
          display_name: string
          engagement_rate: number | null
          id: string
          portfolio_urls: string[] | null
          rate_per_post_max: number | null
          rate_per_post_min: number | null
          total_followers: number | null
          updated_at: string | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          bio?: string | null
          content_niches?: string[] | null
          created_at?: string | null
          display_name: string
          engagement_rate?: number | null
          id?: string
          portfolio_urls?: string[] | null
          rate_per_post_max?: number | null
          rate_per_post_min?: number | null
          total_followers?: number | null
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          bio?: string | null
          content_niches?: string[] | null
          created_at?: string | null
          display_name?: string
          engagement_rate?: number | null
          id?: string
          portfolio_urls?: string[] | null
          rate_per_post_max?: number | null
          rate_per_post_min?: number | null
          total_followers?: number | null
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      developer_accounts: {
        Row: {
          api_calls_limit: number | null
          company_name: string | null
          created_at: string | null
          description: string | null
          id: string
          status: string | null
          tier: string | null
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          api_calls_limit?: number | null
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          tier?: string | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          api_calls_limit?: number | null
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount_cents: number
          created_at: string
          donor_id: string
          id: string
          message: string | null
          streamer_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          donor_id: string
          id?: string
          message?: string | null
          streamer_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          donor_id?: string
          id?: string
          message?: string | null
          streamer_id?: string
        }
        Relationships: []
      }
      enterprise_api_keys: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          rate_limit: number | null
          scopes: string[] | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          rate_limit?: number | null
          scopes?: string[] | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          rate_limit?: number | null
          scopes?: string[] | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_api_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "enterprise_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "enterprise_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_tenants: {
        Row: {
          created_at: string | null
          custom_domain: string | null
          features: Json | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
          status: string | null
          updated_at: string | null
          user_limit: number | null
        }
        Insert: {
          created_at?: string | null
          custom_domain?: string | null
          features?: Json | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
          status?: string | null
          updated_at?: string | null
          user_limit?: number | null
        }
        Update: {
          created_at?: string | null
          custom_domain?: string | null
          features?: Json | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
          status?: string | null
          updated_at?: string | null
          user_limit?: number | null
        }
        Relationships: []
      }
      enterprise_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          last_login_at: string | null
          role: string | null
          status: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          role?: string | null
          status?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          role?: string | null
          status?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "enterprise_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          content_text: string
          created_at: string
          id: string
          is_favorite: boolean
          platform: string
          project_id: string
        }
        Insert: {
          content_text: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          platform: string
          project_id: string
        }
        Update: {
          content_text?: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          platform?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_attempts: {
        Row: {
          created_at: string
          id: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_attempts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          metadata: Json | null
          project_id: string | null
          prompt: string | null
          result: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          prompt?: string | null
          result?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          prompt?: string | null
          result?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_proposals: {
        Row: {
          category: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          end_time: string
          id: string
          status: string | null
          title: string
          updated_at: string | null
          votes_against: number | null
          votes_for: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          end_time: string
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
          votes_against?: number | null
          votes_for?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          end_time?: string
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          votes_against?: number | null
          votes_for?: number | null
        }
        Relationships: []
      }
      governance_votes: {
        Row: {
          created_at: string | null
          id: string
          proposal_id: string
          user_id: string
          vote_type: string
          voting_power: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          proposal_id: string
          user_id: string
          vote_type: string
          voting_power?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          proposal_id?: string
          user_id?: string
          vote_type?: string
          voting_power?: number
        }
        Relationships: [
          {
            foreignKeyName: "governance_votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "governance_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      interactive_stories: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          status: string | null
          thumbnail_url: string | null
          title: string
          total_endings: number | null
          total_plays: number | null
          total_scenes: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          status?: string | null
          thumbnail_url?: string | null
          title: string
          total_endings?: number | null
          total_plays?: number | null
          total_scenes?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          total_endings?: number | null
          total_plays?: number | null
          total_scenes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      license_purchases: {
        Row: {
          amount_paid_cents: number
          buyer_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          license_id: string
          license_key: string
          status: string | null
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          amount_paid_cents: number
          buyer_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          license_id: string
          license_key: string
          status?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          amount_paid_cents?: number
          buyer_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          license_id?: string
          license_key?: string
          status?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "license_purchases_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "content_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_devices: {
        Row: {
          created_at: string | null
          device_name: string
          device_token: string | null
          device_type: string
          id: string
          is_active: boolean | null
          last_active_at: string | null
          platform: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_name: string
          device_token?: string | null
          device_type?: string
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          platform?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_name?: string
          device_token?: string | null
          device_type?: string
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          platform?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mobile_sync_events: {
        Row: {
          created_at: string | null
          device_id: string | null
          event_data: Json | null
          event_type: string
          id: string
          synced_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          synced_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          synced_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobile_sync_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "mobile_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_shares: {
        Row: {
          acquired_at: string
          created_at: string
          id: string
          nft_id: string
          owner_address: string
          shares: number
        }
        Insert: {
          acquired_at?: string
          created_at?: string
          id?: string
          nft_id: string
          owner_address: string
          shares: number
        }
        Update: {
          acquired_at?: string
          created_at?: string
          id?: string
          nft_id?: string
          owner_address?: string
          shares?: number
        }
        Relationships: [
          {
            foreignKeyName: "nft_shares_nft_id_fkey"
            columns: ["nft_id"]
            isOneToOne: false
            referencedRelation: "nfts"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_transactions: {
        Row: {
          created_at: string
          from_address: string | null
          id: string
          nft_id: string
          price_matic: number | null
          shares: number
          to_address: string
          transaction_hash: string
          transaction_type: string
        }
        Insert: {
          created_at?: string
          from_address?: string | null
          id?: string
          nft_id: string
          price_matic?: number | null
          shares: number
          to_address: string
          transaction_hash: string
          transaction_type: string
        }
        Update: {
          created_at?: string
          from_address?: string | null
          id?: string
          nft_id?: string
          price_matic?: number | null
          shares?: number
          to_address?: string
          transaction_hash?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "nft_transactions_nft_id_fkey"
            columns: ["nft_id"]
            isOneToOne: false
            referencedRelation: "nfts"
            referencedColumns: ["id"]
          },
        ]
      }
      nfts: {
        Row: {
          contract_address: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          minted_at: string
          network: string
          title: string
          token_id: number
          total_shares: number
          transaction_hash: string
          user_id: string
          video_id: string
        }
        Insert: {
          contract_address: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          minted_at?: string
          network?: string
          title: string
          token_id: number
          total_shares?: number
          transaction_hash: string
          user_id: string
          video_id: string
        }
        Update: {
          contract_address?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          minted_at?: string
          network?: string
          title?: string
          token_id?: number
          total_shares?: number
          transaction_hash?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          flow_points: number
          full_name: string | null
          id: string
          total_minutes_watched: number
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          flow_points?: number
          full_name?: string | null
          id: string
          total_minutes_watched?: number
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          flow_points?: number
          full_name?: string | null
          id?: string
          total_minutes_watched?: number
          username?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          id: string
          original_text: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_text: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          original_text?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_choices: {
        Row: {
          choice_color: string | null
          choice_order: number | null
          choice_text: string
          created_at: string | null
          id: string
          next_scene_id: string | null
          scene_id: string
        }
        Insert: {
          choice_color?: string | null
          choice_order?: number | null
          choice_text: string
          created_at?: string | null
          id?: string
          next_scene_id?: string | null
          scene_id: string
        }
        Update: {
          choice_color?: string | null
          choice_order?: number | null
          choice_text?: string
          created_at?: string | null
          id?: string
          next_scene_id?: string | null
          scene_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scene_choices_next_scene_id_fkey"
            columns: ["next_scene_id"]
            isOneToOne: false
            referencedRelation: "story_scenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scene_choices_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "story_scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      staking_pools: {
        Row: {
          apy_percentage: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          lock_period_days: number
          min_stake_amount: number
          name: string
          total_staked: number | null
          updated_at: string | null
        }
        Insert: {
          apy_percentage?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lock_period_days?: number
          min_stake_amount?: number
          name: string
          total_staked?: number | null
          updated_at?: string | null
        }
        Update: {
          apy_percentage?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lock_period_days?: number
          min_stake_amount?: number
          name?: string
          total_staked?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      story_scenes: {
        Row: {
          choice_appears_at_seconds: number | null
          choice_timeout_seconds: number | null
          created_at: string | null
          ending_type: string | null
          id: string
          name: string
          order_index: number | null
          scene_type: string | null
          story_id: string
          video_duration_seconds: number | null
          video_url: string | null
        }
        Insert: {
          choice_appears_at_seconds?: number | null
          choice_timeout_seconds?: number | null
          created_at?: string | null
          ending_type?: string | null
          id?: string
          name: string
          order_index?: number | null
          scene_type?: string | null
          story_id: string
          video_duration_seconds?: number | null
          video_url?: string | null
        }
        Update: {
          choice_appears_at_seconds?: number | null
          choice_timeout_seconds?: number | null
          created_at?: string | null
          ending_type?: string | null
          id?: string
          name?: string
          order_index?: number | null
          scene_type?: string | null
          story_id?: string
          video_duration_seconds?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_scenes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "interactive_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      style_pack_purchases: {
        Row: {
          buyer_id: string
          id: string
          price_paid_cents: number
          purchased_at: string
          style_pack_id: string
        }
        Insert: {
          buyer_id: string
          id?: string
          price_paid_cents: number
          purchased_at?: string
          style_pack_id: string
        }
        Update: {
          buyer_id?: string
          id?: string
          price_paid_cents?: number
          purchased_at?: string
          style_pack_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "style_pack_purchases_style_pack_id_fkey"
            columns: ["style_pack_id"]
            isOneToOne: false
            referencedRelation: "user_style_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stakes: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          pool_id: string
          rewards_earned: number | null
          staked_at: string | null
          status: string | null
          unlocks_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          id?: string
          pool_id: string
          rewards_earned?: number | null
          staked_at?: string | null
          status?: string | null
          unlocks_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          pool_id?: string
          rewards_earned?: number | null
          staked_at?: string | null
          status?: string | null
          unlocks_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stakes_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "staking_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_style_packs: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          download_count: number
          id: string
          is_active: boolean
          lora_url: string | null
          name: string
          preview_images: string[]
          price_cents: number
          tags: string[]
          training_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          download_count?: number
          id?: string
          is_active?: boolean
          lora_url?: string | null
          name: string
          preview_images?: string[]
          price_cents: number
          tags?: string[]
          training_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          download_count?: number
          id?: string
          is_active?: boolean
          lora_url?: string | null
          name?: string
          preview_images?: string[]
          price_cents?: number
          tags?: string[]
          training_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      video_clips: {
        Row: {
          clip_type: string
          created_at: string | null
          effects: Json | null
          end_frame: number
          id: string
          source_url: string | null
          start_frame: number
          text_content: string | null
          track_id: string
          transform: Json | null
          updated_at: string | null
        }
        Insert: {
          clip_type: string
          created_at?: string | null
          effects?: Json | null
          end_frame: number
          id?: string
          source_url?: string | null
          start_frame: number
          text_content?: string | null
          track_id: string
          transform?: Json | null
          updated_at?: string | null
        }
        Update: {
          clip_type?: string
          created_at?: string | null
          effects?: Json | null
          end_frame?: number
          id?: string
          source_url?: string | null
          start_frame?: number
          text_content?: string | null
          track_id?: string
          transform?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_clips_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "video_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      video_projects: {
        Row: {
          composition_data: Json | null
          created_at: string | null
          duration_frames: number | null
          fps: number | null
          height: number | null
          id: string
          is_template: boolean | null
          name: string
          render_progress: number | null
          render_status: string | null
          rendered_video_url: string | null
          updated_at: string | null
          user_id: string
          width: number | null
        }
        Insert: {
          composition_data?: Json | null
          created_at?: string | null
          duration_frames?: number | null
          fps?: number | null
          height?: number | null
          id?: string
          is_template?: boolean | null
          name?: string
          render_progress?: number | null
          render_status?: string | null
          rendered_video_url?: string | null
          updated_at?: string | null
          user_id: string
          width?: number | null
        }
        Update: {
          composition_data?: Json | null
          created_at?: string | null
          duration_frames?: number | null
          fps?: number | null
          height?: number | null
          id?: string
          is_template?: boolean | null
          name?: string
          render_progress?: number | null
          render_status?: string | null
          rendered_video_url?: string | null
          updated_at?: string | null
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      video_tracks: {
        Row: {
          created_at: string | null
          id: string
          is_locked: boolean | null
          is_muted: boolean | null
          is_visible: boolean | null
          name: string
          order_index: number | null
          project_id: string
          track_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          is_muted?: boolean | null
          is_visible?: boolean | null
          name: string
          order_index?: number | null
          project_id: string
          track_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          is_muted?: boolean | null
          is_visible?: boolean | null
          name?: string
          order_index?: number | null
          project_id?: string
          track_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_tracks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "video_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_clones: {
        Row: {
          created_at: string | null
          description: string | null
          external_voice_id: string | null
          id: string
          language: string | null
          name: string
          sample_audio_url: string | null
          status: string | null
          total_generations: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          external_voice_id?: string | null
          id?: string
          language?: string | null
          name: string
          sample_audio_url?: string | null
          status?: string | null
          total_generations?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          external_voice_id?: string | null
          id?: string
          language?: string | null
          name?: string
          sample_audio_url?: string | null
          status?: string | null
          total_generations?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_credits: {
        Row: {
          available_credits: number | null
          created_at: string | null
          id: string
          monthly_limit: number | null
          monthly_used: number | null
          reset_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_credits?: number | null
          created_at?: string | null
          id?: string
          monthly_limit?: number | null
          monthly_used?: number | null
          reset_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_credits?: number | null
          created_at?: string | null
          id?: string
          monthly_limit?: number | null
          monthly_used?: number | null
          reset_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_generations: {
        Row: {
          audio_url: string | null
          created_at: string | null
          credits_used: number | null
          duration_seconds: number | null
          id: string
          text_input: string
          user_id: string
          voice_id: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          credits_used?: number | null
          duration_seconds?: number | null
          id?: string
          text_input: string
          user_id: string
          voice_id?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          credits_used?: number | null
          duration_seconds?: number | null
          id?: string
          text_input?: string
          user_id?: string
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_generations_voice_id_fkey"
            columns: ["voice_id"]
            isOneToOne: false
            referencedRelation: "voice_clones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
