INSERT INTO courses(slug,title,subtitle,description,thumbnail,instructor,category,level,status,included_in_all_access)
VALUES ('procrastinacao','Procrastinação','Da rotina à ação','Uma formação do Instituto 2630 sobre procrastinação, rotina, tempo, visualização e estresse.','/liderflix/assets/photos/procrastinacao-cover.jpg','Instituto 2630','Autoliderança','Fundamentos','PUBLISHED',true)
ON CONFLICT(slug) DO NOTHING;

WITH source_lessons(position,title,video_id) AS (VALUES
 (1,'Apresentação','1zR3v7_RqPRtpGhPDcTAmvlZX2Yd1UaCe'),
 (2,'Rotina óbvia','1ui0HSCOuCLTFWTpvOQKvHSX1DH63_1FE'),
 (3,'Procrastino','1TcbW-BkqtgEozW-GCeB2Di4C4fCBIryz'),
 (4,'Tempo','1KEVquRaZ9v0oix0Nkeb6tzi3r9SWj8Bn'),
 (5,'Tempo — aula 2','1IOHlwJP-M2fNGm6TNIgz-tTAZtuZSFpK'),
 (6,'Certo e errado','1BNBe-mwX0xcWCd91ZyBo1T18F0oMfliG'),
 (7,'Visualização','1vABmBju3-0ad2Xhatct9v9fUOfaVIucA'),
 (8,'Estresse','1FESIIL6PV28uq0yLQVpJKZqwvYCFUpkN'),
 (9,'Fechamento','1zAmWNHEcQaSCmaHy85yI2X6wyH6KZNdr')
)
INSERT INTO lessons(course_id,title,description,video_provider,video_id,position,status,is_preview)
SELECT c.id,s.title,'Curso Procrastinação · Instituto 2630.','drive',s.video_id,s.position,'PUBLISHED',s.position=1
FROM courses c CROSS JOIN source_lessons s WHERE c.slug='procrastinacao'
ON CONFLICT(course_id,position) DO NOTHING;
