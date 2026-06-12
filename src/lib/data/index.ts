// Seleção do driver de dados por env. Padrão: local (demo em localStorage).
// NEXT_PUBLIC_DATA_DRIVER=supabase ativa o backend real (ver .env.example).
"use client";

import type { DataAPI } from "./contract";
import { localDriver } from "./local";
import { supabaseDriver } from "./supabase";

export const data: DataAPI =
  process.env.NEXT_PUBLIC_DATA_DRIVER === "supabase"
    ? supabaseDriver
    : localDriver;

export type { DataAPI } from "./contract";
