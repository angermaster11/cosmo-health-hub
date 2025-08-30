-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'patient',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  specialization TEXT NOT NULL,
  qualification TEXT,
  experience_years INTEGER,
  consultation_fee DECIMAL(10,2),
  available_days TEXT[], -- Array of days like ['Monday', 'Tuesday']
  available_hours TEXT, -- Time range like '9:00 AM - 5:00 PM'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_age INTEGER NOT NULL,
  patient_weight DECIMAL(5,2),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
  disease_or_vaccination TEXT,
  symptoms TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for doctors (everyone can view doctors)
CREATE POLICY "Everyone can view doctors" 
ON public.doctors 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can create doctors" 
ON public.doctors 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update doctors" 
ON public.doctors 
FOR UPDATE 
TO authenticated
USING (true);

-- Create policies for appointments
CREATE POLICY "Users can view their own appointments" 
ON public.appointments 
FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "Users can create their own appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update their own appointments" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() = patient_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample doctors
INSERT INTO public.doctors (name, email, phone, specialization, qualification, experience_years, consultation_fee, available_days, available_hours) VALUES
('Dr. Sarah Johnson', 'sarah.johnson@cosmohospital.com', '+1-555-0101', 'Cardiology', 'MD, FACC', 15, 200.00, ARRAY['Monday', 'Tuesday', 'Wednesday', 'Friday'], '9:00 AM - 5:00 PM'),
('Dr. Michael Chen', 'michael.chen@cosmohospital.com', '+1-555-0102', 'Pediatrics', 'MD, FAAP', 12, 150.00, ARRAY['Monday', 'Tuesday', 'Thursday', 'Friday'], '8:00 AM - 4:00 PM'),
('Dr. Emily Rodriguez', 'emily.rodriguez@cosmohospital.com', '+1-555-0103', 'Orthopedics', 'MD, FAAOS', 18, 250.00, ARRAY['Tuesday', 'Wednesday', 'Thursday'], '10:00 AM - 6:00 PM'),
('Dr. David Wilson', 'david.wilson@cosmohospital.com', '+1-555-0104', 'General Medicine', 'MBBS, MD', 10, 120.00, ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday'], '9:00 AM - 5:00 PM'),
('Dr. Lisa Thompson', 'lisa.thompson@cosmohospital.com', '+1-555-0105', 'Dermatology', 'MD, FAAD', 8, 180.00, ARRAY['Tuesday', 'Thursday', 'Friday'], '11:00 AM - 7:00 PM');