import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(220 70% 55%)', 'hsl(280 90% 65%)', 'hsl(200 80% 50%)'];

const Analytics = () => {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [yearlyData, setYearlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: entries } = await supabase
        .from('sales_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (entries) {
        processWeeklyData(entries);
        processMonthlyData(entries);
        processYearlyData(entries);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyData = (entries: any[]) => {
    const now = new Date();
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      const dayEntries = entries.filter(e => 
        new Date(e.created_at).toDateString() === date.toDateString()
      );
      
      return {
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: dayEntries.reduce((sum, e) => sum + Number(e.cost), 0),
        items: dayEntries.reduce((sum, e) => sum + Number(e.total_items), 0),
      };
    });
    setWeeklyData(weekData);
  };

  const processMonthlyData = (entries: any[]) => {
    const now = new Date();
    const monthData = Array.from({ length: 4 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - ((3 - i) * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekEntries = entries.filter(e => {
        const date = new Date(e.created_at);
        return date >= weekStart && date < weekEnd;
      });
      
      return {
        name: `Week ${i + 1}`,
        sales: weekEntries.reduce((sum, e) => sum + Number(e.cost), 0),
        items: weekEntries.reduce((sum, e) => sum + Number(e.total_items), 0),
      };
    });
    setMonthlyData(monthData);
  };

  const processYearlyData = (entries: any[]) => {
    const now = new Date();
    const yearData = Array.from({ length: 12 }, (_, i) => {
      const monthEntries = entries.filter(e => {
        const date = new Date(e.created_at);
        return date.getMonth() === i && date.getFullYear() === now.getFullYear();
      });
      
      return {
        name: new Date(now.getFullYear(), i, 1).toLocaleDateString('en-US', { month: 'short' }),
        sales: monthEntries.reduce((sum, e) => sum + Number(e.cost), 0),
      };
    });
    setYearlyData(yearData);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl sm:text-4xl font-bold">Analytics</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
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
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Weekly Items Sold</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={weeklyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, items }) => `${name}: ${items}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="items"
                  >
                    {weeklyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Monthly Sales (Last 4 Weeks)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
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
                  <Bar dataKey="sales" fill="hsl(220 70% 55%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Yearly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyData}>
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
                  <Bar dataKey="sales" fill="hsl(280 90% 65%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
