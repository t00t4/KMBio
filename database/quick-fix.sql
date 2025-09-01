-- SCRIPT DE CORREÇÃO RÁPIDA
-- Execute este script no SQL Editor do Supabase para resolver o problema do trigger

-- 1. Criar função RPC para criar perfil (fallback)
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

-- 2. Dar permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;

-- 3. Recriar o trigger (caso não esteja funcionando)
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

-- 4. Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Verificar se funcionou
SELECT 'Setup completo! Trigger e função RPC criados.' as status;