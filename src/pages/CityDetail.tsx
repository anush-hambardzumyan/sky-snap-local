import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { WeatherCard } from "@/components/WeatherCard";
import { ForecastStrip } from "@/components/ForecastStrip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Heart, ArrowLeft, MapPin } from "lucide-react";
import { toast } from "sonner";

interface CityData {
  id: string;
  city_name: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  recorded_at: string;
}

interface Forecast {
  date: string;
  min_temp: number;
  max_temp: number;
  condition: string;
}

export default function CityDetail() {
  const { cityId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<CityData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && cityId) {
      loadCityData();
      checkFavorite();
    }
  }, [user, cityId]);

  const loadCityData = async () => {
    try {
      // Get city info
      const { data: cityData, error: cityError } = await supabase
        .from("cities")
        .select("*")
        .eq("id", cityId)
        .single();

      if (cityError) throw cityError;
      setCity(cityData);

      // Get latest weather
      const { data: weatherData, error: weatherError } = await supabase
        .from("weather_data")
        .select("*")
        .eq("city_id", cityId)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single();

      if (weatherError && weatherError.code !== "PGRST116") throw weatherError;
      setWeather(weatherData);

      // Get forecasts
      const { data: forecastData, error: forecastError } = await supabase
        .from("forecasts")
        .select("*")
        .eq("city_id", cityId)
        .order("date", { ascending: true })
        .limit(7);

      if (forecastError) throw forecastError;
      setForecasts(forecastData || []);
    } catch (error: any) {
      toast.error("Failed to load city data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", user!.id)
        .eq("city_id", cityId)
        .maybeSingle();

      if (error) throw error;
      setIsFavorite(!!data);
    } catch (error: any) {
      console.error("Failed to check favorite:", error);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("user_preferences")
          .delete()
          .eq("user_id", user!.id)
          .eq("city_id", cityId);

        if (error) throw error;
        setIsFavorite(false);
        toast.success("Removed from favorites");
      } else {
        const { error } = await supabase
          .from("user_preferences")
          .insert({ user_id: user!.id, city_id: cityId });

        if (error) throw error;
        setIsFavorite(true);
        toast.success("Added to favorites");
      }
    } catch (error: any) {
      toast.error("Failed to update favorites");
      console.error(error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!city) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="bg-gradient-card p-12 text-center">
            <MapPin className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">City not found</h2>
            <Button className="mt-6" onClick={() => navigate("/cities")}>
              Back to Cities
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/cities")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cities
        </Button>

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold">{city.city_name}</h1>
            <p className="mt-2 text-xl text-muted-foreground">{city.country}</p>
            {city.latitude && city.longitude && (
              <p className="mt-1 text-sm text-muted-foreground">
                {city.latitude.toFixed(4)}°, {city.longitude.toFixed(4)}°
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={toggleFavorite}
            className="gap-2"
          >
            <Heart
              className={`h-5 w-5 ${
                isFavorite ? "fill-red-500 text-red-500" : ""
              }`}
            />
            {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          </Button>
        </div>

        <div className="space-y-8">
          {weather && (
            <WeatherCard
              cityName={city.city_name}
              country={city.country}
              temperature={Number(weather.temperature)}
              humidity={weather.humidity}
              condition={weather.condition}
              recordedAt={weather.recorded_at}
            />
          )}

          {forecasts.length > 0 && (
            <div>
              <h2 className="mb-4 text-2xl font-semibold">7-Day Forecast</h2>
              <ForecastStrip
                forecasts={forecasts.map((f) => ({
                  date: f.date,
                  minTemp: Number(f.min_temp),
                  maxTemp: Number(f.max_temp),
                  condition: f.condition,
                }))}
              />
            </div>
          )}

          {!weather && !forecasts.length && (
            <Card className="bg-gradient-card p-12 text-center">
              <p className="text-lg text-muted-foreground">
                No weather data available for this city
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
