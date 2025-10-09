import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, User, Mail, Calendar, MapPin, Heart } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Profile {
  username: string;
  created_at: string;
}

interface FavoriteCity {
  id: string;
  city_name: string;
  country: string;
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteCity[]>([]);
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadFavorites();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setUsername(data.username);
    } catch (error: any) {
      toast.error("Failed to load profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error;
      setFavorites(data?.map((p: any) => p.cities) || []);
    } catch (error: any) {
      console.error("Failed to load favorites:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", user!.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
      loadProfile();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeFavorite = async (cityId: string) => {
    try {
      const { error } = await supabase
        .from("user_preferences")
        .delete()
        .eq("user_id", user!.id)
        .eq("city_id", cityId);

      if (error) throw error;
      toast.success("City removed from favorites");
      loadFavorites();
    } catch (error: any) {
      toast.error("Failed to remove city");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Header />
      
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold">Profile</h1>

        <div className="space-y-6">
          <Card className="bg-gradient-card p-6">
            <h2 className="mb-4 text-2xl font-semibold">Account Information</h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    value={user?.email || ""}
                    className="pl-10"
                    disabled
                  />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              {profile && (
                <div>
                  <Label>Member Since</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      value={format(new Date(profile.created_at), "MMMM d, yyyy")}
                      className="pl-10"
                      disabled
                    />
                  </div>
                </div>
              )}

              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Update Profile"}
              </Button>
            </form>
          </Card>

          <Card className="bg-gradient-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Favorite Cities</h2>
            </div>

            {favorites.length === 0 ? (
              <div className="py-8 text-center">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  You haven't added any favorite cities yet
                </p>
                <Button className="mt-4" onClick={() => navigate("/cities")}>
                  Browse Cities
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {favorites.map((city) => (
                  <div
                    key={city.id}
                    className="flex items-center justify-between rounded-lg border bg-background p-4"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{city.city_name}</p>
                        <p className="text-sm text-muted-foreground">{city.country}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/cities/${city.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFavorite(city.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
