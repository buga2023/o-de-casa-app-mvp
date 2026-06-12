"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { data } from "@/lib/data";
import { RegraError } from "@/lib/errors";
import { cadastroSchema, type CadastroForm } from "@/lib/schemas";
import { maskTelefone, maskCep } from "@/lib/masks";

export default function CadastroPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [passo, setPasso] = useState<1 | 2>(1);
  const [novoId, setNovoId] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CadastroForm>({
    resolver: zodResolver(cadastroSchema),
    mode: "onTouched",
    defaultValues: { nome: "", telefone: "", endereco: "", cep: "", condominio: "" },
  });

  const criarConta = handleSubmit(async (values) => {
    try {
      const p = await data.signUp({ ...values, condominio: values.condominio ?? "" });
      setNovoId(p.id);
      setPasso(2);
    } catch (err) {
      toast(
        err instanceof RegraError ? err.message : "Erro ao criar a conta.",
        "erro"
      );
    }
  });

  async function confirmarVerificacao() {
    if (!novoId) return;
    setVerificando(true);
    // "verificação em 2 passos" simulada
    setTimeout(async () => {
      try {
        await data.verificarPerfil(novoId);
        toast("Conta verificada!");
        router.replace("/inicio");
      } catch {
        toast("Erro ao verificar. Tente de novo.", "erro");
        setVerificando(false);
      }
    }, 700);
  }

  return (
    <main className="flex min-h-dvh flex-col px-5 py-8">
      <button
        onClick={() => (passo === 2 ? setPasso(1) : router.push("/"))}
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-tinta/60"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <Brand className="text-2xl" />

      {passo === 1 ? (
        <form onSubmit={criarConta} noValidate className="mt-4 space-y-4">
          <div>
            <h1 className="font-serif text-2xl text-tinta">Criar conta</h1>
            <p className="text-sm text-tinta/60">
              {data.supportsDemo
                ? "Seus dados ficam no seu dispositivo (modo demonstração)."
                : "Seus dados ficam protegidos na sua conta."}
            </p>
          </div>

          <Campo label="Nome completo *" id="nome" erro={errors.nome?.message}>
            <Input
              id="nome"
              placeholder="Como você se chama"
              aria-invalid={Boolean(errors.nome)}
              {...register("nome")}
            />
          </Campo>
          <Campo label="Celular *" id="telefone" erro={errors.telefone?.message}>
            <Input
              id="telefone"
              placeholder="(71) 99999-9999"
              inputMode="tel"
              aria-invalid={Boolean(errors.telefone)}
              {...register("telefone")}
              onChange={(e) =>
                setValue("telefone", maskTelefone(e.target.value), {
                  shouldValidate: Boolean(errors.telefone),
                })
              }
            />
          </Campo>
          <Campo label="Endereço *" id="endereco" erro={errors.endereco?.message}>
            <Input
              id="endereco"
              placeholder="Rua, número"
              aria-invalid={Boolean(errors.endereco)}
              {...register("endereco")}
            />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="CEP *" id="cep" erro={errors.cep?.message}>
              <Input
                id="cep"
                placeholder="40140-000"
                inputMode="numeric"
                aria-invalid={Boolean(errors.cep)}
                {...register("cep")}
                onChange={(e) =>
                  setValue("cep", maskCep(e.target.value), {
                    shouldValidate: Boolean(errors.cep),
                  })
                }
              />
            </Campo>
            <Campo
              label="Condomínio"
              id="condominio"
              erro={errors.condominio?.message}
            >
              <Input
                id="condominio"
                placeholder="Edifício / casa"
                aria-invalid={Boolean(errors.condominio)}
                {...register("condominio")}
              />
            </Campo>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Criando…
              </>
            ) : (
              "Continuar"
            )}
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
              Enviamos um código para {getValues("telefone") || "seu celular"}.
              No modo demonstração, é só confirmar.
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
  id,
  erro,
  children,
}: {
  label: string;
  id: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {erro && (
        <p role="alert" className="mt-1 text-xs text-terracota">
          {erro}
        </p>
      )}
    </div>
  );
}
