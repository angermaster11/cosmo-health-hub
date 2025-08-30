import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Stethoscope, Plus, LogOut, Heart } from 'lucide-react';
import { toast } from 'sonner';
import AppointmentDialog from '@/components/AppointmentDialog';
import DoctorDialog from '@/components/DoctorDialog';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const [stats, setStats] = useState({
    appointments: 0,
    doctors: 0,
    recentAppointments: [],
  });
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showDoctorDialog, setShowDoctorDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors (name, specialization)
        `)
        .eq('patient_id', user?.id)
        .order('appointment_date', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      // Load all doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('*')
        .order('name');

      if (doctorsError) throw doctorsError;

      setAppointments(appointmentsData || []);
      setDoctors(doctorsData || []);
      setStats({
        appointments: appointmentsData?.length || 0,
        doctors: doctorsData?.length || 0,
        recentAppointments: appointmentsData?.slice(0, 3) || [],
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
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
      case 'scheduled': return 'bg-primary text-primary-foreground';
      case 'completed': return 'bg-success text-success-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      case 'no-show': return 'bg-warning text-warning-foreground';
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
                <p className="text-sm text-muted-foreground">Welcome back, {user.user_metadata?.full_name || user.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.appointments}</div>
              <p className="text-xs text-muted-foreground">Total scheduled</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Doctors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.doctors}</div>
              <p className="text-xs text-muted-foreground">Specialists available</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => setShowAppointmentDialog(true)}
              >
                Book Appointment
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => setShowDoctorDialog(true)}
              >
                Add Doctor
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Appointments</CardTitle>
              <CardDescription>Your latest scheduled appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentAppointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No appointments scheduled</p>
              ) : (
                <div className="space-y-4">
                  {stats.recentAppointments.map((appointment: any) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium">{appointment.doctors?.name}</p>
                        <p className="text-sm text-muted-foreground">{appointment.doctors?.specialization}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                        </p>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Doctors */}
          <Card>
            <CardHeader>
              <CardTitle>Available Doctors</CardTitle>
              <CardDescription>Our medical specialists</CardDescription>
            </CardHeader>
            <CardContent>
              {doctors.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No doctors available</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {doctors.slice(0, 5).map((doctor: any) => (
                    <div key={doctor.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium">{doctor.name}</p>
                        <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                        <p className="text-sm text-muted-foreground">{doctor.experience_years} years experience</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${doctor.consultation_fee}</p>
                        <p className="text-sm text-muted-foreground">consultation</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <AppointmentDialog 
        open={showAppointmentDialog}
        onOpenChange={setShowAppointmentDialog}
        doctors={doctors}
        onSuccess={loadDashboardData}
      />
      
      <DoctorDialog 
        open={showDoctorDialog}
        onOpenChange={setShowDoctorDialog}
        onSuccess={loadDashboardData}
      />
    </div>
  );
}