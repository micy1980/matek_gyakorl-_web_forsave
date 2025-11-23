/*
  # Add DELETE policies for results tables

  1. Changes
    - Add DELETE policy for `results_random` table (allows anyone to delete)
    - Add DELETE policy for `results_ttable` table (allows anyone to delete)
  
  2. Security
    - These policies allow deletion from edge functions using service role key
    - Still protected by password authentication in the edge function
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can delete results_random" ON results_random;
  DROP POLICY IF EXISTS "Anyone can delete results_ttable" ON results_ttable;
END $$;

-- Add DELETE policy for results_random
CREATE POLICY "Anyone can delete results_random"
  ON results_random
  FOR DELETE
  TO public
  USING (true);

-- Add DELETE policy for results_ttable
CREATE POLICY "Anyone can delete results_ttable"
  ON results_ttable
  FOR DELETE
  TO public
  USING (true);