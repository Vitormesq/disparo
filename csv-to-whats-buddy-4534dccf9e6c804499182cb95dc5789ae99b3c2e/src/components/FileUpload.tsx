import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUp, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileUpload: (file: File, data: any[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return data;
  };

  const parseExcel = async (file: File): Promise<any[]> => {
    // Para Excel, vamos usar uma abordagem simples de leitura do texto
    // Nota: Para produção, seria melhor usar uma lib como xlsx
    const text = await file.text();
    return parseCSV(text);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);

    try {
      let data: any[] = [];
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.csv')) {
        const text = await file.text();
        data = parseCSV(text);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        data = await parseExcel(file);
      } else if (fileName.endsWith('.txt')) {
        const text = await file.text();
        data = parseCSV(text);
      } else {
        toast({
          title: "Formato não suportado ainda",
          description: "Por enquanto, use arquivos CSV, TXT ou Excel.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }
      
      if (data.length === 0) {
        throw new Error('Arquivo vazio ou inválido');
      }

      onFileUpload(file, data);
      
      toast({
        title: "Arquivo carregado!",
        description: `${data.length} contatos encontrados.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao processar arquivo",
        description: "Verifique se o arquivo está formatado corretamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [onFileUpload, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv', '.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    disabled: isUploading
  });

  return (
    <Card className="p-8 transition-all duration-300 hover:shadow-lg">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-primary bg-accent/50 scale-105' 
            : 'border-border hover:border-primary/50 hover:bg-accent/30'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {isUploading ? (
            <div className="animate-pulse-slow">
              <FileText className="h-16 w-16 text-primary" />
            </div>
          ) : (
            <FileUp className={`h-16 w-16 transition-all ${isDragActive ? 'text-primary scale-110' : 'text-primary/70'}`} />
          )}
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {isUploading ? 'Processando arquivo...' : 'Upload de Arquivo'}
            </h3>
            <p className="text-muted-foreground">
              {isDragActive 
                ? 'Solte o arquivo aqui...' 
                : 'Arraste e solte seu arquivo aqui, ou clique para selecionar'
              }
            </p>
          </div>

          {!isUploading && (
            <Button variant="outline" className="mt-4">
              Selecionar Arquivo
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-accent/30 rounded-lg border border-accent">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Formatos aceitos:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>CSV/TXT/Excel</strong>: Primeira linha com cabeçalhos, colunas para nome e telefone</li>
              <li>• <strong>PDF/Word</strong>: Em breve (use CSV por enquanto)</li>
              <li>• Números podem estar em qualquer formato (com ou sem códigos de país)</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FileUpload;