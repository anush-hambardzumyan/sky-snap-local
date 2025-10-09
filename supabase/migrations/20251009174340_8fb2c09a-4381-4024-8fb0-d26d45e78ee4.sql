-- Create users profile table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create cities table
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(city_name, country)
);

-- Enable RLS on cities (public read)
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cities"
  ON public.cities FOR SELECT
  USING (true);

-- Create user_preferences table (favorite cities)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, city_id)
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Create weather_data table
CREATE TABLE IF NOT EXISTS public.weather_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  temperature DECIMAL(5,2) NOT NULL,
  humidity INTEGER NOT NULL CHECK (humidity >= 0 AND humidity <= 100),
  condition TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on weather_data (public read)
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weather data"
  ON public.weather_data FOR SELECT
  USING (true);

-- Create forecasts table
CREATE TABLE IF NOT EXISTS public.forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  min_temp DECIMAL(5,2) NOT NULL,
  max_temp DECIMAL(5,2) NOT NULL,
  condition TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(city_id, date)
);

-- Enable RLS on forecasts (public read)
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view forecasts"
  ON public.forecasts FOR SELECT
  USING (true);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert seed cities
INSERT INTO public.cities (city_name, country, latitude, longitude) VALUES
  ('New York', 'USA', 40.7128, -74.0060),
  ('London', 'UK', 51.5074, -0.1278),
  ('Tokyo', 'Japan', 35.6762, 139.6503),
  ('Paris', 'France', 48.8566, 2.3522),
  ('Sydney', 'Australia', -33.8688, 151.2093),
  ('Dubai', 'UAE', 25.2048, 55.2708),
  ('Singapore', 'Singapore', 1.3521, 103.8198),
  ('Los Angeles', 'USA', 34.0522, -118.2437),
  ('Barcelona', 'Spain', 41.3874, 2.1686),
  ('Amsterdam', 'Netherlands', 52.3676, 4.9041),
  ('Berlin', 'Germany', 52.5200, 13.4050),
  ('Rome', 'Italy', 41.9028, 12.4964),
  ('Toronto', 'Canada', 43.6532, -79.3832),
  ('Bangkok', 'Thailand', 13.7563, 100.5018),
  ('Mumbai', 'India', 19.0760, 72.8777)
ON CONFLICT (city_name, country) DO NOTHING;

-- Insert sample weather data
INSERT INTO public.weather_data (city_id, temperature, humidity, condition, recorded_at)
SELECT 
  id,
  20 + (RANDOM() * 15)::DECIMAL(5,2),
  40 + (RANDOM() * 40)::INTEGER,
  CASE (RANDOM() * 5)::INTEGER
    WHEN 0 THEN 'Sunny'
    WHEN 1 THEN 'Cloudy'
    WHEN 2 THEN 'Rainy'
    WHEN 3 THEN 'Partly Cloudy'
    ELSE 'Clear'
  END,
  NOW() - (RANDOM() * INTERVAL '1 hour')
FROM public.cities
ON CONFLICT DO NOTHING;

-- Insert sample forecast data (7 days)
INSERT INTO public.forecasts (city_id, date, min_temp, max_temp, condition)
SELECT 
  cities.id,
  CURRENT_DATE + (days.day || ' days')::INTERVAL,
  15 + (RANDOM() * 10)::DECIMAL(5,2),
  25 + (RANDOM() * 10)::DECIMAL(5,2),
  CASE (RANDOM() * 5)::INTEGER
    WHEN 0 THEN 'Sunny'
    WHEN 1 THEN 'Cloudy'
    WHEN 2 THEN 'Rainy'
    WHEN 3 THEN 'Partly Cloudy'
    ELSE 'Clear'
  END
FROM public.cities
CROSS JOIN (
  SELECT generate_series(0, 6) AS day
) AS days
ON CONFLICT (city_id, date) DO NOTHING;