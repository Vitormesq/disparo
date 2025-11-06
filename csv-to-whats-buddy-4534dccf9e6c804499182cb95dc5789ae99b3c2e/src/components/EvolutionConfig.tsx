import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EvolutionConfigProps {
  onConfigChange: (token: string, instance: string) => void;
}

const EvolutionConfig = ({ onConfigChange }: EvolutionConfigProps) => {
  const [token, setToken] = useState('');
  const [instance, setInstance] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedToken = localStorage.getItem('evolution_token');
    const savedInstance = localStorage.getItem('evolution_instance');
    
    if (savedToken) setToken(savedToken);
    if (savedInstance) setInstance(savedInstance);
    
    if (savedToken && savedInstance) {
      onConfigChange(savedToken, savedInstance);
    }
  }, [onConfigChange]);

  const handleSave = () => {
    if (!token.trim() || !instance.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o token e a instância",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('evolution_token', token);
    localStorage.setItem('evolution_instance', instance);
    onConfigChange(token, instance);
    
    toast({
      title: "Configuração salva",
      description: "Token e instância atualizados com sucesso"
    });
    
    setIsExpanded(false);
  };

  const hasConfig = token && instance;

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center gap-2">
          {hasConfig ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <Shield className="h-5 w-5 text-primary" />
          )}
          Configuração da API Evolution
        </CardTitle>
        <CardDescription>
          {hasConfig 
            ? `Instância: ${instance} (Clique para editar)`
            : 'Configure o token e a instância do WhatsApp'
          }
        </CardDescription>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Token da API</Label>
            <Input
              id="token"
              type="text"
              placeholder="Cole seu token da API aqui"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instance">Nome da Instância</Label>
            <Input
              id="instance"
              type="text"
              placeholder="Ex: MinhaInstancia"
              value={instance}
              onChange={(e) => setInstance(e.target.value)}
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            Salvar Configuração
          </Button>
        </CardContent>
      )}
    </Card>
  );
};

export default EvolutionConfig;
