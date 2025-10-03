import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type TimeFilter = 'today' | 'week' | 'month' | 'year';

const Dashboard = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<TimeFilter>('today');
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    year: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, filter]);

  const fetchStats = async () => {
    if (!user) return;

    setLoading(true);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    try {
      const { data: allEntries } = await supabase
        .from('sales_entries')
        .select('cost, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (allEntries) {
        const today = allEntries
          .filter(e => new Date(e.created_at) >= startOfToday)
          .reduce((sum, e) => sum + Number(e.cost), 0);

        const week = allEntries
          .filter(e => new Date(e.created_at) >= startOfWeek)
          .reduce((sum, e) => sum + Number(e.cost), 0);

        const month = allEntries
          .filter(e => new Date(e.created_at) >= startOfMonth)
          .reduce((sum, e) => sum + Number(e.cost), 0);

        const year = allEntries
          .filter(e => new Date(e.created_at) >= startOfYear)
          .reduce((sum, e) => sum + Number(e.cost), 0);

        setStats({ today, week, month, year });

        // Prepare chart data based on filter
        const grouped = groupDataByFilter(allEntries, filter);
        setChartData(grouped);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupDataByFilter = (data: any[], filter: TimeFilter) => {
    const now = new Date();
    let result: any[] = [];

    if (filter === 'today') {
      // Group by hour
      const hours = Array.from({ length: 24 }, (_, i) => i);
      result = hours.map(hour => {
        const hourData = data.filter(e => {
          const date = new Date(e.created_at);
          return date.getHours() === hour && 
                 date.toDateString() === now.toDateString();
        });
        return {
          name: `${hour}:00`,
          sales: hourData.reduce((sum, e) => sum + Number(e.cost), 0)
        };
      });
    } else if (filter === 'week') {
      // Last 7 days
      result = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - i));
        const dayData = data.filter(e => 
          new Date(e.created_at).toDateString() === date.toDateString()
        );
        return {
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          sales: dayData.reduce((sum, e) => sum + Number(e.cost), 0)
        };
      });
    } else if (filter === 'month') {
      // Last 30 days grouped by week
      result = Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - ((3 - i) * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        const weekData = data.filter(e => {
          const date = new Date(e.created_at);
          return date >= weekStart && date < weekEnd;
        });
        
        return {
          name: `Week ${i + 1}`,
          sales: weekData.reduce((sum, e) => sum + Number(e.cost), 0)
        };
      });
    } else {
      // Year - group by month
      result = Array.from({ length: 12 }, (_, i) => {
        const monthData = data.filter(e => {
          const date = new Date(e.created_at);
          return date.getMonth() === i && date.getFullYear() === now.getFullYear();
        });
        return {
          name: new Date(now.getFullYear(), i, 1).toLocaleDateString('en-US', { month: 'short' }),
          sales: monthData.reduce((sum, e) => sum + Number(e.cost), 0)
        };
      });
    }

    return result;
  };

  const statCards = [
    { title: 'Today', value: stats.today, icon: Clock, color: 'text-primary' },
    { title: 'This Week', value: stats.week, icon: Calendar, color: 'text-blue-500' },
    { title: 'This Month', value: stats.month, icon: TrendingUp, color: 'text-purple-500' },
    { title: 'This Year', value: stats.year, icon: DollarSign, color: 'text-green-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold">Dashboard</h1>
        <Select value={filter} onValueChange={(value: TimeFilter) => setFilter(value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-card hover:shadow-elegant transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">
                  ₹{loading ? '...' : stat.value.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
