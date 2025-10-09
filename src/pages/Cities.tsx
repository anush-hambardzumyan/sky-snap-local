import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Search, Heart, MapPin } from "lucide-react";
import { toast } from "sonner";

interface City {
  id: string;
  city_name: string;
  country: string;
  isFavorite?: boolean;
}

export default function Cities() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadCities();
      loadFavorites();
    }
  }, [user]);

  const loadCities = async () => {
    try {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("city_name");

      if (error) throw error;
      setCities(data || []);
    } catch (error: any) {
      toast.error("Failed to load cities");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("city_id")
        .eq("user_id", user!.id);

      if (error) throw error;
      setFavorites(new Set(data?.map((p) => p.city_id) || []));
    } catch (error: any) {
      console.error("Failed to load favorites:", error);
    }
  };

  const toggleFavorite = async (cityId: string) => {
    try {
      if (favorites.has(cityId)) {
        // Remove favorite
        const { error } = await supabase
          .from("user_preferences")
          .delete()
          .eq("user_id", user!.id)
          .eq("city_id", cityId);

        if (error) throw error;
        
        setFavorites((prev) => {
          const newFavorites = new Set(prev);
          newFavorites.delete(cityId);
          return newFavorites;
        });
        toast.success("Removed from favorites");
      } else {
        // Add favorite
        const { error } = await supabase
          .from("user_preferences")
          .insert({ user_id: user!.id, city_id: cityId });

        if (error) throw error;
        
        setFavorites((prev) => new Set([...prev, cityId]));
        toast.success("Added to favorites");
      }
    } catch (error: any) {
      toast.error("Failed to update favorites");
      console.error(error);
    }
  };

  const handleCityClick = (cityId: string) => {
    navigate(`/cities/${cityId}`);
  };

  const filteredCities = cities.filter(
    (city) =>
      city.city_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-4xl font-bold">Explore Cities</h1>
          <p className="mt-2 text-muted-foreground">
            Search for cities and add them to your favorites
          </p>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search cities or countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCities.map((city) => (
            <Card
              key={city.id}
              className="bg-gradient-card p-6 transition-all hover:shadow-lg cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div 
                  className="flex-1"
                  onClick={() => handleCityClick(city.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">{city.city_name}</h3>
                  </div>
                  <p className="text-muted-foreground">{city.country}</p>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(city.id);
                  }}
                  className="shrink-0"
                >
                  <Heart
                    className={`h-5 w-5 transition-colors ${
                      favorites.has(city.id)
                        ? "fill-red-500 text-red-500"
                        : "text-muted-foreground hover:text-red-500"
                    }`}
                  />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredCities.length === 0 && (
          <Card className="bg-gradient-card p-12 text-center">
            <Search className="mx-auto h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-lg text-muted-foreground">
              No cities found matching "{searchQuery}"
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
