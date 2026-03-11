export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          corporate_type: string;
          corporate_number: string | null;
          representative_name: string | null;
          postal_code: string | null;
          address: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          corporate_type: string;
          corporate_number?: string | null;
          representative_name?: string | null;
          postal_code?: string | null;
          address?: string | null;
          phone?: string | null;
        };
        Update: {
          name?: string;
          corporate_type?: string;
          corporate_number?: string | null;
          representative_name?: string | null;
          postal_code?: string | null;
          address?: string | null;
          phone?: string | null;
        };
        Relationships: [];
      };
      offices: {
        Row: {
          id: string;
          organization_id: string;
          office_number: string;
          name: string;
          service_type: string;
          staffing_ratio: string;
          capacity: number;
          postal_code: string | null;
          address: string | null;
          phone: string | null;
          fax: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          office_number: string;
          name: string;
          service_type: string;
          staffing_ratio: string;
          capacity: number;
          postal_code?: string | null;
          address?: string | null;
          phone?: string | null;
          fax?: string | null;
        };
        Update: {
          organization_id?: string;
          office_number?: string;
          name?: string;
          service_type?: string;
          staffing_ratio?: string;
          capacity?: number;
          postal_code?: string | null;
          address?: string | null;
          phone?: string | null;
          fax?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "offices_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          id: string;
          organization_id: string;
          office_id: string | null;
          email: string;
          display_name: string;
          role: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          office_id?: string | null;
          email: string;
          display_name: string;
          role: string;
          is_active?: boolean;
        };
        Update: {
          organization_id?: string;
          office_id?: string | null;
          email?: string;
          display_name?: string;
          role?: string;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_office_id_fkey";
            columns: ["office_id"];
            referencedRelation: "offices";
            referencedColumns: ["id"];
          }
        ];
      };
      clients: {
        Row: {
          id: string;
          office_id: string;
          client_number: string | null;
          family_name: string;
          given_name: string;
          family_name_kana: string | null;
          given_name_kana: string | null;
          birth_date: string;
          gender: string | null;
          disability_type: string | null;
          disability_grade: string | null;
          support_category: number | null;
          postal_code: string | null;
          address: string | null;
          phone: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relation: string | null;
          bank_name: string | null;
          bank_branch: string | null;
          bank_account_type: string | null;
          bank_account_number: string | null;
          bank_account_holder: string | null;
          status: string;
          enrollment_date: string | null;
          termination_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          office_id: string;
          client_number?: string | null;
          family_name: string;
          given_name: string;
          family_name_kana?: string | null;
          given_name_kana?: string | null;
          birth_date: string;
          gender?: string | null;
          disability_type?: string | null;
          disability_grade?: string | null;
          support_category?: number | null;
          postal_code?: string | null;
          address?: string | null;
          phone?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relation?: string | null;
          bank_name?: string | null;
          bank_branch?: string | null;
          bank_account_type?: string | null;
          bank_account_number?: string | null;
          bank_account_holder?: string | null;
          status?: string;
          enrollment_date?: string | null;
          termination_date?: string | null;
          notes?: string | null;
        };
        Update: {
          office_id?: string;
          client_number?: string | null;
          family_name?: string;
          given_name?: string;
          family_name_kana?: string | null;
          given_name_kana?: string | null;
          birth_date?: string;
          gender?: string | null;
          disability_type?: string | null;
          disability_grade?: string | null;
          support_category?: number | null;
          postal_code?: string | null;
          address?: string | null;
          phone?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relation?: string | null;
          bank_name?: string | null;
          bank_branch?: string | null;
          bank_account_type?: string | null;
          bank_account_number?: string | null;
          bank_account_holder?: string | null;
          status?: string;
          enrollment_date?: string | null;
          termination_date?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clients_office_id_fkey";
            columns: ["office_id"];
            referencedRelation: "offices";
            referencedColumns: ["id"];
          }
        ];
      };
      certificates: {
        Row: {
          id: string;
          client_id: string;
          certificate_number: string;
          municipality_code: string;
          municipality_name: string | null;
          service_type: string;
          decision_start_date: string;
          decision_end_date: string;
          monthly_days_limit: number;
          income_category: string;
          copay_limit: number;
          copay_limit_manager_office: string | null;
          is_copay_limit_manager: boolean;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          certificate_number: string;
          municipality_code: string;
          municipality_name?: string | null;
          service_type: string;
          decision_start_date: string;
          decision_end_date: string;
          monthly_days_limit: number;
          income_category: string;
          copay_limit: number;
          copay_limit_manager_office?: string | null;
          is_copay_limit_manager?: boolean;
          is_current?: boolean;
        };
        Update: {
          client_id?: string;
          certificate_number?: string;
          municipality_code?: string;
          municipality_name?: string | null;
          service_type?: string;
          decision_start_date?: string;
          decision_end_date?: string;
          monthly_days_limit?: number;
          income_category?: string;
          copay_limit?: number;
          copay_limit_manager_office?: string | null;
          is_copay_limit_manager?: boolean;
          is_current?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "certificates_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      attendances: {
        Row: {
          id: string;
          office_id: string;
          client_id: string;
          attendance_date: string;
          status: string;
          check_in_time: string | null;
          check_out_time: string | null;
          pickup_outbound: boolean;
          pickup_inbound: boolean;
          meal_provided: boolean;
          service_hours: number | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          office_id: string;
          client_id: string;
          attendance_date: string;
          status: string;
          check_in_time?: string | null;
          check_out_time?: string | null;
          pickup_outbound?: boolean;
          pickup_inbound?: boolean;
          meal_provided?: boolean;
          service_hours?: number | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: {
          office_id?: string;
          client_id?: string;
          attendance_date?: string;
          status?: string;
          check_in_time?: string | null;
          check_out_time?: string | null;
          pickup_outbound?: boolean;
          pickup_inbound?: boolean;
          meal_provided?: boolean;
          service_hours?: number | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendances_office_id_fkey";
            columns: ["office_id"];
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendances_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      billing_batches: {
        Row: {
          id: string;
          office_id: string;
          target_year: number;
          target_month: number;
          billing_type: string;
          status: string;
          total_units: number;
          total_amount: number;
          total_copay: number;
          ai_check_result: Json | null;
          ai_checked_at: string | null;
          exported_at: string | null;
          submitted_at: string | null;
          paid_at: string | null;
          paid_amount: number | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          office_id: string;
          target_year: number;
          target_month: number;
          billing_type?: string;
          status?: string;
          total_units?: number;
          total_amount?: number;
          total_copay?: number;
          ai_check_result?: Json | null;
          ai_checked_at?: string | null;
          exported_at?: string | null;
          submitted_at?: string | null;
          paid_at?: string | null;
          paid_amount?: number | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: {
          office_id?: string;
          target_year?: number;
          target_month?: number;
          billing_type?: string;
          status?: string;
          total_units?: number;
          total_amount?: number;
          total_copay?: number;
          ai_check_result?: Json | null;
          ai_checked_at?: string | null;
          exported_at?: string | null;
          submitted_at?: string | null;
          paid_at?: string | null;
          paid_amount?: number | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "billing_batches_office_id_fkey";
            columns: ["office_id"];
            referencedRelation: "offices";
            referencedColumns: ["id"];
          }
        ];
      };
      monthly_wages: {
        Row: {
          id: string;
          office_id: string;
          client_id: string;
          fiscal_year: number;
          month: number;
          working_days: number;
          total_hours: number;
          base_wage: number;
          piece_wage: number;
          adjustment: number;
          total_wage: number;
          status: string;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          office_id: string;
          client_id: string;
          fiscal_year: number;
          month: number;
          working_days?: number;
          total_hours?: number;
          base_wage?: number;
          piece_wage?: number;
          adjustment?: number;
          total_wage?: number;
          status?: string;
          paid_at?: string | null;
        };
        Update: {
          office_id?: string;
          client_id?: string;
          fiscal_year?: number;
          month?: number;
          working_days?: number;
          total_hours?: number;
          base_wage?: number;
          piece_wage?: number;
          adjustment?: number;
          total_wage?: number;
          status?: string;
          paid_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "monthly_wages_office_id_fkey";
            columns: ["office_id"];
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "monthly_wages_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      production_revenues: {
        Row: {
          id: string;
          office_id: string;
          work_type_id: string;
          fiscal_year: number;
          month: number;
          revenue_date: string | null;
          description: string | null;
          quantity: number | null;
          unit_price: number | null;
          amount: number;
          tax_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          office_id: string;
          work_type_id: string;
          fiscal_year: number;
          month: number;
          revenue_date?: string | null;
          description?: string | null;
          quantity?: number | null;
          unit_price?: number | null;
          amount: number;
          tax_amount?: number;
        };
        Update: {
          office_id?: string;
          work_type_id?: string;
          fiscal_year?: number;
          month?: number;
          revenue_date?: string | null;
          description?: string | null;
          quantity?: number | null;
          unit_price?: number | null;
          amount?: number;
          tax_amount?: number;
        };
        Relationships: [];
      };
      production_expenses: {
        Row: {
          id: string;
          office_id: string;
          work_type_id: string | null;
          fiscal_year: number;
          month: number;
          expense_date: string | null;
          category: string;
          description: string | null;
          amount: number;
          tax_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          office_id: string;
          work_type_id?: string | null;
          fiscal_year: number;
          month: number;
          expense_date?: string | null;
          category: string;
          description?: string | null;
          amount: number;
          tax_amount?: number;
        };
        Update: {
          office_id?: string;
          work_type_id?: string | null;
          fiscal_year?: number;
          month?: number;
          expense_date?: string | null;
          category?: string;
          description?: string | null;
          amount?: number;
          tax_amount?: number;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          office_id: string;
          alert_type: string;
          severity: string;
          title: string;
          message: string;
          related_entity_type: string | null;
          related_entity_id: string | null;
          is_read: boolean;
          due_date: string | null;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          office_id: string;
          alert_type: string;
          severity: string;
          title: string;
          message: string;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          is_read?: boolean;
          due_date?: string | null;
          read_at?: string | null;
        };
        Update: {
          office_id?: string;
          alert_type?: string;
          severity?: string;
          title?: string;
          message?: string;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          is_read?: boolean;
          due_date?: string | null;
          read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "alerts_office_id_fkey";
            columns: ["office_id"];
            referencedRelation: "offices";
            referencedColumns: ["id"];
          }
        ];
      };
      billing_details: {
        Row: {
          id: string;
          billing_batch_id: string;
          client_id: string;
          certificate_id: string;
          municipality_code: string;
          service_code: string;
          service_days: number;
          base_units: number;
          addition_units: number;
          subtraction_units: number;
          total_units: number;
          unit_price: number;
          total_amount: number;
          public_expense: number;
          copay_amount: number;
          copay_limit_result: string | null;
          copay_after_limit: number;
          pickup_outbound_days: number;
          pickup_inbound_days: number;
          meal_provision_days: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          billing_batch_id: string;
          client_id: string;
          certificate_id: string;
          municipality_code: string;
          service_code: string;
          service_days: number;
          base_units: number;
          addition_units?: number;
          subtraction_units?: number;
          total_units: number;
          unit_price: number;
          total_amount: number;
          public_expense: number;
          copay_amount: number;
          copay_limit_result?: string | null;
          copay_after_limit?: number;
          pickup_outbound_days?: number;
          pickup_inbound_days?: number;
          meal_provision_days?: number;
        };
        Update: {
          billing_batch_id?: string;
          client_id?: string;
          certificate_id?: string;
          municipality_code?: string;
          service_code?: string;
          service_days?: number;
          base_units?: number;
          addition_units?: number;
          subtraction_units?: number;
          total_units?: number;
          unit_price?: number;
          total_amount?: number;
          public_expense?: number;
          copay_amount?: number;
          copay_limit_result?: string | null;
          copay_after_limit?: number;
          pickup_outbound_days?: number;
          pickup_inbound_days?: number;
          meal_provision_days?: number;
        };
        Relationships: [];
      };
      billing_addition_details: {
        Row: {
          id: string;
          billing_detail_id: string;
          addition_code: string;
          addition_name: string;
          units: number;
          days_or_times: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          billing_detail_id: string;
          addition_code: string;
          addition_name: string;
          units: number;
          days_or_times?: number | null;
        };
        Update: {
          billing_detail_id?: string;
          addition_code?: string;
          addition_name?: string;
          units?: number;
          days_or_times?: number | null;
        };
        Relationships: [];
      };
      billing_client_invoices: {
        Row: {
          id: string;
          billing_batch_id: string;
          client_id: string;
          invoice_number: string;
          invoice_date: string;
          copay_amount: number;
          meal_cost: number;
          other_cost: number;
          total_amount: number;
          status: string;
          paid_at: string | null;
          receipt_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          billing_batch_id: string;
          client_id: string;
          invoice_number: string;
          invoice_date: string;
          copay_amount: number;
          meal_cost?: number;
          other_cost?: number;
          total_amount: number;
          status?: string;
          paid_at?: string | null;
          receipt_number?: string | null;
        };
        Update: {
          billing_batch_id?: string;
          client_id?: string;
          invoice_number?: string;
          invoice_date?: string;
          copay_amount?: number;
          meal_cost?: number;
          other_cost?: number;
          total_amount?: number;
          status?: string;
          paid_at?: string | null;
          receipt_number?: string | null;
        };
        Relationships: [];
      };
      billing_returns: {
        Row: {
          id: string;
          office_id: string;
          original_batch_id: string;
          client_id: string;
          return_date: string;
          return_reason_code: string | null;
          return_reason: string | null;
          rebilling_batch_id: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          office_id: string;
          original_batch_id: string;
          client_id: string;
          return_date: string;
          return_reason_code?: string | null;
          return_reason?: string | null;
          rebilling_batch_id?: string | null;
          status?: string;
        };
        Update: {
          office_id?: string;
          original_batch_id?: string;
          client_id?: string;
          return_date?: string;
          return_reason_code?: string | null;
          return_reason?: string | null;
          rebilling_batch_id?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          client_id: string;
          contract_date: string;
          contract_start_date: string;
          contract_end_date: string | null;
          important_doc_agreed_at: string | null;
          termination_reason: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          contract_date: string;
          contract_start_date: string;
          contract_end_date?: string | null;
          important_doc_agreed_at?: string | null;
          termination_reason?: string | null;
          status?: string;
        };
        Update: {
          client_id?: string;
          contract_date?: string;
          contract_start_date?: string;
          contract_end_date?: string | null;
          important_doc_agreed_at?: string | null;
          termination_reason?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      attendance_work_details: {
        Row: {
          id: string;
          attendance_id: string;
          work_type_id: string;
          work_hours: number | null;
          piece_count: number | null;
          amount: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          attendance_id: string;
          work_type_id: string;
          work_hours?: number | null;
          piece_count?: number | null;
          amount?: number | null;
        };
        Update: {
          attendance_id?: string;
          work_type_id?: string;
          work_hours?: number | null;
          piece_count?: number | null;
          amount?: number | null;
        };
        Relationships: [];
      };
      fiscal_years: {
        Row: {
          id: string;
          office_id: string;
          fiscal_year: number;
          start_date: string;
          end_date: string;
          prev_avg_wage: number | null;
          reward_tier: string | null;
          annual_opening_days: number | null;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          office_id: string;
          fiscal_year: number;
          start_date: string;
          end_date: string;
          prev_avg_wage?: number | null;
          reward_tier?: string | null;
          annual_opening_days?: number | null;
          is_current?: boolean;
        };
        Update: {
          office_id?: string;
          fiscal_year?: number;
          start_date?: string;
          end_date?: string;
          prev_avg_wage?: number | null;
          reward_tier?: string | null;
          annual_opening_days?: number | null;
          is_current?: boolean;
        };
        Relationships: [];
      };
      office_additions: {
        Row: {
          id: string;
          office_id: string;
          fiscal_year: number;
          addition_code: string;
          is_enabled: boolean;
          tier: string | null;
          parameters: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          office_id: string;
          fiscal_year: number;
          addition_code: string;
          is_enabled?: boolean;
          tier?: string | null;
          parameters?: Json | null;
        };
        Update: {
          office_id?: string;
          fiscal_year?: number;
          addition_code?: string;
          is_enabled?: boolean;
          tier?: string | null;
          parameters?: Json | null;
        };
        Relationships: [];
      };
      work_types: {
        Row: {
          id: string;
          office_id: string;
          name: string;
          description: string | null;
          unit_type: string;
          unit_price: number | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          office_id: string;
          name: string;
          description?: string | null;
          unit_type: string;
          unit_price?: number | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          office_id?: string;
          name?: string;
          description?: string | null;
          unit_type?: string;
          unit_price?: number | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      wage_rules: {
        Row: {
          id: string;
          office_id: string;
          fiscal_year: number;
          calculation_method: string;
          base_hourly_rate: number | null;
          base_daily_rate: number | null;
          payment_day: number | null;
          payment_method: string;
          rounding_method: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          office_id: string;
          fiscal_year: number;
          calculation_method: string;
          base_hourly_rate?: number | null;
          base_daily_rate?: number | null;
          payment_day?: number | null;
          payment_method?: string;
          rounding_method?: string;
          notes?: string | null;
        };
        Update: {
          office_id?: string;
          fiscal_year?: number;
          calculation_method?: string;
          base_hourly_rate?: number | null;
          base_daily_rate?: number | null;
          payment_day?: number | null;
          payment_method?: string;
          rounding_method?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      staff_members: {
        Row: {
          id: string;
          office_id: string;
          user_id: string | null;
          name: string;
          position: string;
          qualifications: string[] | null;
          employment_type: string;
          hire_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          office_id: string;
          user_id?: string | null;
          name: string;
          position: string;
          qualifications?: string[] | null;
          employment_type: string;
          hire_date?: string | null;
          is_active?: boolean;
        };
        Update: {
          office_id?: string;
          user_id?: string | null;
          name?: string;
          position?: string;
          qualifications?: string[] | null;
          employment_type?: string;
          hire_date?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      monthly_wage_summaries: {
        Row: {
          id: string;
          office_id: string;
          fiscal_year: number;
          month: number;
          total_production_revenue: number;
          total_production_expense: number;
          distributable_amount: number;
          total_wage_paid: number;
          avg_wage_per_person: number | null;
          avg_daily_users: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          office_id: string;
          fiscal_year: number;
          month: number;
          total_production_revenue?: number;
          total_production_expense?: number;
          distributable_amount?: number;
          total_wage_paid?: number;
          avg_wage_per_person?: number | null;
          avg_daily_users?: number | null;
        };
        Update: {
          office_id?: string;
          fiscal_year?: number;
          month?: number;
          total_production_revenue?: number;
          total_production_expense?: number;
          distributable_amount?: number;
          total_wage_paid?: number;
          avg_wage_per_person?: number | null;
          avg_daily_users?: number | null;
        };
        Relationships: [];
      };
      service_code_masters: {
        Row: {
          id: string;
          revision_year: number;
          service_code: string;
          service_name: string;
          service_type: string;
          staffing_ratio: string | null;
          capacity_range: string | null;
          wage_tier: string | null;
          units: number;
          effective_from: string;
          effective_to: string | null;
        };
        Insert: {
          id?: string;
          revision_year: number;
          service_code: string;
          service_name: string;
          service_type: string;
          staffing_ratio?: string | null;
          capacity_range?: string | null;
          wage_tier?: string | null;
          units: number;
          effective_from: string;
          effective_to?: string | null;
        };
        Update: {
          revision_year?: number;
          service_code?: string;
          service_name?: string;
          service_type?: string;
          staffing_ratio?: string | null;
          capacity_range?: string | null;
          wage_tier?: string | null;
          units?: number;
          effective_from?: string;
          effective_to?: string | null;
        };
        Relationships: [];
      };
      addition_masters: {
        Row: {
          id: string;
          revision_year: number;
          addition_code: string;
          addition_name: string;
          calculation_type: string;
          units: number | null;
          percentage: number | null;
          requirements: Json | null;
          capacity_variations: Json | null;
          effective_from: string;
          effective_to: string | null;
        };
        Insert: {
          id?: string;
          revision_year: number;
          addition_code: string;
          addition_name: string;
          calculation_type: string;
          units?: number | null;
          percentage?: number | null;
          requirements?: Json | null;
          capacity_variations?: Json | null;
          effective_from: string;
          effective_to?: string | null;
        };
        Update: {
          revision_year?: number;
          addition_code?: string;
          addition_name?: string;
          calculation_type?: string;
          units?: number | null;
          percentage?: number | null;
          requirements?: Json | null;
          capacity_variations?: Json | null;
          effective_from?: string;
          effective_to?: string | null;
        };
        Relationships: [];
      };
      unit_price_masters: {
        Row: {
          id: string;
          revision_year: number;
          area_code: string;
          area_name: string;
          unit_price: number;
          effective_from: string;
          effective_to: string | null;
        };
        Insert: {
          id?: string;
          revision_year: number;
          area_code: string;
          area_name: string;
          unit_price: number;
          effective_from: string;
          effective_to?: string | null;
        };
        Update: {
          revision_year?: number;
          area_code?: string;
          area_name?: string;
          unit_price?: number;
          effective_from?: string;
          effective_to?: string | null;
        };
        Relationships: [];
      };
      municipality_masters: {
        Row: {
          id: string;
          municipality_code: string;
          prefecture_name: string;
          municipality_name: string;
          area_code: string;
        };
        Insert: {
          id?: string;
          municipality_code: string;
          prefecture_name: string;
          municipality_name: string;
          area_code: string;
        };
        Update: {
          municipality_code?: string;
          prefecture_name?: string;
          municipality_name?: string;
          area_code?: string;
        };
        Relationships: [];
      };
      // ============================================================
      // Phase 2: 支援記録・個別支援計画
      // ============================================================
      individual_support_plans: {
        Row: {
          id: string;
          office_id: string;
          client_id: string;
          plan_number: number;
          plan_start_date: string;
          plan_end_date: string;
          long_term_goal: string | null;
          short_term_goal: string | null;
          support_policy: string | null;
          status: string;
          created_by: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          office_id: string;
          client_id: string;
          plan_number?: number;
          plan_start_date: string;
          plan_end_date: string;
          long_term_goal?: string | null;
          short_term_goal?: string | null;
          support_policy?: string | null;
          status?: string;
          created_by?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
        };
        Update: {
          plan_start_date?: string;
          plan_end_date?: string;
          long_term_goal?: string | null;
          short_term_goal?: string | null;
          support_policy?: string | null;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      support_plan_goals: {
        Row: {
          id: string;
          plan_id: string;
          goal_category: string;
          goal_description: string;
          support_content: string | null;
          achievement_criteria: string | null;
          sort_order: number;
          status: string;
          achieved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          goal_category: string;
          goal_description: string;
          support_content?: string | null;
          achievement_criteria?: string | null;
          sort_order?: number;
          status?: string;
        };
        Update: {
          goal_category?: string;
          goal_description?: string;
          support_content?: string | null;
          achievement_criteria?: string | null;
          sort_order?: number;
          status?: string;
          achieved_at?: string | null;
        };
        Relationships: [];
      };
      support_records: {
        Row: {
          id: string;
          office_id: string;
          client_id: string;
          attendance_id: string | null;
          record_date: string;
          record_content: string;
          health_status: string | null;
          mood: string | null;
          work_performance: string | null;
          special_notes: string | null;
          recorded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          office_id: string;
          client_id: string;
          attendance_id?: string | null;
          record_date: string;
          record_content: string;
          health_status?: string | null;
          mood?: string | null;
          work_performance?: string | null;
          special_notes?: string | null;
          recorded_by?: string | null;
        };
        Update: {
          record_content?: string;
          health_status?: string | null;
          mood?: string | null;
          work_performance?: string | null;
          special_notes?: string | null;
        };
        Relationships: [];
      };
      support_plan_reviews: {
        Row: {
          id: string;
          plan_id: string;
          review_date: string;
          review_type: string;
          overall_evaluation: string | null;
          achievements: string | null;
          challenges: string | null;
          next_steps: string | null;
          reviewer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          review_date: string;
          review_type: string;
          overall_evaluation?: string | null;
          achievements?: string | null;
          challenges?: string | null;
          next_steps?: string | null;
          reviewer_id?: string | null;
        };
        Update: {
          review_date?: string;
          review_type?: string;
          overall_evaluation?: string | null;
          achievements?: string | null;
          challenges?: string | null;
          next_steps?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
