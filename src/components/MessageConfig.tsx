import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageConfigProps {
  onMessageChange: (message: string) => void;
}

const MessageConfig: React.FC<MessageConfigProps> = ({ onMessageChange }) => {
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Carregar mensagem salva
    const savedMessage = localStorage.getItem('whatsapp_message');
    if (savedMessage) {
      setMessage(savedMessage);
      onMessageChange(savedMessage);
    } else {
      // Mensagem padrão
      const defaultMessage = "Olá, tudo bem? Espero que sim! Estou entrando em contato para compartilhar uma novidade incrível que pode ser do seu interesse. Você tem alguns minutos para conversarmos?";
      setMessage(defaultMessage);
      onMessageChange(defaultMessage);
    }
  }, []);

  const handleSave = () => {
    if (!message.trim()) {
      toast({
        title: "Erro",
        description: "A mensagem não pode estar vazia",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('whatsapp_message', message);
    onMessageChange(message);
    
    toast({
      title: "Sucesso",
      description: "Mensagem salva com sucesso!"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Configurar Mensagem
        </CardTitle>
        <CardDescription>
          Personalize a mensagem que será enviada. Use {'{nome}'} para incluir o nome do contato.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="message">Mensagem</Label>
          <Textarea
            id="message"
            placeholder="Digite sua mensagem aqui..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[200px] resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Caracteres: {message.length}
          </p>
        </div>

        <div className="p-3 bg-primary/10 rounded-lg">
          <p className="text-sm text-primary">
            <strong>Dica:</strong> Use {'{nome}'} para personalizar com o nome de cada contato.
            Exemplo: "Olá {'{nome}'}, como vai?"
          </p>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Salvar Mensagem
        </Button>
      </CardContent>
    </Card>
  );
};

export default MessageConfig;
