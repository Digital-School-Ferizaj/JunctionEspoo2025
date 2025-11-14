# Supabase setup

1. Sign in to Supabase and create a new project.
2. Run the SQL in `schema.sql` via the Supabase SQL editor or CLI.
3. Create a private Storage bucket named `audio`:
   ```bash
   supabase storage create-bucket audio --public false
   ```
4. No public access is allowed; the server uses service-role key to upload and generate signed URLs.
5. Update Env vars in Supabase Dashboard ? Project Settings ? API (service role key) and copy values into `.env`.
6. Enable the Edge function for audio cleanup if desired, or rely on server revocation logic.
