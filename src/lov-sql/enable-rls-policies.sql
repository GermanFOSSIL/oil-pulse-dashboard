
-- Enable RLS for projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on projects table
CREATE POLICY "Allow all operations on projects" ON public.projects
  USING (true)
  WITH CHECK (true);

-- Enable RLS for systems table
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on systems table
CREATE POLICY "Allow all operations on systems" ON public.systems
  USING (true)
  WITH CHECK (true);

-- Enable RLS for subsystems table
ALTER TABLE public.subsystems ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on subsystems table
CREATE POLICY "Allow all operations on subsystems" ON public.subsystems
  USING (true)
  WITH CHECK (true);

-- Enable RLS for itrs table
ALTER TABLE public.itrs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on itrs table
CREATE POLICY "Allow all operations on itrs" ON public.itrs
  USING (true)
  WITH CHECK (true);

-- Enable RLS for tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on tasks table
CREATE POLICY "Allow all operations on tasks" ON public.tasks
  USING (true)
  WITH CHECK (true);

-- Enable RLS for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on profiles table
CREATE POLICY "Allow all operations on profiles" ON public.profiles
  USING (true)
  WITH CHECK (true);

-- Enable RLS for test_packs table
ALTER TABLE public.test_packs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on test_packs table
CREATE POLICY "Allow all operations on test_packs" ON public.test_packs
  USING (true)
  WITH CHECK (true);

-- Enable RLS for tags table
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on tags table
CREATE POLICY "Allow all operations on tags" ON public.tags
  USING (true)
  WITH CHECK (true);

-- Enable RLS for acciones_log table
ALTER TABLE public.acciones_log ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on acciones_log table
CREATE POLICY "Allow all operations on acciones_log" ON public.acciones_log
  USING (true)
  WITH CHECK (true);
