import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Stethoscope, Calendar, Users, Shield, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="h-12 w-12 text-primary fill-current" />
              <Stethoscope className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome to COSMO HOSPITAL</h1>
            <p className="text-xl text-muted-foreground mb-6">
              You're already logged in! Access your dashboard to manage appointments and view doctors.
            </p>

              <Button size="lg" className="gap-2" onClick={() => navigate('/dashboard')}>
                <Calendar className="h-5 w-5" />
                Go to Dashboard
              </Button>
            
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Heart className="h-16 w-16 text-primary fill-current" />
            <Stethoscope className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            COSMO HOSPITAL
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your comprehensive healthcare management system. Book appointments, manage medical records, 
            and connect with our expert doctors - all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                <Calendar className="h-5 w-5" />
                Get Started
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="gap-2">
                <Users className="h-5 w-5" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center">
              <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Easy Appointments</CardTitle>
              <CardDescription>
                Book appointments with our specialist doctors quickly and easily
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Schedule appointments online</li>
                <li>• Choose from available time slots</li>
                <li>• Manage appointment status</li>
                <li>• Receive appointment reminders</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Expert Doctors</CardTitle>
              <CardDescription>
                Access to qualified specialists across various medical fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Cardiology specialists</li>
                <li>• Pediatric care</li>
                <li>• Orthopedic surgeons</li>
                <li>• General medicine</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Secure & Reliable</CardTitle>
              <CardDescription>
                Your medical data is protected with enterprise-grade security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• HIPAA compliant</li>
                <li>• Encrypted data storage</li>
                <li>• 24/7 system monitoring</li>
                <li>• Secure patient portal</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto border-primary/20 bg-primary/5">
            <CardHeader>
              <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
              <CardDescription className="text-base">
                Join thousands of patients who trust COSMO HOSPITAL for their healthcare needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  <Heart className="h-5 w-5 fill-current" />
                  Create Your Account
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
