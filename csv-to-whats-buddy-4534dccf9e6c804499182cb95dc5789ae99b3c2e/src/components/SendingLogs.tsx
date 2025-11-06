import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, ListChecks } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface LogEntry {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'sending' | 'success' | 'error' | 'sent';
  message?: string;
  timestamp: Date;
  error?: string;
}

interface SendingLogsProps {
  logs: LogEntry[];
  isProcessing: boolean;
}

const SendingLogs: React.FC<SendingLogsProps> = ({ logs, isProcessing }) => {
  const getStatusIcon = (status: LogEntry['status']) => {
    switch (status) {
      case 'success':
      case 'sent':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'sending':
        return <Clock className="h-4 w-4 text-warning animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: LogEntry['status']) => {
    switch (status) {
      case 'success':
      case 'sent':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Enviado</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Erro</Badge>;
      case 'sending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Enviando</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted/10 text-muted-foreground border-muted/20">Pendente</Badge>;
    }
  };

  const successCount = logs.filter(log => log.status === 'success' || log.status === 'sent').length;
  const errorCount = logs.filter(log => log.status === 'error').length;
  const pendingCount = logs.filter(log => log.status === 'pending' || log.status === 'sending').length;

  if (logs.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum envio realizado ainda.</p>
          <p className="text-sm mt-1">Faça upload de um CSV para começar.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          Logs de Envio
        </h2>
        
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span>{successCount} sucesso</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-destructive rounded-full"></div>
            <span>{errorCount} erro</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-warning rounded-full"></div>
            <span>{pendingCount} pendente</span>
          </div>
        </div>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg bg-card transition-all duration-200 hover:shadow-sm"
            >
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(log.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground truncate">{log.name}</p>
                    {getStatusBadge(log.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{log.phone}</p>
                  {log.error && (
                    <p className="text-xs text-destructive mt-1 bg-destructive/10 px-2 py-1 rounded">
                      {log.error}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground text-right">
                {log.timestamp.toLocaleTimeString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {isProcessing && (
        <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-center gap-2 text-warning">
            <Clock className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">Processando envios...</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default SendingLogs;