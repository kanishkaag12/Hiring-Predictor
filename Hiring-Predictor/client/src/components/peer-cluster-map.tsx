import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, ReferenceLine } from "recharts";

interface PeerClusterMapProps {
  data: any[];
}

export default function PeerClusterMap({ data }: PeerClusterMapProps) {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Skills Match" 
            unit="%" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Experience" 
            unit="%" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          />
          <ZAxis type="number" dataKey="z" range={[50, 400]} />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-card border border-border p-2 rounded shadow-lg text-xs">
                    <p className="font-bold mb-1 capitalize">{data.status} Candidate</p>
                    <p>Skills: {data.x}%</p>
                    <p>Experience: {data.y}%</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine x={78} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          <ReferenceLine y={72} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          <Scatter name="Candidates" data={data}>
            {data.map((entry, index) => {
                let fill = "hsl(var(--muted))"; // default rejected/low
                if (entry.status === "interview") fill = "hsl(var(--chart-4))";
                if (entry.status === "offer") fill = "hsl(var(--success))";
                if (entry.status === "user") fill = "hsl(var(--primary))";
                
                return <Cell key={`cell-${index}`} fill={fill} stroke={entry.status === "user" ? "white" : "none"} strokeWidth={2} />;
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}