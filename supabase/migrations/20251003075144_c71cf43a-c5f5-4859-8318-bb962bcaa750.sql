-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username text UNIQUE;

-- Update the handle_new_user function to generate username with name + random number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_name text;
  random_num text;
  new_username text;
  counter integer := 0;
BEGIN
  -- Get the base name and clean it
  base_name := LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'name', 'user'), '[^a-zA-Z0-9]', '', 'g'));
  
  -- Generate random number
  random_num := LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
  new_username := base_name || random_num;
  
  -- Ensure username is unique
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) AND counter < 10 LOOP
    random_num := LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
    new_username := base_name || random_num;
    counter := counter + 1;
  END LOOP;
  
  INSERT INTO public.profiles (id, email, name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    new_username
  );
  RETURN NEW;
END;
$function$;