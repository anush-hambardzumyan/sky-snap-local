import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { WeatherCard } from "@/components/WeatherCard";
import { ForecastStrip } from "@/components/ForecastStrip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface CityWeather {
  id: string;
  cityName: string;
  country: string;
  temperature: number;
  humidity: number;
  condition: string;
  recordedAt: string;
  forecasts: Array<{
    date: string;
    minTemp: number;
    maxTemp: number;
    condition: string;
  }>;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<CityWeather[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    try {
      // Get user's favorite cities
      const { data: preferences, error: prefError } = await supabase
        .from("user_preferences")
        .select(`
          city_id,
          cities (
            id,
            city_name,
            country
          )
        `)
        .eq("user_id", user!.id);

      if (prefError) throw prefError;

      if (!preferences || preferences.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Get weather data for each city
      const cityWeatherPromises = preferences.map(async (pref: any) => {
        const city = pref.cities;
        
        // Get latest weather
        const { data: weather } = await supabase
          .from("weather_data")
          .select("*")
          .eq("city_id", city.id)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .single();

        // Get 7-day forecast
        const { data: forecasts } = await supabase
          .from("forecasts")
          .select("*")
          .eq("city_id", city.id)
          .order("date", { ascending: true })
          .limit(7);

        return {
          id: city.id,
          cityName: city.city_name,
          country: city.country,
          temperature: weather?.temperature || 0,
          humidity: weather?.humidity || 0,
          condition: weather?.condition || "Unknown",
          recordedAt: weather?.recorded_at || new Date().toISOString(),
          forecasts: (forecasts || []).map((f: any) => ({
            date: f.date,
            minTemp: f.min_temp,
            maxTemp: f.max_temp,
            condition: f.condition,
          })),
        };
      });

      const cityWeatherData = await Promise.all(cityWeatherPromises);
      setFavorites(cityWeatherData);
    } catch (error: any) {
      toast.error("Failed to load favorites");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Your Weather Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Track weather for your favorite cities
          </p>
        </div>

        {favorites.length === 0 ? (
          <Card className="bg-gradient-card p-12 text-center">
            <MapPin className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">No favorite cities yet</h2>
            <p className="mt-2 text-muted-foreground">
              Start adding cities to track their weather
            </p>
            <Button className="mt-6" onClick={() => navigate("/cities")}>
              Browse Cities
            </Button>
          </Card>
        ) : (
          <div className="space-y-12">
            {favorites.map((city) => (
              <div key={city.id} className="space-y-6">
                <WeatherCard
                  cityName={city.cityName}
                  country={city.country}
                  temperature={city.temperature}
                  humidity={city.humidity}
                  condition={city.condition}
                  recordedAt={city.recordedAt}
                />
                
                {city.forecasts.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-xl font-semibold">7-Day Forecast</h3>
                    <ForecastStrip forecasts={city.forecasts} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
