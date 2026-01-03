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

    // Generate PDF Stream
    const tenant = bill.tenants;
    const lineItems = bill.line_items;

    // We import dynamically to avoid build issues on verify
    const { renderToStream } = await import("@react-pdf/renderer");
    const { BillDocument } = await import("@/components/pdf/BillDocument");

    const stream = await renderToStream(
      <BillDocument bill={bill} tenant={tenant} lineItems={lineItems} />
    );

    // Return PDF Stream
    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${bill.bill_number}.pdf"`,
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
