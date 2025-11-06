import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const dbconectaToken = Deno.env.get('DBCONECTA_TOKEN')!

interface Contact {
  name: string
  phone: string
}

interface SendRequest {
  contacts: Contact[]
  message: string
  csvUploadId?: string
  apiToken?: string
  instanceName?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { contacts, message, csvUploadId, apiToken, instanceName } = await req.json() as SendRequest

    // Validar se token e instância foram fornecidos
    if (!apiToken || !instanceName) {
      return new Response(JSON.stringify({ 
        error: 'Token da API e nome da instância são obrigatórios' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = apiToken
    const instance = instanceName

    console.log(`Iniciando envio para ${contacts.length} contatos`)
    console.log(`Usando instância: ${instance}`)

    // Criar registro na tabela csv_uploads se não foi fornecido
    let uploadId = csvUploadId
    if (!uploadId) {
      const { data: upload, error: uploadError } = await supabase
        .from('csv_uploads')
        .insert({
          filename: 'envio_direto.csv',
          total_contacts: contacts.length,
          status: 'processing'
        })
        .select()
        .single()

      if (uploadError) {
        console.error('Erro ao criar upload:', uploadError)
        return new Response(JSON.stringify({ error: 'Erro ao criar registro de upload' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      uploadId = upload.id
    }

    // Processar envios em background
    const processContacts = async () => {
      for (const contact of contacts) {
        try {
          // Criar log inicial
          const { data: log, error: logError } = await supabase
            .from('sending_logs')
            .insert({
              csv_upload_id: uploadId,
              contact_name: contact.name,
              phone_number: contact.phone,
              message_text: message,
              status: 'sending'
            })
            .select()
            .single()

          if (logError) {
            console.error('Erro ao criar log:', logError)
            continue
          }

          // Formatar número (remover caracteres especiais e adicionar código do país se necessário)
          let formattedPhone = contact.phone.replace(/\D/g, '')
          if (!formattedPhone.startsWith('55')) {
            formattedPhone = '55' + formattedPhone
          }

          // Preparar mensagem (substituir ou remover {nome})
          let finalMessage = message
          if (contact.name && contact.name !== 'Nome não informado') {
            finalMessage = message.replace(/{nome}/g, contact.name)
          } else {
            // Remove {nome} e ajusta pontuação
            finalMessage = message
              .replace(/Olá {nome},?\s*/gi, 'Olá! ')
              .replace(/Oi {nome},?\s*/gi, 'Oi! ')
              .replace(/{nome},?\s*/g, '')
          }

          // Enviar mensagem via Evolution API
          console.log('Enviando para:', contact.name, 'Token:', token.substring(0, 8) + '...');
          console.log('Número formatado:', formattedPhone);
          console.log('Mensagem:', finalMessage);
          
          const apiResponse = await fetch(`https://api.dbconecta.com/message/sendText/${instance}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': token
            },
            body: JSON.stringify({
              number: formattedPhone,
              text: finalMessage
            })
          })

          console.log('Status da resposta:', apiResponse.status);
          const responseText = await apiResponse.text();
          console.log('Resposta completa:', responseText);

          if (apiResponse.ok) {
            // Atualizar log como sucesso
            await supabase
              .from('sending_logs')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('id', log.id)

            console.log(`Mensagem enviada para ${contact.name} (${contact.phone})`)
          } else {
            console.log('Erro na resposta da API - Status:', apiResponse.status);
            console.log('Headers da resposta:', Object.fromEntries(apiResponse.headers.entries()));
            
            // Atualizar log como erro
            await supabase
              .from('sending_logs')
              .update({
                status: 'error',
                error_message: `Erro da Evolution API (${apiResponse.status}): ${responseText}`
              })
              .eq('id', log.id)

            console.error(`Erro ao enviar para ${contact.name}:`, responseText)
          }

          // Delay entre envios para evitar spam
          await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
          console.error(`Erro geral ao processar ${contact.name}:`, error)
          
          // Tentar atualizar log como erro
          try {
            await supabase
              .from('sending_logs')
              .insert({
                csv_upload_id: uploadId,
                contact_name: contact.name,
                phone_number: contact.phone,
                message_text: message,
                status: 'error',
                error_message: error.message
              })
          } catch (logError) {
            console.error('Erro ao criar log de erro:', logError)
          }
        }
      }

      // Atualizar status do upload como concluído
      await supabase
        .from('csv_uploads')
        .update({ status: 'completed' })
        .eq('id', uploadId)

      console.log('Processamento concluído')
    }

    // Iniciar processamento em background
    EdgeRuntime.waitUntil(processContacts())

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Envio iniciado com sucesso',
      uploadId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Erro geral:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})