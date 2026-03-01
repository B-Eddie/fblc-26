-- Add signed_pdf_url column to signature_requests table
-- so the signed PDF can be viewed directly by the volunteer
ALTER TABLE signature_requests
ADD COLUMN IF NOT EXISTS signed_pdf_url TEXT;

-- Create storage bucket for signed PDFs (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signed-pdfs', 'signed-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload signed PDFs
CREATE POLICY "Auth users can upload signed PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'signed-pdfs');

-- Allow anyone to read signed PDFs (so volunteers can view them)
CREATE POLICY "Public read access for signed PDFs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'signed-pdfs');
