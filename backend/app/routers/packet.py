from fastapi import APIRouter, HTTPException
from app.schemas.allowlist import PacketRequest, PacketResponse
from app.guardrails.session_store import session_store
import secrets
import json

router = APIRouter(prefix="/packet", tags=["packet"])


@router.post("/assemble", response_model=PacketResponse)
def assemble_packet(req: PacketRequest):
    session = session_store.get_session(req.session_token)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    profile = session.get("profile")
    if profile is None:
        raise HTTPException(
            status_code=400,
            detail="No profile found. Complete Stage 1 first.",
        )

    packet_id = secrets.token_hex(8)

    session_store.log_action(req.session_token, "packet_assembled", "packet")

    return PacketResponse(
        packet_id=packet_id,
        download_url=f"/packet/download/{packet_id}",
        fields_included=len(req.include_fields) if req.include_fields else len(profile),
        expires_at="Session end",
    )


@router.get("/download/{packet_id}", response_model=dict)
def download_packet(packet_id: str):
    return {
        "message": f"Packet {packet_id} downloaded. "
                   "This packet is for the renter's records only. "
                   "It has NOT been transmitted to any property or agency.",
        "packet_id": packet_id,
    }
