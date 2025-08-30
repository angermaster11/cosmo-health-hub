import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface DoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function DoctorDialog({ open, onOpenChange, onSuccess }: DoctorDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience_years: '',
    consultation_fee: '',
    available_hours: '',
    available_days: [] as string[],
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleDayChange = (day: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        available_days: [...formData.available_days, day]
      });
    } else {
      setFormData({
        ...formData,
        available_days: formData.available_days.filter(d => d !== day)
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('doctors')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          specialization: formData.specialization,
          qualification: formData.qualification,
          experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
          consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null,
          available_hours: formData.available_hours,
          available_days: formData.available_days,
        });

      if (error) throw error;

      toast.success('Doctor added successfully!');
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        qualification: '',
        experience_years: '',
        consultation_fee: '',
        available_hours: '',
        available_days: [],
      });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error adding doctor:', error);
      if (error.code === '23505') {
        toast.error('A doctor with this email already exists');
      } else {
        toast.error('Failed to add doctor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Doctor</DialogTitle>
          <DialogDescription>
            Add a new doctor to the hospital system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter doctor's name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization *</Label>
              <Input
                id="specialization"
                type="text"
                placeholder="e.g., Cardiology, Pediatrics"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                type="text"
                placeholder="e.g., MD, MBBS, PhD"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience_years">Experience (Years)</Label>
              <Input
                id="experience_years"
                type="number"
                placeholder="Years of experience"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                min="0"
                max="50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultation_fee">Consultation Fee ($)</Label>
              <Input
                id="consultation_fee"
                type="number"
                step="0.01"
                placeholder="Consultation fee"
                value={formData.consultation_fee}
                onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="available_hours">Available Hours</Label>
              <Input
                id="available_hours"
                type="text"
                placeholder="e.g., 9:00 AM - 5:00 PM"
                value={formData.available_hours}
                onChange={(e) => setFormData({ ...formData, available_hours: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Available Days</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={formData.available_days.includes(day)}
                    onCheckedChange={(checked) => handleDayChange(day, checked as boolean)}
                  />
                  <Label htmlFor={day} className="text-sm">
                    {day}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Doctor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}