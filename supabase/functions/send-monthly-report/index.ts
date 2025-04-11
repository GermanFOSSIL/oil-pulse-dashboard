
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

    // Check if today is the configured day for monthly report
    const today = new Date();
    const dayOfMonth = today.getDate().toString();

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

    // Check if monthly reports are enabled and if today is the configured day
    if (
      scheduleData?.settings?.monthly?.enabled !== true || 
      scheduleData?.settings?.monthly?.day !== dayOfMonth
    ) {
      return new Response(JSON.stringify({ 
        message: 'Monthly reports are disabled or not scheduled for today',
        today: dayOfMonth,
        configured: scheduleData?.settings?.monthly?.day
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate monthly report data
    // For a real implementation, you would generate the dashboard screenshot here
    // and prepare the monthly statistics
    
    // Send emails to all recipients
    const recipientEmails = recipients.map(r => r.email);
    
    // Calculate previous month
    const prevMonth = new Date(today);
    prevMonth.setMonth(today.getMonth() - 1);
    
    const monthYear = today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'Fossil Energies <reports@fossilenergies.com>',
      to: recipientEmails,
      subject: `Reporte Mensual - ${monthYear}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #8B5CF6; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">Reporte Mensual</h1>
            <p style="margin: 5px 0 0;">${monthYear}</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Estimado usuario,</p>
            <p>Adjunto encontrará el reporte mensual con el análisis completo de test packs y tags del mes.</p>
            
            <div style="background-color: white; border-radius: 4px; padding: 15px; margin: 20px 0; border-left: 4px solid #8B5CF6;">
              <h2 style="margin-top: 0; color: #333;">Resumen Mensual</h2>
              <p>Este es un ejemplo de reporte mensual automático. En una implementación completa, aquí se incluiría:</p>
              <ul>
                <li>Captura del dashboard</li>
                <li>Análisis mensual de KPIs</li>
                <li>Test packs completados este mes</li>
                <li>Tags liberados este mes</li>
                <li>Comparativa con mes anterior</li>
                <li>Proyección para el próximo mes</li>
              </ul>
            </div>
            
            <p>Para más detalles, ingrese a la plataforma de Fossil Energies.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${supabaseUrl}" style="background-color: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Ver en plataforma</a>
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
      type: 'monthly',
      recipients: recipientEmails,
      status: 'success',
      details: { message: 'Monthly report sent successfully', month: monthYear }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Monthly report sent successfully', 
      recipients: recipientEmails.length,
      month: monthYear 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Log error to database
    await supabase.from('report_logs').insert({
      type: 'monthly',
      status: 'error',
      details: { error: error.message }
    });

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
