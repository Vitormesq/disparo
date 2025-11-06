import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Rocket, Eye, EyeOff, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ContactsPreviewProps {
  file: File;
  data: any[];
  onStartSending: () => void;
  isProcessing: boolean;
}

const ContactsPreview: React.FC<ContactsPreviewProps> = ({ 
  file, 
  data, 
  onStartSending, 
  isProcessing 
}) => {
  const [showPreview, setShowPreview] = React.useState(true);
  
  // Detectar automaticamente as colunas de nome e telefone
  const detectColumns = () => {
    if (data.length === 0) return { nameCol: '', phoneCol: '' };
    
    const headers = Object.keys(data[0]);
    
    // Buscar coluna de nome
    const nameCol = headers.find(header => 
      /nome|name|cliente|contact/i.test(header)
    ) || headers[0];
    
    // Buscar coluna de telefone
    const phoneCol = headers.find(header => 
      /telefone|phone|whatsapp|celular|mobile|tel|numero/i.test(header)
    ) || headers.find(header => header !== nameCol) || headers[1];
    
    return { nameCol, phoneCol };
  };

  const { nameCol, phoneCol } = detectColumns();
  const validContacts = data.filter(row => row[nameCol] && row[phoneCol]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Contatos Carregados</h2>
            <p className="text-sm text-muted-foreground">{file.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <Badge variant="outline" className="mb-1">
              {validContacts.length} contatos válidos
            </Badge>
            <p className="text-xs text-muted-foreground">
              de {data.length} total
            </p>
          </div>
          
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
            size="sm"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Detecção automática de colunas */}
      <div className="mb-4 p-4 bg-accent/30 rounded-lg border border-accent">
        <h3 className="font-medium mb-2">Colunas detectadas automaticamente:</h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Nome: {nameCol}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              Telefone: {phoneCol}
            </Badge>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="mb-6">
          <h3 className="font-medium mb-3">Preview dos contatos:</h3>
          <ScrollArea className="h-64 border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 10).map((row, index) => {
                  const name = row[nameCol];
                  const phone = row[phoneCol];
                  const isValid = name && phone;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {name || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {phone || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {isValid ? (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                            Válido
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                            Inválido
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {data.length > 10 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      ... e mais {data.length - 10} contatos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={onStartSending}
          disabled={isProcessing || validContacts.length === 0}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all group"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" />
              Iniciar Envio ({validContacts.length} contatos)
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default ContactsPreview;