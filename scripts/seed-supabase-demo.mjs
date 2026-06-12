// Cria as contas demo (Ana, Bruno, Carla) no Supabase: auth user + profile
// verificado + vínculo mútuo Ana↔Bruno. Idempotente — pode rodar de novo.
//
// Envs (lidas de .env.local ou do ambiente):
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_DEMO_PASSWORD
// Rodar: node scripts/seed-supabase-demo.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

// parser mínimo de .env.local (sem dependência de dotenv)
for (const arquivo of [".env.local", ".env"]) {
  if (!existsSync(arquivo)) continue;
  for (const linha of readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SENHA = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

if (!URL || !SERVICE_ROLE || !SENHA) {
  console.error(
    "Faltam envs: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_DEMO_PASSWORD."
  );
  process.exit(1);
}

const sb = createClient(URL, SERVICE_ROLE, { auth: { persistSession: false } });

const DEMOS = [
  { email: "ana.demo@odecasa.app", nome: "Ana Souza", telefone: "71 99999-0001" },
  { email: "bruno.demo@odecasa.app", nome: "Bruno Lima", telefone: "71 99999-0002" },
  { email: "carla.demo@odecasa.app", nome: "Carla Dias", telefone: "71 99999-0003" },
];

async function obterOuCriarUsuario(email) {
  const { data: criado, error } = await sb.auth.admin.createUser({
    email,
    password: SENHA,
    email_confirm: true,
  });
  if (!error) return criado.user.id;
  // já existe → procura na listagem
  const { data: lista, error: listErr } = await sb.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) throw listErr;
  const user = lista.users.find((u) => u.email === email);
  if (!user) throw new Error(`Não consegui criar nem achar ${email}: ${error.message}`);
  // garante a senha atual (caso a env tenha mudado)
  await sb.auth.admin.updateUserById(user.id, { password: SENHA });
  return user.id;
}

const ids = {};
for (const demo of DEMOS) {
  const id = await obterOuCriarUsuario(demo.email);
  ids[demo.email] = id;
  const { error } = await sb.from("profiles").upsert({
    id,
    nome: demo.nome,
    telefone: demo.telefone,
    endereco: "Rua das Mangueiras, 12",
    condominio: "Edifício Iemanjá",
    cep: "40140-000",
    verificado: true,
    reputacao: 5,
    bloqueado: false,
  });
  if (error) throw error;
  console.log(`✓ ${demo.nome} (${demo.email})`);
}

// vínculo mútuo ativo Ana↔Bruno (cada um pode receber pro outro)
const ana = ids["ana.demo@odecasa.app"];
const bruno = ids["bruno.demo@odecasa.app"];
for (const [morador, vizinho] of [
  [ana, bruno],
  [bruno, ana],
]) {
  const { error } = await sb
    .from("vinculos")
    .upsert(
      { morador_id: morador, vizinho_id: vizinho, status: "ativo" },
      { onConflict: "morador_id,vizinho_id" }
    );
  if (error) throw error;
}
console.log("✓ vínculo mútuo Ana ↔ Bruno ativo");
console.log("\nContas demo prontas. Senha:", SENHA);
