"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/states";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser, useData } from "@/lib/hooks";
import { data } from "@/lib/data";
import { RegraError } from "@/lib/errors";
import { registrarSchema } from "@/lib/schemas";

export default function RegistrarPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const fotoRef = useRef<HTMLDivElement>(null);

  const { data: destinatarios = [], ready } = useData(
    () =>
      user ? data.getDestinatariosDisponiveis(user.id) : Promise.resolve([]),
    [user?.id]
  );

  const [destinatarioId, setDestinatarioId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [carregandoFoto, setCarregandoFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  if (!user) return null;

  async function onFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCarregandoFoto(true);
    try {
      // comprime no cliente (4MB → ~200KB) e persiste conforme o driver
      const url = await data.uploadFoto(file);
      setFotoUrl(url);
      setErros((prev) => ({ ...prev, fotoUrl: "" }));
    } catch {
      toast("Não consegui ler a foto. Tente outra.", "erro");
    } finally {
      setCarregandoFoto(false);
    }
  }

  async function salvar() {
    if (!user) return;
    if (carregandoFoto) {
      toast("Aguarde a foto terminar de carregar.", "erro");
      return;
    }
    const parsed = registrarSchema.safeParse({ destinatarioId, fotoUrl, descricao });
    if (!parsed.success) {
      const porCampo: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        porCampo[String(i.path[0])] = i.message;
      });
      setErros(porCampo);
      // feedback claro: a foto é o bloqueio mais comum (BR-03)
      if (!fotoUrl) {
        toast("Tire a foto da encomenda — ela é obrigatória.", "erro");
        fotoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (!destinatarioId) {
        toast("Escolha para quem é a encomenda.", "erro");
      }
      return;
    }
    setSalvando(true);
    try {
      const enc = await data.registrarEncomenda({
        recebedorId: user.id,
        destinatarioId,
        descricao,
        fotoUrl,
      });
      toast("Encomenda registrada e destinatário notificado.");
      router.push(`/comprovante/${enc.id}`);
    } catch (err) {
      const msg =
        err instanceof RegraError ? err.message : "Erro ao registrar.";
      toast(msg, "erro");
      setSalvando(false);
    }
  }

  if (ready && destinatarios.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-2xl text-tinta">Registrar encomenda</h1>
        <EmptyState
          title="Ninguém te autorizou ainda"
          description="Você só pode registrar para vizinhos que autorizaram você a receber. Peça para te adicionar na aba Vizinhos."
        />
      </div>
    );
  }

  // O botão fica clicável mesmo sem foto/destinatário (e durante o
  // processamento da foto): ao clicar, mostra o que falta em vez de só ficar
  // cinza sem explicação. Só desabilita enquanto está realmente salvando.

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl text-tinta">Registrar encomenda</h1>
        <p className="text-sm text-tinta/60">
          Tire a foto da encomenda — ela é obrigatória e fica no comprovante.
        </p>
      </div>

      {/* Foto obrigatória */}
      <div ref={fotoRef}>
        <Label>Foto da encomenda *</Label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          aria-label="Foto da encomenda"
          onChange={onFoto}
        />
        {fotoUrl ? (
          <div className="relative overflow-hidden rounded-card border border-linha">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoUrl}
              alt="Pré-visualização da encomenda"
              className="max-h-64 w-full object-cover"
            />
            <button
              type="button"
              aria-label="Remover foto"
              onClick={() => setFotoUrl("")}
              className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-tinta/70 text-creme"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={carregandoFoto}
            className={`flex h-40 w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed bg-white text-tinta/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/60 ${
              erros.fotoUrl ? "border-terracota" : "border-linha"
            }`}
          >
            {carregandoFoto ? (
              <Loader2 className="h-8 w-8 animate-spin text-terracota" />
            ) : (
              <Camera className="h-8 w-8 text-terracota" />
            )}
            <span className="text-sm font-medium">
              {carregandoFoto ? "Processando foto…" : "Tirar / escolher foto"}
            </span>
          </button>
        )}
        {erros.fotoUrl && (
          <p role="alert" className="mt-1 text-xs text-terracota">
            {erros.fotoUrl}
          </p>
        )}
      </div>

      {/* Destinatário */}
      <div>
        <Label>Para quem é? *</Label>
        <div className="space-y-2">
          {destinatarios.map((d) => (
            <Card
              key={d.id}
              role="button"
              tabIndex={0}
              aria-pressed={destinatarioId === d.id}
              onClick={() => setDestinatarioId(d.id)}
              onKeyDown={(e) => e.key === "Enter" && setDestinatarioId(d.id)}
              className={`flex min-h-11 cursor-pointer items-center justify-between p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/60 ${
                destinatarioId === d.id
                  ? "ring-2 ring-terracota"
                  : "hover:bg-tinta/[0.02]"
              }`}
            >
              <span className="font-medium text-tinta">{d.nome}</span>
              <span className="text-xs text-tinta/50">{d.condominio}</span>
            </Card>
          ))}
        </div>
        {erros.destinatarioId && (
          <p role="alert" className="mt-1 text-xs text-terracota">
            {erros.destinatarioId}
          </p>
        )}
      </div>

      {/* Descrição */}
      <div>
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Textarea
          id="descricao"
          placeholder="Ex.: Caixa média da Amazon, frágil"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        {erros.descricao && (
          <p role="alert" className="mt-1 text-xs text-terracota">
            {erros.descricao}
          </p>
        )}
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={salvando}
        onClick={salvar}
      >
        {salvando ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Registrando…
          </>
        ) : (
          "Registrar encomenda"
        )}
      </Button>
      {!fotoUrl && (
        <p className="text-center text-xs text-tinta/50">
          A foto é obrigatória — toque em “Tirar / escolher foto” acima.
        </p>
      )}
    </div>
  );
}
