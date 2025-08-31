import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Stethoscope, Plus, LogOut, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    recentPatients: [],
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const res = await fetch("https://327e33ee9be8.ngrok-free.app/api/db_info");
      if (!res.ok) throw new Error("Failed to fetch db_info");
      const data = await res.json();

      setPatients(data.db_info || []);
      setStats({
        totalPatients: data.db_info?.length || 0,
        recentPatients: data.db_info?.slice(0, 3) || [],
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Appointment booked': return 'bg-primary text-primary-foreground';
      case 'Not Vaccinated': return 'bg-warning text-warning-foreground';
      case 'Vaccinated': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-primary">
                <Heart className="h-6 w-6 fill-current" />
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">COSMO HOSPITAL</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user.user_metadata?.full_name || user.email}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
            <Button variant="outline" onClick={()=>{
            }} className="gap-2">
              <LogOut className="h-4 w-4" />
              Video Call
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground">Registered in system</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Patients */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Patients</CardTitle>
              <CardDescription>Latest registered patients</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentPatients.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No patients found</p>
              ) : (
                <div className="space-y-4">
                  {stats.recentPatients.map((p: any) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.Doctor_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Age: {p.age} | Weight: {p.weight}kg
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(p.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Patients */}
          <Card>
            <CardHeader>
              <CardTitle>All Patients</CardTitle>
              <CardDescription>Database records</CardDescription>
            </CardHeader>
            <CardContent>
              {patients.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No patients in database</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {patients.map((p: any) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.address}</p>
                        <p className="text-sm text-muted-foreground">{p.Doctor_name}</p>
                      </div>
                      <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


