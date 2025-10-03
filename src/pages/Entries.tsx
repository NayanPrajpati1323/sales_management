import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const Entries = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [todayTotal, setTodayTotal] = useState(0);
  
  const [formData, setFormData] = useState({
    upperItems: '',
    lowerItems: '',
    totalItems: '',
    cost: '',
  });

  useEffect(() => {
    if (user) {
      fetchEntries();
      fetchTodayTotal();
    }
  }, [user, currentPage]);

  const fetchEntries = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from('sales_entries')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      setEntries(data || []);
      if (count) {
        setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      }
    } catch (error: any) {
      toast.error('Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayTotal = async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const { data } = await supabase
        .from('sales_entries')
        .select('cost')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (data) {
        const total = data.reduce((sum, entry) => sum + Number(entry.cost), 0);
        setTodayTotal(total);
      }
    } catch (error) {
      console.error('Error fetching today total:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const upperItems = Number(formData.upperItems);
    const lowerItems = Number(formData.lowerItems);
    const totalItems = Number(formData.totalItems);
    const cost = Number(formData.cost);

    if (isNaN(upperItems) || isNaN(lowerItems) || isNaN(totalItems) || isNaN(cost)) {
      toast.error('Please enter valid numbers');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('sales_entries')
        .insert([
          {
            user_id: user.id,
            upper_items: upperItems,
            lower_items: lowerItems,
            total_items: totalItems,
            cost: cost,
          },
        ]);

      if (error) throw error;

      toast.success('Entry added successfully');
      setFormData({ upperItems: '', lowerItems: '', totalItems: '', cost: '' });
      fetchEntries();
      fetchTodayTotal();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl sm:text-4xl font-bold">Sales Entries</h1>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="upperItems">Upper Items</Label>
              <Input
                id="upperItems"
                type="number"
                value={formData.upperItems}
                onChange={(e) => setFormData({ ...formData, upperItems: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowerItems">Lower Items</Label>
              <Input
                id="lowerItems"
                type="number"
                value={formData.lowerItems}
                onChange={(e) => setFormData({ ...formData, lowerItems: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalItems">Total Items</Label>
              <Input
                id="totalItems"
                type="number"
                value={formData.totalItems}
                onChange={(e) => setFormData({ ...formData, totalItems: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost (₹)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="md:col-span-2 lg:col-span-4" disabled={loading}>
              {loading ? 'Adding...' : 'Add Entry'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>All Entries</CardTitle>
          <div className="text-left sm:text-right">
            <div className="text-sm text-muted-foreground">Today's Total</div>
            <div className="text-xl sm:text-2xl font-bold text-primary">₹{todayTotal.toFixed(2)}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Upper Items</TableHead>
                  <TableHead className="whitespace-nowrap">Lower Items</TableHead>
                  <TableHead className="whitespace-nowrap">Total Items</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No entries yet. Add your first entry above!
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {new Date(entry.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{entry.upper_items}</TableCell>
                      <TableCell>{entry.lower_items}</TableCell>
                      <TableCell>{entry.total_items}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{Number(entry.cost).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-full sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-full sm:w-auto"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Entries;
