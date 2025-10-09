import { Cloud, CloudRain, Sun, CloudDrizzle, Droplets, Calendar } from "lucide-react";
import { Card } from "./ui/card";
import { format } from "date-fns";

interface WeatherCardProps {
  cityName: string;
  country: string;
  temperature: number;
  humidity: number;
  condition: string;
  recordedAt: string;
}

const getWeatherIcon = (condition: string) => {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes("rain")) return <CloudRain className="h-12 w-12 text-primary" />;
  if (lowerCondition.includes("cloud")) return <Cloud className="h-12 w-12 text-primary" />;
  if (lowerCondition.includes("partly")) return <CloudDrizzle className="h-12 w-12 text-primary" />;
  return <Sun className="h-12 w-12 text-accent" />;
};

export const WeatherCard = ({
  cityName,
  country,
  temperature,
  humidity,
  condition,
  recordedAt,
}: WeatherCardProps) => {
  return (
    <Card className="bg-gradient-card p-6 transition-all hover:shadow-lg animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold">{cityName}</h3>
          <p className="text-sm text-muted-foreground">{country}</p>
        </div>
        {getWeatherIcon(condition)}
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-end gap-2">
          <span className="text-5xl font-bold">{Math.round(temperature)}°</span>
          <span className="mb-2 text-xl text-muted-foreground">C</span>
        </div>

        <div className="space-y-2">
          <p className="text-lg font-medium">{condition}</p>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Droplets className="h-4 w-4" />
            <span>Humidity: {humidity}%</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Updated: {format(new Date(recordedAt), "MMM d, h:mm a")}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
