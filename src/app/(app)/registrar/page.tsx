"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/states";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser, useStore } from "@/lib/hooks";
import {
  getDestinatariosDisponiveis,
  registrarEncomenda,
  fileToDataUrl,
  RegraError,
} from "@/lib/api";

export default function RegistrarPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const fileRef = useRef<HTMLInputElement>(null);

  const destinatarios = useStore(() =>
    user ? getDestinatariosDisponiveis(user.id) : []
  );

  const [destinatarioId, setDestinatarioId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [salvando, setSalvando] = useState(false);

  if (!user) return null;

  async function onFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      setFotoUrl(url);
    } catch {
      toast("Não consegui ler a foto. Tente outra.", "erro");
    }
  }

  function salvar() {
    if (!user) return;
    if (!fotoUrl) {
      toast("A foto é obrigatória (BR-03).", "erro");
      return;
    }
    setSalvando(true);
    try {
      const enc = registrarEncomenda({
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

  if (destinatarios.length === 0) {
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

  const podeSalvar = Boolean(fotoUrl && destinatarioId) && !salvando;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl text-tinta">Registrar encomenda</h1>
        <p className="text-sm text-tinta/60">
          Tire a foto da encomenda — ela é obrigatória e fica no comprovante.
        </p>
      </div>

      {/* Foto obrigatória */}
      <div>
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
              className="absolute right-2 top-2 rounded-full bg-tinta/70 p-1.5 text-creme"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-linha bg-white text-tinta/60"
          >
            <Camera className="h-8 w-8 text-terracota" />
            <span className="text-sm font-medium">Tirar / escolher foto</span>
          </button>
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
              onClick={() => setDestinatarioId(d.id)}
              onKeyDown={(e) => e.key === "Enter" && setDestinatarioId(d.id)}
              className={`flex cursor-pointer items-center justify-between p-3 ${
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
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!podeSalvar}
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
          Sem foto, não dá pra registrar.
        </p>
      )}
    </div>
  );
}
