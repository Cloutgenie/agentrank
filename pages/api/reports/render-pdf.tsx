import type { NextApiRequest, NextApiResponse } from "next";
import type { ReportPdfData } from "@/lib/reports/pdf-template";

// Deliberately a Pages Router API route, not an App Router route handler.
// @react-pdf/renderer's custom reconciler breaks under Next's App Router
// RSC bundling pipeline ("Objects are not valid as a React child") even in
// a plain route.tsx with no Server Component involved — reproduced with a
// trivial <Document><Page><Text> tree, confirmed fine in a standalone Node
// script using the exact same node_modules. Pages Router API routes are
// not compiled through that pipeline, which sidesteps the issue entirely.
// lib/actions/reports.tsx calls this over an internal fetch rather than
// importing @react-pdf/renderer directly.
export const config = { api: { bodyParser: { sizeLimit: "2mb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { ReportPdfDocument } = await import("@/lib/reports/pdf-template");
    const data = req.body as ReportPdfData;

    const buffer = await renderToBuffer(<ReportPdfDocument data={data} />);
    res.setHeader("content-type", "application/pdf");
    res.status(200).send(buffer);
  } catch (error) {
    console.error("[render-pdf] failed:", error);
    res.status(500).json({ error: "PDF render failed" });
  }
}
