-- Drop category and priority columns from support_tickets
alter table public.support_tickets 
  drop column if exists category,
  drop column if exists priority;
