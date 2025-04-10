
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API keys from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get report recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from("report_recipients")
      .select("email");
      
    if (recipientsError) {
      throw recipientsError;
    }
    
    // Get report schedule settings
    const { data: scheduleData, error: scheduleError } = await supabase
      .from("report_schedule")
      .select("settings")
      .single();
      
    if (scheduleError && scheduleError.code !== "PGRST116") {
      throw scheduleError;
    }
    
    // Extract emails
    const emails = recipients?.map(r => r.email) || [];
    
    // Extract schedule settings
    const settings = scheduleData?.settings || {
      daily: { enabled: false, time: "07:00" },
      weekly: { enabled: false, time: "07:00", day: "monday" },
      monthly: { enabled: false, time: "07:00", day: "1" }
    };
    
    // Check if daily reports are enabled
    const dailyEnabled = settings.daily?.enabled || false;
    
    if (!dailyEnabled) {
      return new Response(JSON.stringify({ 
        message: "Daily reports are disabled",
        success: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }
    
    // If no recipients, return early
    if (emails.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No recipients configured",
        success: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }
    
    // In a real implementation, we would:
    // 1. Get dashboard data
    // 2. Generate an HTML report or PDF
    // 3. Send emails to recipients using a service like SendGrid, Mailgun, or Resend
    
    // For now, we'll just return a success message
    return new Response(JSON.stringify({ 
      message: "Daily report triggered successfully", 
      recipients: emails,
      settings,
      success: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error("Error in send-daily-report function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
