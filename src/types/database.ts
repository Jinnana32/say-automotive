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
      attendance: {
        Row: {
          id: string;
          branch_id: string;
          staff_id: string;
          attendance_date: string;
          time_in: string | null;
          time_out: string | null;
          status: Database["public"]["Enums"]["attendance_status"];
          notes: string | null;
          approved_by_staff_id: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          staff_id: string;
          attendance_date: string;
          time_in?: string | null;
          time_out?: string | null;
          status: Database["public"]["Enums"]["attendance_status"];
          notes?: string | null;
          approved_by_staff_id?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "attendance_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_approved_by_staff_id_fkey";
            columns: ["approved_by_staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance_adjustments: {
        Row: {
          id: string;
          branch_id: string;
          attendance_id: string;
          staff_id: string;
          attendance_date: string;
          action: string;
          previous_data: Json | null;
          next_data: Json | null;
          reason: string | null;
          changed_by_staff_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          attendance_id: string;
          staff_id: string;
          attendance_date: string;
          action: string;
          previous_data?: Json | null;
          next_data?: Json | null;
          reason?: string | null;
          changed_by_staff_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance_adjustments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "attendance_adjustments_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_adjustments_attendance_id_fkey";
            columns: ["attendance_id"];
            isOneToOne: false;
            referencedRelation: "attendance";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_adjustments_changed_by_staff_id_fkey";
            columns: ["changed_by_staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_adjustments_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance_allowed_ips: {
        Row: {
          id: string;
          branch_id: string;
          ip_address: string;
          label: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          ip_address: string;
          label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance_allowed_ips"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "attendance_allowed_ips_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance_time_logs: {
        Row: {
          id: string;
          branch_id: string;
          staff_id: string;
          attendance_id: string | null;
          dtr_amendment_id: string | null;
          staff_device_id: string | null;
          attendance_date: string;
          log_type: string;
          logged_at: string;
          source: string;
          request_ip: string | null;
          is_shop_ip_valid: boolean;
          is_device_approved: boolean;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          staff_id: string;
          attendance_id?: string | null;
          dtr_amendment_id?: string | null;
          staff_device_id?: string | null;
          attendance_date: string;
          log_type: string;
          logged_at: string;
          source: string;
          request_ip?: string | null;
          is_shop_ip_valid?: boolean;
          is_device_approved?: boolean;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance_time_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "attendance_time_logs_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_time_logs_attendance_id_fkey";
            columns: ["attendance_id"];
            isOneToOne: false;
            referencedRelation: "attendance";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_time_logs_dtr_amendment_id_fkey";
            columns: ["dtr_amendment_id"];
            isOneToOne: false;
            referencedRelation: "dtr_amendment_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_time_logs_staff_device_id_fkey";
            columns: ["staff_device_id"];
            isOneToOne: false;
            referencedRelation: "staff_devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_time_logs_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          before_data: Json | null;
          after_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          before_data?: Json | null;
          after_data?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
      branches: {
        Row: {
          id: string;
          code: string;
          name: string;
          address: string | null;
          contact_number: string | null;
          email: string | null;
          is_main: boolean;
          is_active: boolean;
          is_default: boolean;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          address?: string | null;
          contact_number?: string | null;
          email?: string | null;
          is_main?: boolean;
          is_active?: boolean;
          is_default?: boolean;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
        Relationships: [];
      };
      branch_holidays: {
        Row: {
          id: string;
          branch_id: string;
          holiday_date: string;
          label: string;
          holiday_kind: string;
          pay_treatment: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          holiday_date: string;
          label: string;
          holiday_kind: string;
          pay_treatment?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["branch_holidays"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "branch_holidays_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      brands: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["brands"]["Insert"]>;
        Relationships: [];
      };
      business_settings: {
        Row: {
          id: number;
          branch_id: string;
          allow_global_product_catalog: boolean;
          allow_global_service_catalog: boolean;
          allow_partial_payments: boolean;
          require_invoice_before_job_completion: boolean;
          require_invoice_before_vehicle_release: boolean;
          allow_release_with_balance: boolean;
          require_full_payment_before_release: boolean;
          require_additional_item_preapproval: boolean;
          require_shop_ip_for_mechanic_attendance: boolean;
          allow_dtr_amendments: boolean;
          allow_attendance_admin_override: boolean;
          enable_barcode_support: boolean;
          enable_shelf_location: boolean;
          payroll_standard_daily_hours: number;
          payroll_holiday_premium_rate: number;
          default_tax_rate: number;
          business_name: string;
          business_logo_path: string | null;
          business_address: string | null;
          business_contact: string | null;
          business_email: string | null;
          business_vat_registration_no: string | null;
          receipt_footer: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          branch_id: string;
          allow_global_product_catalog?: boolean;
          allow_global_service_catalog?: boolean;
          allow_partial_payments?: boolean;
          require_invoice_before_job_completion?: boolean;
          require_invoice_before_vehicle_release?: boolean;
          allow_release_with_balance?: boolean;
          require_full_payment_before_release?: boolean;
          require_additional_item_preapproval?: boolean;
          require_shop_ip_for_mechanic_attendance?: boolean;
          allow_dtr_amendments?: boolean;
          allow_attendance_admin_override?: boolean;
          enable_barcode_support?: boolean;
          enable_shelf_location?: boolean;
          payroll_standard_daily_hours?: number;
          payroll_holiday_premium_rate?: number;
          default_tax_rate?: number;
          business_name: string;
          business_logo_path?: string | null;
          business_address?: string | null;
          business_contact?: string | null;
          business_email?: string | null;
          business_vat_registration_no?: string | null;
          receipt_footer?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["business_settings"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "business_settings_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          id: string;
          branch_id: string;
          customer_code: string | null;
          customer_type: Database["public"]["Enums"]["customer_type"];
          display_name: string;
          first_name: string | null;
          last_name: string | null;
          company_name: string | null;
          contact_number: string | null;
          email: string | null;
          address: string | null;
          notes: string | null;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          customer_code?: string | null;
          customer_type?: Database["public"]["Enums"]["customer_type"];
          display_name: string;
          first_name?: string | null;
          last_name?: string | null;
          company_name?: string | null;
          contact_number?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "customers_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      document_sequences: {
        Row: {
          key: string;
          branch_id: string;
          prefix: string;
          padding: number;
          last_value: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          branch_id: string;
          prefix: string;
          padding?: number;
          last_value?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["document_sequences"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "document_sequences_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      dtr_amendment_requests: {
        Row: {
          id: string;
          branch_id: string;
          staff_id: string;
          attendance_id: string | null;
          attendance_date: string;
          target_log_type: string;
          amendment_type: string;
          requested_timestamp: string;
          reason: string;
          proof_url: string | null;
          status: string;
          requested_ip: string | null;
          request_user_agent: string | null;
          approved_timestamp: string | null;
          approved_by_staff_id: string | null;
          rejected_at: string | null;
          rejected_by_staff_id: string | null;
          final_timestamp: string | null;
          admin_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          staff_id: string;
          attendance_id?: string | null;
          attendance_date: string;
          target_log_type: string;
          amendment_type: string;
          requested_timestamp: string;
          reason: string;
          proof_url?: string | null;
          status?: string;
          requested_ip?: string | null;
          request_user_agent?: string | null;
          approved_timestamp?: string | null;
          approved_by_staff_id?: string | null;
          rejected_at?: string | null;
          rejected_by_staff_id?: string | null;
          final_timestamp?: string | null;
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dtr_amendment_requests"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "dtr_amendment_requests_attendance_id_fkey";
            columns: ["attendance_id"];
            isOneToOne: false;
            referencedRelation: "attendance";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dtr_amendment_requests_approved_by_staff_id_fkey";
            columns: ["approved_by_staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dtr_amendment_requests_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dtr_amendment_requests_rejected_by_staff_id_fkey";
            columns: ["rejected_by_staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dtr_amendment_requests_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_devices: {
        Row: {
          id: string;
          staff_id: string;
          device_id_hash: string;
          device_name: string | null;
          user_agent: string | null;
          first_seen_at: string;
          last_seen_at: string;
          last_ip: string | null;
          status: string;
          approved_at: string | null;
          approved_by_staff_id: string | null;
          revoked_at: string | null;
          revoked_by_staff_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          device_id_hash: string;
          device_name?: string | null;
          user_agent?: string | null;
          first_seen_at?: string;
          last_seen_at?: string;
          last_ip?: string | null;
          status?: string;
          approved_at?: string | null;
          approved_by_staff_id?: string | null;
          revoked_at?: string | null;
          revoked_by_staff_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff_devices"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "staff_devices_approved_by_staff_id_fkey";
            columns: ["approved_by_staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "staff_devices_revoked_by_staff_id_fkey";
            columns: ["revoked_by_staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "staff_devices_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicle_lookup_options: {
        Row: {
          id: string;
          lookup_type: string;
          label: string;
          value_key: string;
          sort_order: number;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lookup_type: string;
          label: string;
          value_key: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vehicle_lookup_options"]["Insert"]>;
        Relationships: [];
      };
      vehicle_makes: {
        Row: {
          id: string;
          name: string;
          name_key: string;
          external_source: string | null;
          external_source_id: string | null;
          is_seeded: boolean;
          sort_order: number;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_key: string;
          external_source?: string | null;
          external_source_id?: string | null;
          is_seeded?: boolean;
          sort_order?: number;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vehicle_makes"]["Insert"]>;
        Relationships: [];
      };
      vehicle_models: {
        Row: {
          id: string;
          make_id: string;
          name: string;
          name_key: string;
          external_source: string | null;
          external_source_id: string | null;
          is_seeded: boolean;
          sort_order: number;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          make_id: string;
          name: string;
          name_key: string;
          external_source?: string | null;
          external_source_id?: string | null;
          is_seeded?: boolean;
          sort_order?: number;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vehicle_models"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "vehicle_models_make_id_fkey";
            columns: ["make_id"];
            isOneToOne: false;
            referencedRelation: "vehicle_makes";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_stocks: {
        Row: {
          id: string;
          branch_id: string;
          product_id: string;
          quantity_on_hand: number;
          reserved_quantity: number;
          available_quantity: number;
          reorder_level: number | null;
          shelf_location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          product_id: string;
          quantity_on_hand?: number;
          reserved_quantity?: number;
          reorder_level?: number | null;
          shelf_location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_stocks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "inventory_stocks_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_stocks_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          source_type: string | null;
          source_id: string | null;
          line_number: number;
          item_type: Database["public"]["Enums"]["line_item_type"];
          description: string;
          quantity: number;
          unit_price: number;
          total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          source_type?: string | null;
          source_id?: string | null;
          line_number: number;
          item_type: Database["public"]["Enums"]["line_item_type"];
          description: string;
          quantity: number;
          unit_price?: number;
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoice_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          branch_id: string;
          job_order_id: string | null;
          sale_id: string | null;
          customer_id: string | null;
          vehicle_id: string | null;
          invoice_date: string;
          subtotal: number;
          discount: number;
          tax: number;
          total_amount: number;
          paid_amount: number;
          balance: number;
          status: Database["public"]["Enums"]["invoice_status"];
          created_by: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          branch_id: string;
          job_order_id?: string | null;
          sale_id?: string | null;
          customer_id?: string | null;
          vehicle_id?: string | null;
          invoice_date: string;
          subtotal?: number;
          discount?: number;
          tax?: number;
          total_amount?: number;
          paid_amount?: number;
          balance?: number;
          status?: Database["public"]["Enums"]["invoice_status"];
          created_by?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "invoices_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_job_order_id_fkey";
            columns: ["job_order_id"];
            isOneToOne: true;
            referencedRelation: "job_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: true;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      job_order_items: {
        Row: {
          id: string;
          job_order_id: string;
          source_quotation_item_id: string | null;
          line_number: number;
          item_type: Database["public"]["Enums"]["line_item_type"];
          product_id: string | null;
          service_id: string | null;
          description: string;
          quantity: number;
          unit_price: number;
          total: number;
          is_additional: boolean;
          approval_status: Database["public"]["Enums"]["approval_status"];
          usage_status: Database["public"]["Enums"]["usage_status"];
          checklist_completed: boolean;
          checklist_checked_at: string | null;
          checklist_checked_by_staff_id: string | null;
          approved_at: string | null;
          rejected_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_order_id: string;
          source_quotation_item_id?: string | null;
          line_number: number;
          item_type: Database["public"]["Enums"]["line_item_type"];
          product_id?: string | null;
          service_id?: string | null;
          description: string;
          quantity: number;
          unit_price?: number;
          total?: number;
          is_additional?: boolean;
          approval_status?: Database["public"]["Enums"]["approval_status"];
          usage_status?: Database["public"]["Enums"]["usage_status"];
          checklist_completed?: boolean;
          checklist_checked_at?: string | null;
          checklist_checked_by_staff_id?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["job_order_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "job_order_items_checklist_checked_by_staff_id_fkey";
            columns: ["checklist_checked_by_staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      job_order_mechanics: {
        Row: {
          id: string;
          job_order_id: string;
          staff_id: string;
          task_description: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_order_id: string;
          staff_id: string;
          task_description?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["job_order_mechanics"]["Insert"]>;
        Relationships: [];
      };
      job_order_part_usages: {
        Row: {
          id: string;
          job_order_id: string;
          job_order_item_id: string;
          branch_id: string;
          product_id: string;
          usage_type: Database["public"]["Enums"]["part_usage_type"];
          quantity: number;
          stock_movement_id: string | null;
          notes: string | null;
          performed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_order_id: string;
          job_order_item_id: string;
          branch_id: string;
          product_id: string;
          usage_type: Database["public"]["Enums"]["part_usage_type"];
          quantity: number;
          stock_movement_id?: string | null;
          notes?: string | null;
          performed_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["job_order_part_usages"]["Insert"]>;
        Relationships: [];
      };
      job_orders: {
        Row: {
          id: string;
          job_order_number: string;
          quotation_id: string | null;
          branch_id: string;
          customer_id: string;
          vehicle_id: string;
          status: Database["public"]["Enums"]["job_order_status"];
          mileage_in: number | null;
          mileage_out: number | null;
          customer_concern: string | null;
          inspection_notes: string | null;
          diagnosis: string | null;
          work_performed: string | null;
          started_at: string | null;
          completed_at: string | null;
          released_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_order_number: string;
          quotation_id?: string | null;
          branch_id: string;
          customer_id: string;
          vehicle_id: string;
          status?: Database["public"]["Enums"]["job_order_status"];
          mileage_in?: number | null;
          mileage_out?: number | null;
          customer_concern?: string | null;
          inspection_notes?: string | null;
          diagnosis?: string | null;
          work_performed?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          released_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["job_orders"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          branch_id: string;
          invoice_id: string;
          amount: number;
          payment_method: Database["public"]["Enums"]["payment_method"];
          reference_number: string | null;
          received_by: string | null;
          paid_at: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          invoice_id: string;
          amount: number;
          payment_method: Database["public"]["Enums"]["payment_method"];
          reference_number?: string | null;
          received_by?: string | null;
          paid_at?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "payments_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      payroll_periods: {
        Row: {
          id: string;
          branch_id: string;
          label: string;
          period_start_date: string;
          period_end_date: string;
          payout_date: string;
          status: Database["public"]["Enums"]["payroll_period_status"];
          notes: string | null;
          created_by_staff_id: string | null;
          generated_by_staff_id: string | null;
          generated_at: string | null;
          finalized_by_staff_id: string | null;
          finalized_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          label: string;
          period_start_date: string;
          period_end_date: string;
          payout_date: string;
          status?: Database["public"]["Enums"]["payroll_period_status"];
          notes?: string | null;
          created_by_staff_id?: string | null;
          generated_by_staff_id?: string | null;
          generated_at?: string | null;
          finalized_by_staff_id?: string | null;
          finalized_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payroll_periods"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "payroll_periods_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payroll_periods_created_by_staff_id_fkey";
            columns: ["created_by_staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payroll_periods_generated_by_staff_id_fkey";
            columns: ["generated_by_staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payroll_periods_finalized_by_staff_id_fkey";
            columns: ["finalized_by_staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      payroll_period_item_adjustments: {
        Row: {
          id: string;
          payroll_period_item_id: string;
          adjustment_type: string;
          label: string;
          amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          payroll_period_item_id: string;
          adjustment_type: string;
          label: string;
          amount: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payroll_period_item_adjustments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "payroll_period_item_adjustments_payroll_period_item_id_fkey";
            columns: ["payroll_period_item_id"];
            isOneToOne: false;
            referencedRelation: "payroll_period_items";
            referencedColumns: ["id"];
          },
        ];
      };
      payroll_period_items: {
        Row: {
          id: string;
          payroll_period_id: string;
          branch_id: string;
          staff_id: string;
          staff_name: string;
          staff_role: Database["public"]["Enums"]["staff_role"];
          pay_basis: Database["public"]["Enums"]["pay_basis"] | null;
          base_rate: number | null;
          overtime_rate: number | null;
          allowance_per_period: number;
          daily_rate_used: number;
          hourly_rate_used: number;
          standard_daily_hours: number;
          holiday_premium_rate: number;
          scheduled_workday_count: number;
          holiday_day_count: number;
          approved_leave_day_count: number;
          expected_workday_count: number;
          missing_attendance_day_count: number;
          recorded_day_count: number;
          present_count: number;
          late_count: number;
          half_day_count: number;
          absent_count: number;
          missing_timeout_count: number;
          pending_approval_count: number;
          worked_minutes: number;
          paid_day_units: number;
          holiday_worked_day_units: number;
          late_deduction_minutes: number;
          overtime_minutes: number;
          base_pay: number;
          late_deduction_amount: number;
          holiday_premium_pay: number;
          overtime_pay: number;
          allowance_pay: number;
          computed_pay: number;
          manual_additions_total: number;
          manual_deductions_total: number;
          gross_pay: number;
          net_pay: number;
          readiness_status: string;
          warning_codes: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          payroll_period_id: string;
          branch_id: string;
          staff_id: string;
          staff_name: string;
          staff_role: Database["public"]["Enums"]["staff_role"];
          pay_basis?: Database["public"]["Enums"]["pay_basis"] | null;
          base_rate?: number | null;
          overtime_rate?: number | null;
          allowance_per_period?: number;
          daily_rate_used?: number;
          hourly_rate_used?: number;
          standard_daily_hours?: number;
          holiday_premium_rate?: number;
          scheduled_workday_count?: number;
          holiday_day_count?: number;
          approved_leave_day_count?: number;
          expected_workday_count?: number;
          missing_attendance_day_count?: number;
          recorded_day_count?: number;
          present_count?: number;
          late_count?: number;
          half_day_count?: number;
          absent_count?: number;
          missing_timeout_count?: number;
          pending_approval_count?: number;
          worked_minutes?: number;
          paid_day_units?: number;
          holiday_worked_day_units?: number;
          late_deduction_minutes?: number;
          overtime_minutes?: number;
          base_pay?: number;
          late_deduction_amount?: number;
          holiday_premium_pay?: number;
          overtime_pay?: number;
          allowance_pay?: number;
          computed_pay?: number;
          manual_additions_total?: number;
          manual_deductions_total?: number;
          gross_pay?: number;
          net_pay?: number;
          readiness_status?: string;
          warning_codes?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payroll_period_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "payroll_period_items_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payroll_period_items_payroll_period_id_fkey";
            columns: ["payroll_period_id"];
            isOneToOne: false;
            referencedRelation: "payroll_periods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payroll_period_items_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      product_categories: {
        Row: {
          id: string;
          parent_category_id: string | null;
          name: string;
          description: string | null;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_category_id?: string | null;
          name: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_categories"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          branch_id: string;
          is_global: boolean;
          name: string;
          sku: string | null;
          barcode: string | null;
          category_id: string | null;
          brand_id: string | null;
          primary_supplier_id: string | null;
          unit_id: string;
          part_number: string | null;
          oem_number: string | null;
          description: string | null;
          product_type: Database["public"]["Enums"]["product_type"];
          cost_price: number;
          selling_price: number;
          reorder_level: number;
          warranty_duration_days: number | null;
          shelf_location: string | null;
          website_visible: boolean;
          website_featured: boolean;
          website_sort_order: number;
          website_slug: string | null;
          product_image_path: string | null;
          product_image_url: string | null;
          website_image_url: string | null;
          website_short_description: string | null;
          website_badge: string | null;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          is_global?: boolean;
          name: string;
          sku?: string | null;
          barcode?: string | null;
          category_id?: string | null;
          brand_id?: string | null;
          primary_supplier_id?: string | null;
          unit_id: string;
          part_number?: string | null;
          oem_number?: string | null;
          description?: string | null;
          product_type?: Database["public"]["Enums"]["product_type"];
          cost_price?: number;
          selling_price?: number;
          reorder_level?: number;
          warranty_duration_days?: number | null;
          shelf_location?: string | null;
          website_visible?: boolean;
          website_featured?: boolean;
          website_sort_order?: number;
          website_slug?: string | null;
          product_image_path?: string | null;
          product_image_url?: string | null;
          website_image_url?: string | null;
          website_short_description?: string | null;
          website_badge?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      website_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string;
          content: string;
          cover_image_url: string | null;
          category: string;
          is_featured: boolean;
          status: Database["public"]["Enums"]["record_status"];
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt: string;
          content: string;
          cover_image_url?: string | null;
          category?: string;
          is_featured?: boolean;
          status?: Database["public"]["Enums"]["record_status"];
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["website_posts"]["Insert"]>;
        Relationships: [];
      };
      website_quote_requests: {
        Row: {
          id: string;
          branch_id: string;
          requested_product_id: string | null;
          requested_product_label: string | null;
          first_name: string;
          last_name: string;
          contact_number: string | null;
          email: string;
          province: string;
          city: string;
          barangay: string;
          vehicle_make: string;
          vehicle_model: string;
          vehicle_year: number | null;
          transmission: string;
          mileage: string;
          plate_number: string | null;
          engine_size: string | null;
          oil_requirement_liters: number | null;
          service_needed: string;
          customer_concern: string;
          status: string;
          source: string;
          internal_notes: string | null;
          contacted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          requested_product_id?: string | null;
          requested_product_label?: string | null;
          first_name: string;
          last_name: string;
          contact_number?: string | null;
          email: string;
          province: string;
          city: string;
          barangay: string;
          vehicle_make: string;
          vehicle_model: string;
          vehicle_year?: number | null;
          transmission: string;
          mileage: string;
          plate_number?: string | null;
          engine_size?: string | null;
          oil_requirement_liters?: number | null;
          service_needed: string;
          customer_concern: string;
          status?: string;
          source?: string;
          internal_notes?: string | null;
          contacted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["website_quote_requests"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "website_quote_requests_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "website_quote_requests_requested_product_id_fkey";
            columns: ["requested_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      quotation_items: {
        Row: {
          id: string;
          quotation_id: string;
          line_number: number;
          item_type: Database["public"]["Enums"]["line_item_type"];
          product_id: string | null;
          service_id: string | null;
          description: string;
          quantity: number;
          unit_label_snapshot: string | null;
          unit_price: number;
          total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quotation_id: string;
          line_number: number;
          item_type: Database["public"]["Enums"]["line_item_type"];
          product_id?: string | null;
          service_id?: string | null;
          description: string;
          quantity: number;
          unit_label_snapshot?: string | null;
          unit_price?: number;
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quotation_items"]["Insert"]>;
        Relationships: [];
      };
      quotations: {
        Row: {
          id: string;
          quotation_number: string;
          branch_id: string;
          customer_id: string;
          vehicle_id: string;
          nature_of_repair: string | null;
          inspection_notes: string | null;
          status: Database["public"]["Enums"]["quotation_status"];
          subtotal: number;
          discount: number;
          tax: number;
          total_amount: number;
          customer_name_snapshot: string | null;
          customer_contact_snapshot: string | null;
          customer_address_snapshot: string | null;
          vehicle_make_snapshot: string | null;
          vehicle_model_snapshot: string | null;
          vehicle_year_snapshot: number | null;
          vehicle_plate_number_snapshot: string | null;
          vehicle_vin_snapshot: string | null;
          prepared_by_name_snapshot: string | null;
          prepared_by_title_snapshot: string | null;
          created_by: string | null;
          approved_at: string | null;
          rejected_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quotation_number: string;
          branch_id: string;
          customer_id: string;
          vehicle_id: string;
          nature_of_repair?: string | null;
          inspection_notes?: string | null;
          status?: Database["public"]["Enums"]["quotation_status"];
          subtotal?: number;
          discount?: number;
          tax?: number;
          total_amount?: number;
          customer_name_snapshot?: string | null;
          customer_contact_snapshot?: string | null;
          customer_address_snapshot?: string | null;
          vehicle_make_snapshot?: string | null;
          vehicle_model_snapshot?: string | null;
          vehicle_year_snapshot?: number | null;
          vehicle_plate_number_snapshot?: string | null;
          vehicle_vin_snapshot?: string | null;
          prepared_by_name_snapshot?: string | null;
          prepared_by_title_snapshot?: string | null;
          created_by?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quotations"]["Insert"]>;
        Relationships: [];
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          line_number: number;
          product_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          line_number: number;
          product_id: string;
          description: string;
          quantity: number;
          unit_price?: number;
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sale_items"]["Insert"]>;
        Relationships: [];
      };
      sales: {
        Row: {
          id: string;
          sale_number: string;
          branch_id: string;
          customer_id: string | null;
          cashier_user_id: string | null;
          subtotal: number;
          discount: number;
          tax: number;
          total_amount: number;
          status: Database["public"]["Enums"]["sale_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sale_number: string;
          branch_id: string;
          customer_id?: string | null;
          cashier_user_id?: string | null;
          subtotal?: number;
          discount?: number;
          tax?: number;
          total_amount?: number;
          status?: Database["public"]["Enums"]["sale_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sales"]["Insert"]>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          branch_id: string;
          is_global: boolean;
          name: string;
          category: string | null;
          description: string | null;
          labor_price: number;
          estimated_duration_minutes: number | null;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          is_global?: boolean;
          name: string;
          category?: string | null;
          description?: string | null;
          labor_price?: number;
          estimated_duration_minutes?: number | null;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
        Relationships: [];
      };
      staff_compensation_profiles: {
        Row: {
          id: string;
          staff_id: string;
          pay_basis: Database["public"]["Enums"]["pay_basis"];
          base_rate: number;
          overtime_rate: number | null;
          allowance_per_period: number;
          effective_start_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          pay_basis: Database["public"]["Enums"]["pay_basis"];
          base_rate: number;
          overtime_rate?: number | null;
          allowance_per_period?: number;
          effective_start_date: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff_compensation_profiles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "staff_compensation_profiles_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: true;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      staff: {
        Row: {
          id: string;
          linked_user_id: string | null;
          branch_id: string | null;
          staff_code: string | null;
          first_name: string;
          last_name: string;
          document_title: string | null;
          contact_number: string | null;
          address: string | null;
          role: Database["public"]["Enums"]["staff_role"];
          sss_number: string | null;
          philhealth_number: string | null;
          tin_number: string | null;
          emergency_contact_name: string | null;
          emergency_contact_number: string | null;
          is_payroll_eligible: boolean;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          linked_user_id?: string | null;
          branch_id?: string | null;
          staff_code?: string | null;
          first_name: string;
          last_name: string;
          document_title?: string | null;
          contact_number?: string | null;
          address?: string | null;
          role: Database["public"]["Enums"]["staff_role"];
          sss_number?: string | null;
          philhealth_number?: string | null;
          tin_number?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_number?: string | null;
          is_payroll_eligible?: boolean;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>;
        Relationships: [];
      };
      staff_leave_entries: {
        Row: {
          id: string;
          branch_id: string;
          staff_id: string;
          start_date: string;
          end_date: string;
          leave_type: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          staff_id: string;
          start_date: string;
          end_date: string;
          leave_type: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff_leave_entries"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "staff_leave_entries_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "staff_leave_entries_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_schedules: {
        Row: {
          id: string;
          staff_id: string;
          shift_start_time: string;
          shift_end_time: string;
          grace_minutes: number;
          monday_is_workday: boolean;
          tuesday_is_workday: boolean;
          wednesday_is_workday: boolean;
          thursday_is_workday: boolean;
          friday_is_workday: boolean;
          saturday_is_workday: boolean;
          sunday_is_workday: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          shift_start_time: string;
          shift_end_time: string;
          grace_minutes?: number;
          monday_is_workday?: boolean;
          tuesday_is_workday?: boolean;
          wednesday_is_workday?: boolean;
          thursday_is_workday?: boolean;
          friday_is_workday?: boolean;
          saturday_is_workday?: boolean;
          sunday_is_workday?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff_schedules"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "staff_schedules_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: true;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_movements: {
        Row: {
          id: string;
          branch_id: string;
          product_id: string;
          movement_type: Database["public"]["Enums"]["stock_movement_type"];
          quantity: number;
          previous_quantity: number;
          new_quantity: number;
          reference_type: string;
          reference_id: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          product_id: string;
          movement_type: Database["public"]["Enums"]["stock_movement_type"];
          quantity: number;
          previous_quantity: number;
          new_quantity: number;
          reference_type: string;
          reference_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stock_movements"]["Insert"]>;
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          supplier_name: string;
          contact_person: string | null;
          contact_number: string | null;
          email: string | null;
          address: string | null;
          payment_terms: string | null;
          notes: string | null;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supplier_name: string;
          contact_person?: string | null;
          contact_number?: string | null;
          email?: string | null;
          address?: string | null;
          payment_terms?: string | null;
          notes?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Insert"]>;
        Relationships: [];
      };
      units: {
        Row: {
          id: string;
          name: string;
          abbreviation: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          abbreviation: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["units"]["Insert"]>;
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          branch_id: string;
          customer_id: string;
          make: string;
          model: string;
          year: number | null;
          transmission: string | null;
          mileage: number | null;
          plate_number: string | null;
          vin: string | null;
          engine: string | null;
          variant: string | null;
          fuel_type: string | null;
          color: string | null;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          customer_id: string;
          make: string;
          model: string;
          year?: number | null;
          transmission?: string | null;
          mileage?: number | null;
          plate_number?: string | null;
          vin?: string | null;
          engine?: string | null;
          variant?: string | null;
          fuel_type?: string | null;
          color?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vehicles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "vehicles_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicles_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      add_job_order_item: {
        Args: {
          p_job_order_id: string;
          p_item_type: Database["public"]["Enums"]["line_item_type"];
          p_product_id?: string | null;
          p_service_id?: string | null;
          p_description?: string | null;
          p_quantity?: number;
          p_unit_price?: number;
        };
        Returns: string;
      };
      update_job_order_item: {
        Args: {
          p_job_order_item_id: string;
          p_description: string;
          p_quantity: number;
          p_unit_price: number;
        };
        Returns: string;
      };
      complete_pos_sale: {
        Args: {
          p_branch_id: string;
          p_items: Json;
          p_customer_id?: string | null;
          p_discount?: number;
          p_payment_amount?: number;
          p_payment_method?: Database["public"]["Enums"]["payment_method"];
          p_reference_number?: string | null;
          p_notes?: string | null;
          p_cashier_user_id?: string | null;
          p_invoice_date?: string;
        };
        Returns: string;
      };
      mark_inventory_stock_damaged: {
        Args: {
          p_branch_id: string;
          p_product_id: string;
          p_quantity: number;
          p_notes?: string | null;
          p_created_by?: string | null;
        };
        Returns: string;
      };
      create_invoice_from_job_order: {
        Args: {
          p_job_order_id: string;
          p_invoice_date: string;
          p_created_by?: string | null;
        };
        Returns: string;
      };
      cancel_invoice: {
        Args: {
          p_invoice_id: string;
          p_cancellation_reason: string;
        };
        Returns: string;
      };
      delete_quotation: {
        Args: {
          p_quotation_id: string;
        };
        Returns: undefined;
      };
      delete_job_order: {
        Args: {
          p_job_order_id: string;
        };
        Returns: undefined;
      };
      approve_quotation_to_job_order: {
        Args: {
          p_quotation_id: string;
          p_user_id?: string | null;
        };
        Returns: string;
      };
      assign_job_order_mechanic: {
        Args: {
          p_job_order_id: string;
          p_staff_id: string;
          p_task_description?: string | null;
        };
        Returns: string;
      };
      next_document_number: {
        Args: {
          p_key: string;
        };
        Returns: string;
      };
      receive_inventory_stock: {
        Args: {
          p_branch_id: string;
          p_product_id: string;
          p_quantity: number;
          p_notes?: string | null;
          p_created_by?: string | null;
        };
        Returns: string;
      };
      reconcile_inventory_stock: {
        Args: {
          p_branch_id: string;
          p_product_id: string;
          p_counted_quantity: number;
          p_notes?: string | null;
          p_created_by?: string | null;
        };
        Returns: string;
      };
      record_invoice_payment: {
        Args: {
          p_invoice_id: string;
          p_amount: number;
          p_payment_method: Database["public"]["Enums"]["payment_method"];
          p_reference_number?: string | null;
          p_notes?: string | null;
          p_received_by?: string | null;
        };
        Returns: string;
      };
      record_job_order_part_return: {
        Args: {
          p_job_order_item_id: string;
          p_quantity: number;
          p_notes?: string | null;
          p_performed_by?: string | null;
        };
        Returns: string;
      };
      record_job_order_part_usage: {
        Args: {
          p_job_order_item_id: string;
          p_quantity: number;
          p_notes?: string | null;
          p_performed_by?: string | null;
        };
        Returns: string;
      };
      release_job_order_vehicle: {
        Args: {
          p_job_order_id: string;
        };
        Returns: string;
      };
      remove_job_order_mechanic: {
        Args: {
          p_assignment_id: string;
        };
        Returns: string;
      };
      save_quotation_with_items: {
        Args: {
          p_quotation_id?: string | null;
          p_branch_id: string;
          p_customer_id: string;
          p_vehicle_id: string;
          p_nature_of_repair?: string | null;
          p_inspection_notes?: string | null;
          p_status: Database["public"]["Enums"]["quotation_status"];
          p_subtotal: number;
          p_discount: number;
          p_tax: number;
          p_total_amount: number;
          p_items: Json;
          p_created_by?: string | null;
        };
        Returns: string;
      };
      save_job_order_details: {
        Args: {
          p_job_order_id: string;
          p_mileage_in?: number | null;
          p_mileage_out?: number | null;
          p_customer_concern?: string | null;
          p_inspection_notes?: string | null;
          p_diagnosis?: string | null;
          p_work_performed?: string | null;
        };
        Returns: string;
      };
      set_job_order_item_approval: {
        Args: {
          p_job_order_item_id: string;
          p_approval_status: Database["public"]["Enums"]["approval_status"];
        };
        Returns: string;
      };
      set_job_order_item_checklist_state: {
        Args: {
          p_job_order_item_id: string;
          p_checklist_completed: boolean;
        };
        Returns: string;
      };
      update_inventory_stock_settings: {
        Args: {
          p_branch_id: string;
          p_product_id: string;
          p_reorder_level?: number | null;
          p_shelf_location?: string | null;
        };
        Returns: string;
      };
      update_job_order_status: {
        Args: {
          p_job_order_id: string;
          p_next_status: Database["public"]["Enums"]["job_order_status"];
        };
        Returns: string;
      };
    };
    Enums: {
      approval_status: "not_required" | "pending" | "approved" | "rejected";
      attendance_status: "present" | "absent" | "late" | "half_day" | "unpaid_day_off";
      customer_type: "individual" | "company" | "fleet";
      invoice_status: "unpaid" | "partially_paid" | "paid" | "cancelled";
      job_order_status:
        | "pending"
        | "in_progress"
        | "waiting_for_parts"
        | "waiting_for_customer_approval"
        | "completed"
        | "ready_for_billing"
        | "paid"
        | "released"
        | "cancelled";
      line_item_type: "product" | "service" | "labor";
      pay_basis: "monthly" | "daily" | "hourly";
      part_usage_type: "use" | "return";
      payment_method: "cash" | "gcash" | "card" | "bank_transfer" | "check" | "other";
      payroll_period_status: "draft" | "processing" | "finalized";
      product_type: "part" | "fluid" | "consumable" | "accessory" | "tool";
      quotation_status: "draft" | "pending_approval" | "approved" | "rejected" | "expired";
      record_status: "active" | "inactive";
      sale_status: "draft" | "completed" | "cancelled";
      staff_role:
        | "owner"
        | "admin"
        | "mechanic"
        | "cashier"
        | "inventory_staff"
        | "service_advisor";
      stock_movement_type:
        | "stock_in"
        | "stock_out"
        | "service_usage"
        | "pos_sale"
        | "adjustment"
        | "return"
        | "damaged";
      usage_status: "planned" | "used" | "returned" | "cancelled";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type TableName = keyof Database["public"]["Tables"];
export type TableRow<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type TableUpdate<T extends TableName> = Database["public"]["Tables"][T]["Update"];
