"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { signUp, verificarPerfil } from "@/lib/api";

type Form = {
  nome: string;
  telefone: string;
  endereco: string;
  cep: string;
  condominio: string;
};

const vazio: Form = {
  nome: "",
  telefone: "",
  endereco: "",
  cep: "",
  condominio: "",
};

export default function CadastroPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<Form>(vazio);
  const [passo, setPasso] = useState<1 | 2>(1);
  const [novoId, setNovoId] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);

  function set<K extends keyof Form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const camposOk =
    form.nome.trim().length >= 2 &&
    form.telefone.trim().length >= 8 &&
    form.endereco.trim().length >= 3 &&
    form.cep.trim().length >= 5;

  function criarConta(e: React.FormEvent) {
    e.preventDefault();
    if (!camposOk) {
      toast("Preencha nome, celular, endereço e CEP.", "erro");
      return;
    }
    const p = signUp(form);
    setNovoId(p.id);
    setPasso(2);
  }

  function confirmarVerificacao() {
    if (!novoId) return;
    setVerificando(true);
    // "verificação em 2 passos" simulada
    setTimeout(() => {
      verificarPerfil(novoId);
      toast("Conta verificada!");
      router.replace("/inicio");
    }, 700);
  }

  return (
    <main className="flex min-h-dvh flex-col px-5 py-8">
      <button
        onClick={() => (passo === 2 ? setPasso(1) : router.push("/"))}
        className="mb-4 inline-flex items-center gap-1 text-sm text-tinta/60"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <Brand className="text-2xl" />

      {passo === 1 ? (
        <form onSubmit={criarConta} className="mt-4 space-y-4">
          <div>
            <h1 className="font-serif text-2xl text-tinta">Criar conta</h1>
            <p className="text-sm text-tinta/60">
              Seus dados ficam no seu dispositivo (modo demonstração).
            </p>
          </div>

          <Campo label="Nome completo *">
            <Input
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              placeholder="Como você se chama"
            />
          </Campo>
          <Campo label="Celular *">
            <Input
              value={form.telefone}
              onChange={(e) => set("telefone", e.target.value)}
              placeholder="(71) 9 9999-9999"
              inputMode="tel"
            />
          </Campo>
          <Campo label="Endereço *">
            <Input
              value={form.endereco}
              onChange={(e) => set("endereco", e.target.value)}
              placeholder="Rua, número"
            />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="CEP *">
              <Input
                value={form.cep}
                onChange={(e) => set("cep", e.target.value)}
                placeholder="40140-000"
                inputMode="numeric"
              />
            </Campo>
            <Campo label="Condomínio">
              <Input
                value={form.condominio}
                onChange={(e) => set("condominio", e.target.value)}
                placeholder="Edifício / casa"
              />
            </Campo>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={!camposOk}>
            Continuar
          </Button>
        </form>
      ) : (
        <div className="mt-8 flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-dourado/20 text-dourado">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-tinta">
              Verificação em 2 passos
            </h1>
            <p className="mt-1 text-sm text-tinta/60">
              Enviamos um código para {form.telefone || "seu celular"}. No modo
              demonstração, é só confirmar.
            </p>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={confirmarVerificacao}
            disabled={verificando}
          >
            {verificando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Verificando…
              </>
            ) : (
              "Confirmar e verificar"
            )}
          </Button>
        </div>
      )}
    </main>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
