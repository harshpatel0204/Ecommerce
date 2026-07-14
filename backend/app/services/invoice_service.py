"""GST tax-invoice PDF generation (fpdf2, no external services).

fpdf2's core fonts are latin-1 only, so text is sanitised and amounts use
"Rs." rather than the unicode rupee sign.
"""
from fpdf import FPDF

from app.core.config import settings
from app.models.order import Order


def _s(value: object) -> str:
    """Coerce to a latin-1-safe string for the core PDF fonts."""
    return str(value if value is not None else "").encode("latin-1", "replace").decode("latin-1")


def _money(amount: float) -> str:
    return f"Rs. {float(amount or 0):,.2f}"


def build_invoice_pdf(order: Order) -> bytes:
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    epw = pdf.w - 2 * pdf.l_margin  # effective page width

    # ---- Header: title + seller ----
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 10, "TAX INVOICE", ln=True)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 6, _s(settings.SELLER_NAME), ln=True)
    pdf.set_font("Helvetica", "", 9)
    if settings.SELLER_ADDRESS:
        pdf.multi_cell(0, 5, _s(settings.SELLER_ADDRESS), new_x="LMARGIN", new_y="NEXT")
    if settings.SELLER_GSTIN:
        pdf.cell(0, 5, _s(f"GSTIN: {settings.SELLER_GSTIN}"), ln=True)
    pdf.ln(3)

    # ---- Invoice meta + Bill To ----
    addr = order.shipping_address or {}
    pdf.set_font("Helvetica", "", 10)
    meta = [
        ("Invoice No", order.order_number),
        ("Date", order.placed_at.strftime("%d %b %Y") if order.placed_at else ""),
        ("Payment", f"{order.payment_status} ({order.payment_method or 'N/A'})"),
    ]
    for label, value in meta:
        pdf.cell(35, 6, _s(f"{label}:"))
        pdf.cell(0, 6, _s(value), ln=True)

    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "Bill To:", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 5, _s(addr.get("full_name")), ln=True)
    line2 = addr.get("line2")
    street = f"{addr.get('line1', '')}{', ' + line2 if line2 else ''}"
    pdf.multi_cell(0, 5, _s(street), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(
        0, 5, _s(f"{addr.get('city', '')}, {addr.get('state', '')} - {addr.get('pincode', '')}"), ln=True
    )
    if addr.get("phone"):
        pdf.cell(0, 5, _s(f"Phone: {addr.get('phone')}"), ln=True)
    pdf.ln(4)

    # ---- Items table ----
    w_no, w_qty, w_price, w_amt = 10, 18, 35, 37
    w_name = epw - (w_no + w_qty + w_price + w_amt)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(w_no, 8, "#", border=1, fill=True)
    pdf.cell(w_name, 8, "Item", border=1, fill=True)
    pdf.cell(w_qty, 8, "Qty", border=1, align="R", fill=True)
    pdf.cell(w_price, 8, "Unit Price", border=1, align="R", fill=True)
    pdf.cell(w_amt, 8, "Amount", border=1, align="R", ln=True, fill=True)

    pdf.set_font("Helvetica", "", 9)
    for i, item in enumerate(order.items, start=1):
        name = item.product_name
        variant = " / ".join(filter(None, [item.size, item.color]))
        if variant:
            name = f"{name} ({variant})"
        if len(name) > 48:
            name = name[:45] + "..."
        pdf.cell(w_no, 7, str(i), border=1)
        pdf.cell(w_name, 7, _s(name), border=1)
        pdf.cell(w_qty, 7, str(item.quantity), border=1, align="R")
        pdf.cell(w_price, 7, _money(item.unit_price), border=1, align="R")
        pdf.cell(w_amt, 7, _money(item.line_total), border=1, align="R", ln=True)

    # ---- Totals ----
    pdf.ln(2)
    label_w = epw - w_amt
    totals = [
        ("Subtotal", order.subtotal, False),
        ("Discount", -float(order.discount_amount or 0), False),
        ("Shipping", order.shipping_fee, False),
        ("GST / Tax", order.tax_amount, False),
        ("Grand Total", order.total_amount, True),
    ]
    for label, value, bold in totals:
        if label == "Discount" and not order.discount_amount:
            continue
        pdf.set_font("Helvetica", "B" if bold else "", 11 if bold else 10)
        pdf.cell(label_w, 7, _s(label), align="R", border="T" if bold else 0)
        pdf.cell(w_amt, 7, _money(value), align="R", border="T" if bold else 0, ln=True)

    pdf.ln(8)
    pdf.set_font("Helvetica", "I", 8)
    pdf.cell(0, 5, "This is a computer-generated invoice.", ln=True)

    return bytes(pdf.output())
