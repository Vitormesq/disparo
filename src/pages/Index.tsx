import React, { useState } from 'react';
import { Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import ContactsPreview from '@/components/ContactsPreview';
import SendingLogs, { LogEntry } from '@/components/SendingLogs';
import MessageConfig from '@/components/MessageConfig';
import EvolutionConfig from '@/components/EvolutionConfig';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [contactsData, setContactsData] = useState<any[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [evolutionToken, setEvolutionToken] = useState<string>('');
  const [evolutionInstance, setEvolutionInstance] = useState<string>('');
  const { toast } = useToast();

  const handleFileUpload = async (file: File, data: any[]) => {
    setUploadedFile(file);
    setContactsData(data);
    setLogs([]);
    setCurrentUploadId(null);

    // Salvar upload no banco
    try {
      const { data: upload, error } = await supabase
        .from('csv_uploads')
        .insert({
          filename: file.name,
          total_contacts: data.length,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar upload:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar arquivo no banco de dados",
          variant: "destructive"
        });
      } else {
        setCurrentUploadId(upload.id);
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const startLogPolling = () => {
    const interval = setInterval(async () => {
      if (!currentUploadId) return;

      try {
        const { data: logData, error } = await supabase
          .from('sending_logs')
          .select('*')
          .eq('csv_upload_id', currentUploadId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Erro ao buscar logs:', error);
          return;
        }

        const formattedLogs: LogEntry[] = logData.map(log => ({
          id: log.id,
          name: log.contact_name,
          phone: log.phone_number,
          status: log.status === 'sent' ? 'success' : log.status as 'pending' | 'error' | 'sending',
          message: log.message_text,
          timestamp: new Date(log.created_at),
          error: log.error_message || undefined
        }));

        setLogs(formattedLogs);

        // Verificar se todos os envios foram processados
        const pendingCount = formattedLogs.filter(log => 
          log.status === 'pending' || log.status === 'sending'
        ).length;

        if (pendingCount === 0) {
          setIsProcessing(false);
          clearInterval(interval);
        }

      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, 2000);

    // Limpar interval após 5 minutos para evitar polling infinito
    setTimeout(() => {
      clearInterval(interval);
      setIsProcessing(false);
    }, 300000);
  };

  const handleStartSending = async () => {
    if (!contactsData.length || !currentUploadId) {
      toast({
        title: "Erro",
        description: "Nenhum arquivo carregado ou dados não encontrados",
        variant: "destructive"
      });
      return;
    }

    if (!evolutionToken || !evolutionInstance) {
      toast({
        title: "Erro",
        description: "Configure o token e a instância da API Evolution antes de enviar",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Detectar colunas automaticamente
    const headers = Object.keys(contactsData[0]);
    const nameCol = headers.find(header => 
      /nome|name|cliente|contact/i.test(header)
    ) || headers[0];
    const phoneCol = headers.find(header => 
      /telefone|phone|whatsapp|celular|mobile|tel|numero/i.test(header)
    ) || headers.find(header => header !== nameCol) || headers[1];

    // Preparar contatos válidos
    const validContacts = contactsData
      .filter(contact => {
        const phone = contact[phoneCol];
        return phone && phone.toString().trim() !== '';
      })
      .map(contact => ({
        name: contact[nameCol]?.toString() || 'Nome não informado',
        phone: contact[phoneCol]?.toString()
      }));

    if (validContacts.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum contato válido encontrado",
        variant: "destructive"
      });
      setIsProcessing(false);
      return;
    }

    try {
      // Usar mensagem configurada ou padrão
      const messageToSend = currentMessage || "Olá, tudo bem? Espero que sim! Estou entrando em contato para compartilhar uma novidade incrível que pode ser do seu interesse. Você tem alguns minutos para conversarmos?";
      
      // Chamar a Edge Function para enviar mensagens
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          contacts: validContacts,
          message: messageToSend,
          csvUploadId: currentUploadId,
          apiToken: evolutionToken || undefined,
          instanceName: evolutionInstance || undefined
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: `Envio iniciado para ${validContacts.length} contatos`,
      });

      // Iniciar polling para atualizações dos logs
      startLogPolling();

    } catch (error) {
      console.error('Erro ao iniciar envio:', error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar envio das mensagens",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header com Theme Toggle */}
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/70 rounded-2xl shadow-lg shadow-primary/20">
              <Send className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              WhatsApp Bulk Sender
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Envie mensagens personalizadas para seus contatos de forma rápida e eficiente
          </p>
        </div>

        {/* Stats Cards */}
        {logs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in">
            <Card className="p-5 hover:shadow-lg transition-shadow border-success/20 bg-gradient-to-br from-success/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-success/10 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                 <div>
                   <p className="text-3xl font-bold text-success">{logs.filter(l => l.status === 'success').length}</p>
                   <p className="text-sm text-muted-foreground font-medium">Enviadas</p>
                 </div>
              </div>
            </Card>
            <Card className="p-5 hover:shadow-lg transition-shadow border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-destructive/10 rounded-xl">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-destructive">{logs.filter(l => l.status === 'error').length}</p>
                  <p className="text-sm text-muted-foreground font-medium">Com erro</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 hover:shadow-lg transition-shadow border-warning/20 bg-gradient-to-br from-warning/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-warning/10 rounded-xl">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-warning">{logs.filter(l => l.status === 'pending' || l.status === 'sending').length}</p>
                  <p className="text-sm text-muted-foreground font-medium">Pendentes</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <EvolutionConfig 
              onConfigChange={(token, instance) => {
                setEvolutionToken(token);
                setEvolutionInstance(instance);
              }} 
            />

            <MessageConfig onMessageChange={setCurrentMessage} />
            
            <FileUpload onFileUpload={handleFileUpload} />
            
            {uploadedFile && contactsData.length > 0 && (
              <ContactsPreview
                file={uploadedFile}
                data={contactsData}
                onStartSending={handleStartSending}
                isProcessing={isProcessing}
              />
            )}
          </div>

          {/* Right Column */}
          <div>
            <SendingLogs logs={logs} isProcessing={isProcessing} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;