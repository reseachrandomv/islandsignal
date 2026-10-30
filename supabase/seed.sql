-- Add the islands you want people to pick from. Edit freely; no posts are seeded.
insert into public.islands (id, name, atoll) values
  ('male', 'Malé', 'Kaafu'),
  ('hulhumale', 'Hulhumalé', 'Kaafu'),
  ('villimale', 'Villimalé', 'Kaafu')
on conflict (id) do nothing;

-- Make yourself admin AFTER you have signed in once (replace the email):
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
