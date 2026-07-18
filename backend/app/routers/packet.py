from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.schemas.allowlist import PacketRequest, PacketResponse
from app.guardrails.session_store import session_store
from app.retrieval.corpus import corpus
import secrets
import time
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER

router = APIRouter(prefix="/packet", tags=["packet"])

STYLES = getSampleStyleSheet()
STYLES.add(ParagraphStyle(name="Disclaimer", parent=STYLES["Normal"], fontSize=8, textColor=colors.gray, alignment=TA_CENTER))
STYLES.add(ParagraphStyle(name="SectionTitle", parent=STYLES["Heading2"], fontSize=13, spaceBefore=16, spaceAfter=8))
STYLES.add(ParagraphStyle(name="FieldLabel", parent=STYLES["Normal"], fontSize=10, fontName="Helvetica-Bold", spaceBefore=6))
STYLES.add(ParagraphStyle(name="FieldValue", parent=STYLES["Normal"], fontSize=10, spaceAfter=4))
STYLES.add(ParagraphStyle(name="SmallNote", parent=STYLES["Normal"], fontSize=8, textColor=colors.grey))


def _build_pdf(session: dict, profile: dict, include_fields: list[str]) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = STYLES
    story = []

    story.append(Paragraph("RealDoor", styles["Title"]))
    story.append(Paragraph("Application-Readiness Packet", styles["Heading1"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "This packet was prepared by RealDoor, an application-readiness copilot. "
        "It has NOT been transmitted to any property or agency. "
        "It is for the renter's records and use in their own application process.",
        styles["Disclaimer"]
    ))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Confirmed Profile Fields", styles["SectionTitle"]))
    profile_data = []
    if profile:
        for key, value in sorted(profile.items()):
            if value is not None and key != "session_token":
                profile_data.append([Paragraph(f"<b>{key.replace('_', ' ').title()}</b>", styles["Normal"]),
                                     Paragraph(str(value), styles["Normal"])])
    if profile_data:
        t = Table(profile_data, colWidths=[2.5*inch, 3.5*inch])
        t.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(t)
    else:
        story.append(Paragraph("No profile fields confirmed.", styles["Normal"]))

    story.append(Spacer(1, 12))
    story.append(Paragraph("Calculation Trace", styles["SectionTitle"]))
    calcs = session.get("calculations", [])
    if calcs:
        story.append(Paragraph("<br/>".join(calcs[-1].get("formula_steps", [])), styles["Normal"]))
    else:
        story.append(Paragraph("No calculation was performed during this session.", styles["SmallNote"]))

    story.append(Spacer(1, 12))
    story.append(Paragraph("Document Checklist", styles["SectionTitle"]))
    docs = session.get("documents", [])
    checklist_data = [
        [Paragraph("<b>Document Type</b>", styles["Normal"]),
         Paragraph("<b>Uploaded</b>", styles["Normal"]),
         Paragraph("<b>Fields</b>", styles["Normal"])],
    ]
    for d in docs:
        uploaded_str = time.strftime("%Y-%m-%d %H:%M", time.localtime(d["uploaded_at"]))
        checklist_data.append([
            Paragraph(d["doc_type"].replace("_", " ").title(), styles["Normal"]),
            Paragraph(uploaded_str, styles["Normal"]),
            Paragraph(", ".join(d.get("field_names", [])), styles["Normal"]),
        ])
    if len(checklist_data) > 1:
        t = Table(checklist_data, colWidths=[1.5*inch, 1.5*inch, 3*inch])
        t.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (-1, 0), colors.Color(0.9, 0.9, 0.9)),
        ]))
        story.append(t)
    else:
        story.append(Paragraph("No documents uploaded.", styles["SmallNote"]))

    story.append(Spacer(1, 20))
    story.append(Paragraph(
        "Disclaimer: This packet is provided as a convenience tool. "
        "The renter is responsible for verifying all information before submission. "
        "A qualified human reviews all information before any eligibility decision.",
        styles["Disclaimer"]
    ))

    doc.build(story)
    return buf.getvalue()


@router.post("/assemble", response_model=PacketResponse)
def assemble_packet(req: PacketRequest):
    session = session_store.get_session(req.session_token)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    profile = session_store.get_decrypted_profile(req.session_token)
    if profile is None:
        raise HTTPException(
            status_code=400,
            detail="No profile found. Complete Stage 1 first.",
        )

    packet_id = secrets.token_hex(8)

    pdf_bytes = _build_pdf(session, profile, req.include_fields)

    with session_store._lock:
        session["packets"].append({
            "packet_id": packet_id,
            "created_at": time.time(),
            "pdf_bytes": pdf_bytes,
            "include_fields": req.include_fields,
        })

    session_store.log_action(req.session_token, "packet_assembled", "packet")

    return PacketResponse(
        packet_id=packet_id,
        download_url=f"/packet/download/{packet_id}",
        fields_included=len(req.include_fields) if req.include_fields else (len(profile) if profile else 0),
        expires_at="Session end",
    )


@router.get("/download/{packet_id}")
def download_packet(packet_id: str, session_token: str = ""):
    session = session_store.get_session(session_token)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    packet = next((p for p in session.get("packets", []) if p["packet_id"] == packet_id), None)
    if packet is None:
        raise HTTPException(status_code=404, detail="Packet not found")

    pdf_bytes = packet["pdf_bytes"]
    session_store.log_action(session_token, "packet_downloaded", packet_id)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="RealDoor_packet_{packet_id}.pdf"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )


@router.delete("/{packet_id}", response_model=dict)
def delete_packet(packet_id: str, session_token: str = ""):
    session = session_store.get_session(session_token)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    packets = session.get("packets", [])
    before = len(packets)
    session["packets"] = [p for p in packets if p["packet_id"] != packet_id]
    if len(session["packets"]) == before:
        raise HTTPException(status_code=404, detail="Packet not found")
    session_store.log_action(session_token, "packet_deleted", packet_id)
    return {"message": "Packet deleted."}
