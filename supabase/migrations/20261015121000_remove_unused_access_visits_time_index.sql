-- O relatório diário faz agregação completa e o rate limit usa o índice composto
-- (device_id, visited_at); o índice isolado em visited_at não tem uso útil aqui.
drop index if exists public.access_visits_time_idx;
