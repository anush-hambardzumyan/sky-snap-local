import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Cloud, Sun, CloudRain, MapPin, TrendingUp } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Cloud className="h-8 w-8" />
            <span>DailySky</span>
          </div>
          <div className="flex gap-3">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center gap-4">
            <Sun className="h-16 w-16 text-accent animate-float" />
            <Cloud className="h-16 w-16 text-primary animate-float" style={{ animationDelay: "0.5s" }} />
            <CloudRain className="h-16 w-16 text-primary animate-float" style={{ animationDelay: "1s" }} />
          </div>

          <h1 className="mb-6 text-5xl font-bold md:text-6xl">
            Welcome to <span className="text-primary">DailySky</span>
          </h1>
          <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
            Your personal weather companion. Track weather for cities worldwide,
            save your favorites, and get accurate 7-day forecasts.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link to="/cities">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Explore Cities
              </Button>
            </Link>
          </div>

          <div className="mt-20 grid gap-8 md:grid-cols-3">
            <div className="rounded-lg bg-gradient-card p-6 shadow-lg animate-fade-in">
              <MapPin className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">Track Any City</h3>
              <p className="text-muted-foreground">
                Search and save your favorite cities from around the world
              </p>
            </div>

            <div className="rounded-lg bg-gradient-card p-6 shadow-lg animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <Cloud className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">Real-time Weather</h3>
              <p className="text-muted-foreground">
                Get current temperature, humidity, and weather conditions
              </p>
            </div>

            <div className="rounded-lg bg-gradient-card p-6 shadow-lg animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <TrendingUp className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">7-Day Forecasts</h3>
              <p className="text-muted-foreground">
                Plan ahead with detailed daily forecasts for each city
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
