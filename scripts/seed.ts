import bcrypt from "bcryptjs";
import { Pool } from "pg";

const productionSeed=process.env.ALLOW_PRODUCTION_SEED==="true";
if(process.env.NODE_ENV==="production"&&!productionSeed)throw new Error("Seed de produção exige ALLOW_PRODUCTION_SEED=true");
if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL não configurada");
if(productionSeed&&(!process.env.SEED_ADMIN_EMAIL||!process.env.SEED_ADMIN_PASSWORD))throw new Error("Seed de produção exige credenciais administrativas explícitas");
async function main(){
 const db=new Pool({connectionString:process.env.DATABASE_URL});
 const client=await db.connect();
 try{await client.query("BEGIN");
 const password=await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD??"Admin2630Test!",12);
 const developmentUsers=[
  ["Administrador 2630",process.env.SEED_ADMIN_EMAIL??"admin@liderflix.local","+5521999990001","ADMIN"],
  ["Usuário Gratuito","gratuito@liderflix.local","+5521999990002","USER"],
  ["Aluno Curso A","curso@liderflix.local","+5521999990003","USER"],
  ["FREITAS","freitas@liderflix.local","+5521999990004","USER"]
 ];
 const productionAdmin=["FREITAS",process.env.SEED_ADMIN_EMAIL!,"+5521999990001","ADMIN"];
 const users=productionSeed?[productionAdmin]:developmentUsers;
 const ids:Record<string,string>={};for(const[name,email,phone,role]of users){const row=await client.query<{id:string}>(`INSERT INTO users(name,email,phone,password_hash,role) VALUES($1,$2,$3,$4,$5) ON CONFLICT(email) DO UPDATE SET name=$1,phone=$3,role=$5 RETURNING id`,[name,email,phone,password,role]);ids[email]=row.rows[0].id}
 const courses=[
  ["lideranca-antifragil","Liderança Antifrágil","Comando, cultura e confiança sob pressão","Aprenda a liderar pessoas e equipes com presença, clareza e direção.","/liderflix/assets/photos/leadership-operators.webp","Freitas e Wallace","Liderança","Intermediário",true,9900],
  ["arquitetura-da-decisao","Arquitetura da Decisão","Clareza em cenários complexos","Um método para decidir com velocidade sem abrir mão da responsabilidade.","/liderflix/assets/photos/decision-fire.webp","Instituto 2630","Estratégia","Avançado",true,7900],
  ["codigo-da-presenca","O Código da Presença","Neurociência aplicada à liderança","Estado interno, comunicação e influência para líderes.","/liderflix/assets/photos/presence-speaker.webp","Freitas","Performance","Intermediário",true,7900],
  ["inteligencia-emocional","Inteligência Emocional Operacional","Controle antes da ação","Reconheça emoções, regule respostas e preserve a capacidade de decisão.","/liderflix/assets/photos/team-overhead.webp","Wallace","Comportamento","Fundamentos",true,6900],
  ["cultura-de-alta-performance","Cultura de Alta Performance","Do discurso ao comportamento","Ferramentas para criar padrões de excelência sustentáveis em equipes.","/liderflix/assets/photos/resilience-team.webp","Instituto 2630","Cultura","Avançado",false,11900]
 ];
 const courseIds:Record<string,string>={};for(const c of courses){const row=await client.query<{id:string}>(`INSERT INTO courses(slug,title,subtitle,description,thumbnail,instructor,category,level,status,included_in_all_access,monthly_price_cents) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'PUBLISHED',$9,$10) ON CONFLICT(slug) DO UPDATE SET title=$2,subtitle=$3,description=$4,thumbnail=$5,instructor=$6,category=$7,level=$8,status='PUBLISHED',included_in_all_access=$9,monthly_price_cents=$10 RETURNING id`,c);courseIds[c[0] as string]=row.rows[0].id}
 const lessonNames=["Fundamentos da missão","Liderar começa por si","Comunicação de comando","Decisão sob pressão","Confiança e segurança psicológica","Feedback claro e direto","Execução disciplinada","Debriefing e melhoria contínua"];
 for(const course of courses){for(let i=0;i<lessonNames.length;i++)await client.query(`INSERT INTO lessons(course_id,title,description,duration_seconds,position,status,is_preview) VALUES($1,$2,$3,$4,$5,'PUBLISHED',$6) ON CONFLICT(course_id,position) DO UPDATE SET title=$2,description=$3,status='PUBLISHED'`,[courseIds[course[0] as string],lessonNames[i],`Aplicação prática: ${lessonNames[i].toLowerCase()}.`,900+i*75,i+1,i===0])}
 await client.query(`INSERT INTO ebooks(slug,title,description,author,cover_url,status,is_free,included_in_all_access) VALUES
 ('manual-da-lideranca','Manual da Liderança sob Pressão','Princípios objetivos para comandar em cenários críticos.','Instituto 2630','/liderflix/assets/photos/focus-fog.webp','PUBLISHED',true,false),
 ('caderno-de-missao','Caderno de Missão 2630','Ferramenta prática para planejamento, execução e debriefing.','Instituto 2630','/liderflix/assets/photos/fire-leader.webp','PUBLISHED',false,true)
 ON CONFLICT(slug) DO UPDATE SET title=EXCLUDED.title,cover_url=EXCLUDED.cover_url,status='PUBLISHED'`);
 if(!productionSeed)await client.query(`INSERT INTO access_grants(user_id,resource_type,resource_id,source,source_reference,status) VALUES($1,'COURSE',$2,'ADMIN','seed-course','ACTIVE') ON CONFLICT DO NOTHING`,[ids["curso@liderflix.local"],courseIds["lideranca-antifragil"]]);
 const allAccessUserId=productionSeed?ids[process.env.SEED_ADMIN_EMAIL!]:ids["freitas@liderflix.local"];
 await client.query(`INSERT INTO access_grants(user_id,resource_type,resource_id,source,source_reference,status) VALUES($1,'ALL_ACCESS',NULL,'ADMIN','seed-all-access','ACTIVE') ON CONFLICT DO NOTHING`,[allAccessUserId]);
 const campaign=await client.query<{id:string}>(`INSERT INTO campaigns(slug,name,description,status,selectable_course_count,duration_unit,duration_value) VALUES('pe-na-porta-teste','Workshop Pé na Porta — Teste','Escolha um curso por 365 dias.','ACTIVE',1,'DAYS',365) ON CONFLICT(slug) DO UPDATE SET status='ACTIVE' RETURNING id`);
 for(const id of Object.values(courseIds).slice(0,3))await client.query("INSERT INTO campaign_eligible_courses(campaign_id,course_id) VALUES($1,$2) ON CONFLICT DO NOTHING",[campaign.rows[0].id,id]);
 if(!productionSeed)await client.query(`INSERT INTO campaign_benefits(campaign_id,user_id,recipient_email,status,selectable_course_count) SELECT $1,id,email,'PENDING',1 FROM users WHERE email='gratuito@liderflix.local' AND NOT EXISTS(SELECT 1 FROM campaign_benefits WHERE campaign_id=$1 AND recipient_email='gratuito@liderflix.local')`,[campaign.rows[0].id]);
 await client.query("COMMIT");console.log(productionSeed?"Seed inicial de produção aplicada.":"Seed de desenvolvimento aplicada.");
 }catch(error){await client.query("ROLLBACK");throw error}finally{client.release();await db.end()}
}

main().catch((error)=>{console.error(error);process.exitCode=1});
