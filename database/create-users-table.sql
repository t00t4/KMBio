-- Criar tabela de perfis de usuário no Supabase
-- Execute este script no SQL Editor do Supabase

-- Tabela de perfis de usuário (complementa auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  name VARCHAR(100) NOT NULL,
  preferences JSONB DEFAULT '{
    "fuelUnit": "L/100km",
    "language": "pt-BR",
    "notifications": {
      "realTimeAlerts": true,
      "weeklyReports": true,
      "tips": true,
      "maintenance": true,
      "sound": true,
      "vibration": true
    }
  }'::jsonb,
  consent_given BOOLEAN DEFAULT false,
  telemetry_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, preferences, consent_given, telemetry_enabled)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->'preferences', '{
      "fuelUnit": "L/100km",
      "language": "pt-BR",
      "notifications": {
        "realTimeAlerts": true,
        "weeklyReports": true,
        "tips": true,
        "maintenance": true,
        "sound": true,
        "vibration": true
      }
    }'::jsonb),
    COALESCE((NEW.raw_user_meta_data->>'consent_given')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'telemetry_enabled')::boolean, true)
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();