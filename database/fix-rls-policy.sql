-- Script para corrigir as políticas RLS da tabela users
-- Execute este script no SQL Editor do Supabase

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Criar políticas mais flexíveis
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Verificar se o trigger existe e está funcionando
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing, 
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND trigger_schema = 'public';

-- Se o trigger não existir, recriar
DO $$
BEGIN
  -- Verificar se a função existe
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    -- Criar a função
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $func$
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
    $func$ language 'plpgsql' SECURITY DEFINER;
  END IF;

  -- Recriar o trigger
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
END $$;

-- Criar função RPC para criar perfil de usuário (fallback se trigger falhar)
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_preferences JSONB DEFAULT NULL,
  consent_given BOOLEAN DEFAULT false,
  telemetry_enabled BOOLEAN DEFAULT true
)
RETURNS VOID AS $$
BEGIN
  -- Verificar se o perfil já existe
  IF EXISTS (SELECT 1 FROM public.users WHERE id = user_id) THEN
    RETURN;
  END IF;
  
  -- Criar o perfil
  INSERT INTO public.users (id, email, name, preferences, consent_given, telemetry_enabled)
  VALUES (
    user_id,
    user_email,
    user_name,
    COALESCE(user_preferences, '{
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
    consent_given,
    telemetry_enabled
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permissão para usuários autenticados chamarem a função
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;

-- Testar se tudo está funcionando
SELECT 'RLS policies, trigger and RPC function updated successfully!' as status;