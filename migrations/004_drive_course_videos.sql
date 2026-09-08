WITH source_lessons(position, title, video_id, is_preview) AS (
  VALUES
    (1, 'Seja bem vindo', '10QLVjR5sXvFLbp5aFeSFeFsjGunCiyr3', true),
    (2, 'Cultura e seus desafios', '1nUEvcv-9Q8S-X1gCrsp8f7bUAU47ETYh', false),
    (3, 'O BOPE já nasceu caveira', '17DvNj3g_d2sNOykuw5HH9DZHXhmlRmmd', false),
    (4, 'Propósito', '1O7MvFujwTlWYJN-Nacc9DuC0r1h1qjxj', false),
    (5, 'Valores', '17RTGcdulKXGnCupudfWjAoPhNv0z5Mnu', false),
    (6, 'Valores continuação', '1ojxGqC5pFZ-JKT2vlo_-ff2MBpbFisoE', false),
    (7, 'Princípios', '1sqFw7lqSdoQYAcW8DTfrn4FCw1csxYeM', false),
    (8, 'Princípios continuação', '1PcJNeg_TKMqFK1VG6JRK_07rEm5iwLlP', false),
    (9, 'Fechamento da essência', '1QuX6TrakDXXL_wCtYlKsALkKtbR1Shr6', false),
    (10, 'Líder, você é o elo', '1iXnJo7XyHC5JW8JxPVglfmRC_MFiHgUf', false),
    (11, 'Os 4 passos das práticas', '1JzUJwUkRE7egWz-sbqpHZxqeljlq_hoE', false),
    (12, 'MMA e enfrentar', '18SfTFeqiK_moySvq8LrEQHr_b9LYQVqJ', false),
    (13, 'Gestão com caveiras da casa', '16MZywzdV4X1LGneAkEjtGvbDpLc7GI6k', false),
    (14, 'Cultura da disciplina', '1JRi3SbJQlDs2KhpjO9jApMfpgRjmzbR0', false),
    (15, 'Liberdade para criar', '1mtbsZuwwdAeiRiBwKuUghmFFPoC7QthI', false),
    (16, 'Você cresce no desconforto', '1jm4cSlHSzM_ajKUrIziGJhyPYVFBbEFx', false)
)
INSERT INTO lessons(course_id, title, description, video_provider, video_id, position, status, is_preview)
SELECT c.id, s.title, 'Aula do primeiro curso do Instituto 2630.', 'drive', s.video_id, s.position, 'PUBLISHED', s.is_preview
FROM courses c CROSS JOIN source_lessons s
WHERE c.slug = 'lideranca-antifragil'
ON CONFLICT(course_id, position) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  video_provider = EXCLUDED.video_provider,
  video_id = EXCLUDED.video_id,
  status = 'PUBLISHED',
  is_preview = EXCLUDED.is_preview,
  updated_at = now();
