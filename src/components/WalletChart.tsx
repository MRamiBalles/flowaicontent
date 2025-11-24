import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
    { time: "10:00", value: 120 },
    { time: "10:05", value: 132 },
    { time: "10:10", value: 101 },
    { time: "10:15", value: 134 },
    { time: "10:20", value: 190 },
    { time: "10:25", value: 230 },
    { time: "10:30", value: 210 },
];

export const WalletChart = () => {
    return (
        <div className="h-[100px] w-full mt-4 opacity-80 hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                        itemStyle={{ color: '#eab308' }}
                        labelStyle={{ display: 'none' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#eab308"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
