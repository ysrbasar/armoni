import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import { handlePush, type KV } from "../lib/push.mts";

export default async (req: Request) => handlePush(req, getStore("armoni-push") as unknown as KV);

export const config: Config = { path: "/api/push/*" };
