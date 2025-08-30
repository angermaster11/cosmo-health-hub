import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctors: any[];
  onSuccess: () => void;
}

export default function AppointmentDialog({ open, onOpenChange, doctors, onSuccess }: AppointmentDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_age: '',
    patient_weight: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    disease_or_vaccination: '',
    symptoms: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          doctor_id: formData.doctor_id,
          patient_name: formData.patient_name,
          patient_age: parseInt(formData.patient_age),
          patient_weight: formData.patient_weight ? parseFloat(formData.patient_weight) : null,
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          disease_or_vaccination: formData.disease_or_vaccination,
          symptoms: formData.symptoms,
          notes: formData.notes,
          status: 'scheduled',
        });

      if (error) throw error;

      toast.success('Appointment booked successfully!');
      setFormData({
        patient_name: '',
        patient_age: '',
        patient_weight: '',
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        disease_or_vaccination: '',
        symptoms: '',
        notes: '',
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDoctor = doctors.find(d => d.id === formData.doctor_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book New Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details to schedule your appointment with our doctors.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient_name">Patient Name *</Label>
              <Input
                id="patient_name"
                type="text"
                placeholder="Enter patient name"
                value={formData.patient_name}
                onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_age">Age *</Label>
              <Input
                id="patient_age"
                type="number"
                placeholder="Enter age"
                value={formData.patient_age}
                onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
                required
                min="1"
                max="120"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_weight">Weight (kg)</Label>
              <Input
                id="patient_weight"
                type="number"
                step="0.1"
                placeholder="Enter weight"
                value={formData.patient_weight}
                onChange={(e) => setFormData({ ...formData, patient_weight: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctor_id">Doctor *</Label>
              <Select
                value={formData.doctor_id}
                onValueChange={(value) => setFormData({ ...formData, doctor_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment_date">Appointment Date *</Label>
              <Input
                id="appointment_date"
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment_time">Appointment Time *</Label>
              <Input
                id="appointment_time"
                type="time"
                value={formData.appointment_time}
                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                required
              />
            </div>
          </div>

          {selectedDoctor && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Selected Doctor:</p>
              <p className="text-sm text-muted-foreground">
                {selectedDoctor.name} - {selectedDoctor.specialization}
              </p>
              <p className="text-sm text-muted-foreground">
                Fee: ${selectedDoctor.consultation_fee} | Available: {selectedDoctor.available_hours}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="disease_or_vaccination">Disease/Vaccination/Purpose</Label>
            <Input
              id="disease_or_vaccination"
              type="text"
              placeholder="e.g., Annual checkup, Vaccination, Cold symptoms"
              value={formData.disease_or_vaccination}
              onChange={(e) => setFormData({ ...formData, disease_or_vaccination: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="symptoms">Symptoms</Label>
            <Textarea
              id="symptoms"
              placeholder="Describe any symptoms or concerns"
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Booking...' : 'Book Appointment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}