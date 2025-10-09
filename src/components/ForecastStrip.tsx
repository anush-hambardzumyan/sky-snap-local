import { Cloud, CloudRain, Sun, CloudDrizzle } from "lucide-react";
import { Card } from "./ui/card";
import { format, isToday } from "date-fns";

interface ForecastDay {
  date: string;
  minTemp: number;
  maxTemp: number;
  condition: string;
}

interface ForecastStripProps {
  forecasts: ForecastDay[];
}

const getWeatherIcon = (condition: string, size = "h-8 w-8") => {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes("rain")) return <CloudRain className={`${size} text-primary`} />;
  if (lowerCondition.includes("cloud")) return <Cloud className={`${size} text-primary`} />;
  if (lowerCondition.includes("partly")) return <CloudDrizzle className={`${size} text-primary`} />;
  return <Sun className={`${size} text-accent`} />;
};

export const ForecastStrip = ({ forecasts }: ForecastStripProps) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
      {forecasts.map((forecast, index) => {
        const date = new Date(forecast.date);
        const isTodayDate = isToday(date);

        return (
          <Card
            key={index}
            className={`bg-gradient-card p-4 text-center transition-all hover:shadow-md ${
              isTodayDate ? "ring-2 ring-primary" : ""
            } animate-slide-in`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <p className="text-sm font-medium text-muted-foreground">
              {isTodayDate ? "Today" : format(date, "EEE")}
            </p>
            <p className="mb-3 text-xs text-muted-foreground">{format(date, "MMM d")}</p>
            
            <div className="flex justify-center mb-3">
              {getWeatherIcon(forecast.condition, "h-10 w-10")}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {Math.round(forecast.maxTemp)}° / {Math.round(forecast.minTemp)}°
              </p>
              <p className="text-xs font-medium">{forecast.condition}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
