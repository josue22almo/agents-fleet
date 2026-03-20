import { Inject, Injectable, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Request } from "express";

export const SUPABASE_REQUEST = "SUPABASE_REQUEST";

@Injectable({ scope: Scope.REQUEST })
export class SupabaseRequestClient {
  public readonly client: SupabaseClient;

  constructor(@Inject(REQUEST) request: Request) {
    const token = request.headers.authorization?.replace("Bearer ", "");

    this.client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    });
  }
}
