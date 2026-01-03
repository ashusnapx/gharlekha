import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CONFIG } from "@/config/config";
import {
  formatCurrency,
  formatMonthYear,
  formatNumber,
  formatDate,
} from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get bill with tenant info
    const { data: bill, error: billError } = await supabase
      .from("bills")
      .select("*, tenants(*)")
      .eq("id", id)
      .single();

    if (billError || !bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Check authorization - admin or bill owner
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";
    const isOwner = bill.tenants?.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate HTML for PDF (using server-side HTML to PDF approach)
    const tenant = bill.tenants;
    const lineItems = bill.line_items as Array<{
      description: string;
      amount: number;
      details?: string;
    }>;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${bill.bill_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      color: #333;
      line-height: 1.5;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #4F46E5;
    }
    .logo { font-size: 24px; font-weight: bold; color: #4F46E5; }
    .tagline { font-size: 12px; color: #666; }
    .invoice-title { font-size: 28px; color: #333; text-align: right; }
    .invoice-number { color: #666; font-size: 14px; }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    .info-section h3 { color: #4F46E5; margin-bottom: 10px; font-size: 12px; text-transform: uppercase; }
    .info-section p { margin-bottom: 4px; }
    .info-section .value { font-weight: 600; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #F3F4F6;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #E5E7EB;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #E5E7EB;
    }
    .text-right { text-align: right; }
    .total-row { background: #F9FAFB; font-weight: bold; font-size: 16px; }
    .total-row td { border-bottom: none; }
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-paid { background: #D1FAE5; color: #059669; }
    .status-pending { background: #FEF3C7; color: #D97706; }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .details { color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">${CONFIG.pdf.branding.companyName}</div>
      <div class="tagline">${CONFIG.pdf.branding.tagline}</div>
    </div>
    <div>
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">${bill.bill_number}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-section">
      <h3>Bill To</h3>
      <p class="value">${tenant?.full_name}</p>
      <p>Flat ${tenant?.flat_number}</p>
      <p>${tenant?.mobile_number}</p>
      <p>${tenant?.email}</p>
    </div>
    <div class="info-section" style="text-align: right;">
      <h3>Invoice Details</h3>
      <p>Period: <span class="value">${formatMonthYear(
        bill.month,
        bill.year
      )}</span></p>
      <p>Generated: <span class="value">${formatDate(
        bill.generated_at
      )}</span></p>
      <p>Status: <span class="status ${
        bill.payment_status === "paid" ? "status-paid" : "status-pending"
      }">${bill.payment_status.toUpperCase()}</span></p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineItems
        .map(
          (item) => `
        <tr>
          <td>
            ${item.description}
            ${item.details ? `<div class="details">${item.details}</div>` : ""}
          </td>
          <td class="text-right">${formatCurrency(item.amount)}</td>
        </tr>
      `
        )
        .join("")}
      <tr class="total-row">
        <td>Total Amount Due</td>
        <td class="text-right">${formatCurrency(bill.total_amount)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p>${CONFIG.pdf.branding.footerText}</p>
    <p style="margin-top: 8px;">Generated by ${CONFIG.app.name}</p>
  </div>
</body>
</html>
    `;

    // Return HTML with print-optimized headers
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="${bill.bill_number}.html"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
