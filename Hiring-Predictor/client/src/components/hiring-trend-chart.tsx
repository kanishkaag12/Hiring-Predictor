import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface HiringTrendChartProps {
  data: any[];
}

export default function HiringTrendChart({ data }: HiringTrendChartProps) {
  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorOpenings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              borderColor: "hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "var(--shadow-md)"
            }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Area 
            type="monotone" 
            dataKey="applications" 
            stroke="hsl(var(--chart-2))" 
            fillOpacity={1} 
            fill="url(#colorApps)" 
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="openings" 
            stroke="hsl(var(--chart-1))" 
            fillOpacity={1} 
            fill="url(#colorOpenings)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}