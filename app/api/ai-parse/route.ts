import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { computeAdminToken, ADMIN_COOKIE } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ORDER_PROMPT = `You are parsing a screenshot of a chat that may contain ONE OR MORE customer orders (WhatsApp, iMessage, SMS, Telegram, Instagram DM, etc.).

CRITICAL — extract EVERY separate order visible in the screenshot as its own entry.

CRITICAL — client name rules:
- The contact name or phone number shown at the TOP of the screenshot (the sender/channel header) is NOT a client name. IGNORE IT.
- Employee tags like '@Stephen', '@~Stephen', '~Dr.B' are staff names — NOT client names. IGNORE THEM.
- The client's name is only what a customer writes about THEMSELVES in the message body (e.g. 'This is Maria', 'It's Jake', 'My name is Lisa').
- If no name is stated inside the message body, leave first_name and last_name as empty strings.
- Never use a phone number as a name.

Return ONLY valid JSON with no extra text:
{
  "orders": [
    {
      "client": {
        "first_name": "string — from message body only, or empty string",
        "last_name": "string — from message body only, or empty string",
        "phone": "string — only if stated inside the message body, otherwise null"
      },
      "items": [
        {
          "product_name": "string — as written in the message",
          "quantity": number,
          "unit_price": number or 0 if not stated
        }
      ],
      "notes": "any pickup/delivery/other notes or null",
      "ordered_at": "ISO date string if mentioned, otherwise null",
      "message_fingerprint": "short string: clientname-item1qty-item2qty etc"
    }
  ]
}
Additional rules: Quantity defaults to 1 if not stated. unit_price defaults to 0 if not stated. Each distinct customer message block = one order entry. Return ONLY the JSON object, no markdown fences, no explanation.`;

const INVOICE_PROMPT = `You are parsing an invoice image or PDF for a product supplier. Extract every line item and return ONLY valid JSON with no extra text:
{
  "supplier": "supplier/vendor name or null",
  "items": [
    {
      "name": "clean product name",
      "category": "best guess at category",
      "quantity": number,
      "unit_cost": number
    }
  ]
}
Rules: 'name' should be a clean, readable product name (title case, no invoice codes). unit_cost = the Rate/Unit Price column (cost per item to the store). quantity = the Qty column. Skip subtotal, tax, and total rows. Return ONLY the JSON object, no markdown, no explanation.`;

const CLIENT_PROMPT = `You are parsing a document containing business client information for a wholesale distributor. The document may be a business card, a tobacco license, a seller's permit, or any other business document. Extract every distinct business record visible and return ONLY valid JSON with no extra text:
{
  "clients": [
    {
      "business_name": "string or null",
      "contact_name": "string or null",
      "phone": "string or null",
      "email": "string or null",
      "address": "string or null",
      "city": "string or null",
      "state": "string — 2-letter abbreviation or null",
      "zip": "string or null",
      "tobacco_license_number": "string or null",
      "sellers_permit_number": "string or null"
    }
  ]
}
Rules: Return ONLY the JSON object. If a field is not visible, set it to null.`;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE)?.value;
    const expected = await computeAdminToken(process.env.ADMIN_PASSWORD || "");
    if (!token || token !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
    }

    const formData = await request.formData();
    const mode = formData.get("mode") as string;
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const prompt = mode === "order" ? ORDER_PROMPT : mode === "invoice" ? INVOICE_PROMPT : CLIENT_PROMPT;
    const results = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const isPdf = file.type === "application/pdf";

      const content: Anthropic.MessageParam["content"] = isPdf
        ? [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            } as Anthropic.DocumentBlockParam,
            { type: "text", text: prompt },
          ]
        : [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: base64,
              },
            } as Anthropic.ImageBlockParam,
            { type: "text", text: prompt },
          ];

      const response = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 4096,
        messages: [{ role: "user", content }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      try {
        const parsed = JSON.parse(text.trim());
        results.push(parsed);
      } catch {
        results.push({ raw: text, error: "Failed to parse JSON" });
      }
    }

    return NextResponse.json({ results, mode });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "AI parse failed" }, { status: 500 });
  }
}
