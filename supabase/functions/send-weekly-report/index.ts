
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { Resend } from 'npm:resend@2.0.0';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Resend client
const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
const resend = new Resend(resendApiKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Check if the function was triggered by cron or manually
    const isAuthorized = req.headers.get('Authorization')?.startsWith('Bearer ');
    const isCron = req.headers.get('X-Cron-Schedule') !== null;
    
    if (!isAuthorized && !isCron) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if today is the configured day for weekly report
    const today = new Date();
    const dayOfWeek = today.toLocaleString('en-US', { weekday: 'lowercase' });

    // Get recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from('report_recipients')
      .select('email');

    if (recipientsError) {
      throw new Error(`Error fetching recipients: ${recipientsError.message}`);
    }

    if (!recipients || recipients.length === 0) {
      return new Response(JSON.stringify({ message: 'No recipients configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get schedule settings
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('report_schedule')
      .select('settings')
      .single();

    if (scheduleError && scheduleError.code !== 'PGRST116') {
      throw new Error(`Error fetching schedule: ${scheduleError.message}`);
    }

    // Check if weekly reports are enabled and if today is the configured day
    if (
      scheduleData?.settings?.weekly?.enabled !== true || 
      scheduleData?.settings?.weekly?.day !== dayOfWeek
    ) {
      return new Response(JSON.stringify({ 
        message: 'Weekly reports are disabled or not scheduled for today',
        today: dayOfWeek,
        configured: scheduleData?.settings?.weekly?.day
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate weekly report data
    // For a real implementation, you would generate the dashboard screenshot here
    // and prepare the weekly statistics
    
    // Send emails to all recipients
    const recipientEmails = recipients.map(r => r.email);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    
    const dateRange = `${weekStart.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })} - ${today.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`;
    
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'Fossil Energies <reports@fossilenergies.com>',
      to: recipientEmails,
      subject: `Reporte Semanal - ${dateRange}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0EA5E9; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">Reporte Semanal</h1>
            <p style="margin: 5px 0 0;">${dateRange}</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Estimado usuario,</p>
            <p>Adjunto encontrará el reporte semanal con el resumen de actividades de test packs y tags.</p>
            
            <div style="background-color: white; border-radius: 4px; padding: 15px; margin: 20px 0; border-left: 4px solid #0EA5E9;">
              <h2 style="margin-top: 0; color: #333;">Resumen Semanal</h2>
              <p>Este es un ejemplo de reporte semanal automático. En una implementación completa, aquí se incluiría:</p>
              <ul>
                <li>Captura del dashboard</li>
                <li>Resumen semanal de KPIs</li>
                <li>Test packs completados esta semana</li>
                <li>Tags liberados esta semana</li>
                <li>Comparativa con semana anterior</li>
              </ul>
            </div>
            
            <p>Para más detalles, ingrese a la plataforma de Fossil Energies.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${supabaseUrl}" style="background-color: #0EA5E9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Ver en plataforma</a>
            </div>
          </div>
          
          <div style="padding: 15px; text-align: center; color: #666; font-size: 12px;">
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} Fossil Energies. Todos los derechos reservados.</p>
          </div>
        </div>
      `,
    });

    if (emailError) {
      throw new Error(`Error sending email: ${emailError.message}`);
    }

    // Log the report sending to the database
    await supabase.from('report_logs').insert({
      type: 'weekly',
      recipients: recipientEmails,
      status: 'success',
      details: { message: 'Weekly report sent successfully', dateRange }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Weekly report sent successfully', 
      recipients: recipientEmails.length,
      dateRange 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Log error to database
    await supabase.from('report_logs').insert({
      type: 'weekly',
      status: 'error',
      details: { error: error.message }
    });

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
