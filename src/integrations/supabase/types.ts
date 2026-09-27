export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          role: string;
          can_manage_ads: boolean;
          can_manage_offers: boolean;
          can_manage_users: boolean;
          created_at: string;
          whatsapp_phone: string | null;
          whatsapp_verified: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          role?: string;
          can_manage_ads?: boolean;
          can_manage_offers?: boolean;
          can_manage_users?: boolean;
          created_at?: string;
          whatsapp_phone?: string | null;
          whatsapp_verified?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          role?: string;
          can_manage_ads?: boolean;
          can_manage_offers?: boolean;
          can_manage_users?: boolean;
          created_at?: string;
          whatsapp_phone?: string | null;
          whatsapp_verified?: boolean;
        };
      };

      ads: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string | null;
          price: number | null;
          location: string | null;
          whatsapp_phone: string | null;
          created_at: string;
          updated_at: string;
          photo_urls: string[] | null;
          business_id: string | null;
          auction_enabled: boolean;
          auction_start_price: number | null;
          auction_end_at: string | null;
          reference: string | null;
          allow_negotiation: boolean;
          status: string | null;
          trade_enabled: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category?: string | null;
          price?: number | null;
          location?: string | null;
          whatsapp_phone?: string | null;
          created_at?: string;
          updated_at?: string;
          photo_urls?: string[] | null;
          business_id?: string | null;
          auction_enabled?: boolean;
          auction_start_price?: number | null;
          auction_end_at?: string | null;
          reference?: string | null;
          allow_negotiation?: boolean;
          status?: string | null;
          trade_enabled?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          price?: number | null;
          location?: string | null;
          whatsapp_phone?: string | null;
          created_at?: string;
          updated_at?: string;
          photo_urls?: string[] | null;
          business_id?: string | null;
          auction_enabled?: boolean;
          auction_start_price?: number | null;
          auction_end_at?: string | null;
          reference?: string | null;
          allow_negotiation?: boolean;
          status?: string | null;
          trade_enabled?: boolean;
        };
      };

      businesses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          category: string | null;
          city: string | null;
          address: string | null;
          whatsapp_phone: string | null;
          photo_urls: string[] | null;
          created_at: string;
          updated_at: string;
          status: string;
          phone: string | null;
          email: string | null;
          website: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          category?: string | null;
          city?: string | null;
          address?: string | null;
          whatsapp_phone?: string | null;
          photo_urls?: string[] | null;
          created_at?: string;
          updated_at?: string;
          status?: string;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          city?: string | null;
          address?: string | null;
          whatsapp_phone?: string | null;
          photo_urls?: string[] | null;
          created_at?: string;
          updated_at?: string;
          status?: string;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
        };
      };

      services: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string | null;
          price: number | null;
          whatsapp_phone: string | null;
          created_at: string;
          updated_at: string;
          reference: string | null;
          allow_negotiation: boolean;
          location: string | null;
          status: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category?: string | null;
          price?: number | null;
          whatsapp_phone?: string | null;
          created_at?: string;
          updated_at?: string;
          reference?: string | null;
          allow_negotiation?: boolean;
          location?: string | null;
          status?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          price?: number | null;
          whatsapp_phone?: string | null;
          created_at?: string;
          updated_at?: string;
          reference?: string | null;
          allow_negotiation?: boolean;
          location?: string | null;
          status?: string | null;
        };
      };

      profiles: {
        Row: {
          id: string;
          email: string | null;
          whatsapp_phone: string;
          whatsapp_verified: boolean;
          created_at: string;
          first_name: string | null;
          last_name: string | null;
          city: string | null;
          stuff_id: string | null;
          whatsapp_country_code: string | null;
          locality: string | null;
          region_id: number | null;
          province_id: number | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          whatsapp_phone: string;
          whatsapp_verified?: boolean;
          created_at?: string;
          first_name?: string | null;
          last_name?: string | null;
          city?: string | null;
          stuff_id?: string | null;
          whatsapp_country_code?: string | null;
          locality?: string | null;
          region_id?: number | null;
          province_id?: number | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          whatsapp_phone?: string;
          whatsapp_verified?: boolean;
          created_at?: string;
          first_name?: string | null;
          last_name?: string | null;
          city?: string | null;
          stuff_id?: string | null;
          whatsapp_country_code?: string | null;
          locality?: string | null;
          region_id?: number | null;
          province_id?: number | null;
        };
      };

      favorites: {
        Row: {
          id: string;
          user_id: string;
          ad_id: string | null;
          service_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ad_id?: string | null;
          service_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ad_id?: string | null;
          service_id?: string | null;
          created_at?: string;
        };
      };

      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };

      reports: {
        Row: {
          id: string;
          user_id: string;
          ad_id: string | null;
          service_id: string | null;
          reason: string;
          description: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ad_id?: string | null;
          service_id?: string | null;
          reason: string;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ad_id?: string | null;
          service_id?: string | null;
          reason?: string;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
      };

      app_visits: {
        Row: {
          id: string;
          visitor_id: string;
          user_id: string | null;
          visit_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          visitor_id: string;
          user_id?: string | null;
          visit_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          visitor_id?: string;
          user_id?: string | null;
          visit_date?: string;
          created_at?: string;
        };
      };

      app_settings: {
        Row: {
          id: string;
          show_sold_products: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          show_sold_products?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          show_sold_products?: boolean;
          updated_at?: string;
        };
      };

      ad_settings: {
        Row: {
          id: string;
          monetag_enabled: boolean;
          adsterra_enabled: boolean;
          show_popup: boolean;
          show_banner: boolean;
          show_push: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          monetag_enabled?: boolean;
          adsterra_enabled?: boolean;
          show_popup?: boolean;
          show_banner?: boolean;
          show_push?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          monetag_enabled?: boolean;
          adsterra_enabled?: boolean;
          show_popup?: boolean;
          show_banner?: boolean;
          show_push?: boolean;
          updated_at?: string;
        };
      };

      boost_plans: {
        Row: {
          id: string;
          name: string;
          price: number;
          duration_hours: number;
        };
        Insert: {
          id: string;
          name: string;
          price: number;
          duration_hours: number;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          duration_hours?: number;
        };
      };

      business_plans: {
        Row: {
          id: string;
          name: string;
          price: number;
          duration_hours: number;
        };
        Insert: {
          id: string;
          name: string;
          price: number;
          duration_hours: number;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          duration_hours?: number;
        };
      };

      ad_boosts: {
        Row: {
          id: string;
          ad_id: string;
          user_id: string;
          plan: string;
          status: string;
          starts_at: string;
          ends_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ad_id: string;
          user_id: string;
          plan: string;
          status?: string;
          starts_at?: string;
          ends_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          ad_id?: string;
          user_id?: string;
          plan?: string;
          status?: string;
          starts_at?: string;
          ends_at?: string;
          created_at?: string;
        };
      };

      promotion_groups: {
        Row: {
          id: string;
          name: string;
          platform: string;
          url: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          platform: string;
          url: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          platform?: string;
          url?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };

      cities: {
        Row: {
          id: number;
          name: string;
          province_id: number | null;
        };
        Insert: {
          id?: number;
          name: string;
          province_id?: number | null;
        };
        Update: {
          id?: number;
          name?: string;
          province_id?: number | null;
        };
      };

      regions: {
        Row: {
          id: number;
          name: string;
        };
        Insert: {
          id?: number;
          name: string;
        };
        Update: {
          id?: number;
          name?: string;
        };
      };

      provinces: {
        Row: {
          id: number;
          name: string;
          region_id: number;
        };
        Insert: {
          id?: number;
          name: string;
          region_id: number;
        };
        Update: {
          id?: number;
          name?: string;
          region_id?: number;
        };
      };
    };

    Views: Record<string, never>;

    Functions: {
      get_email_by_stuff_id: {
        Args: {
          p_stuff_id: string;
        };
        Returns: string | null;
      };

      record_app_visit: {
        Args: {
          p_visitor_id: string;
        };
        Returns: undefined;
      };

      has_role: {
        Args: {
          _user_id: string;
          _role: string;
        };
        Returns: boolean;
      };
    };

    Enums: Record<string, never>;

    CompositeTypes: Record<string, never>;
  };
};