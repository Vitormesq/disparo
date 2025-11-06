-- Criar tabela para armazenar uploads de CSV
CREATE TABLE public.csv_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  total_contacts INTEGER NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para armazenar logs de envio
CREATE TABLE public.sending_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  csv_upload_id UUID REFERENCES public.csv_uploads(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  message_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas (já que não precisamos de autenticação, vamos permitir acesso total)
ALTER TABLE public.csv_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sending_logs ENABLE ROW LEVEL SECURITY;

-- Criar políticas que permitem acesso total (já que é para uso pessoal)
CREATE POLICY "Permitir acesso total aos uploads" 
ON public.csv_uploads 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir acesso total aos logs" 
ON public.sending_logs 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Criar índices para melhor performance
CREATE INDEX idx_sending_logs_csv_upload_id ON public.sending_logs(csv_upload_id);
CREATE INDEX idx_sending_logs_status ON public.sending_logs(status);
CREATE INDEX idx_csv_uploads_upload_date ON public.csv_uploads(upload_date);