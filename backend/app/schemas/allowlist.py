from pydantic import BaseModel, Field, field_validator
from typing import Optional
from enum import Enum


class DocumentType(str, Enum):
    PAY_STUB = "pay_stub"
    BENEFIT_LETTER = "benefit_letter"
    TAX_RETURN = "tax_return"
    BANK_STATEMENT = "bank_statement"
    ID_DOCUMENT = "id_document"
    OTHER = "other"


class IncomeSource(str, Enum):
    EMPLOYMENT = "employment"
    SOCIAL_SECURITY = "social_security"
    SSI = "ssi"
    SSDI = "ssdi"
    TANF = "tanf"
    SNAP = "snap"
    CHILD_SUPPORT = "child_support"
    PENSION = "pension"
    UNEMPLOYMENT = "unemployment"
    VETERANS_BENEFITS = "veterans_benefits"
    OTHER = "other"


class ExtractedField(BaseModel):
    field_name: str = Field(..., description="Name of the extracted field")
    value: str = Field(..., description="Extracted value as text")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score 0-1")
    source_snippet: str = Field(..., description="Source text snippet from document")
    page_number: Optional[int] = Field(None, description="Page number where found")
    requires_confirmation: bool = Field(
        True, description="Must be confirmed by renter before use"
    )


class ExtractionResult(BaseModel):
    document_type: DocumentType
    fields: list[ExtractedField]
    raw_text_hash: str = Field(..., description="SHA-256 of raw OCR text, not stored")


class FieldConfirmation(BaseModel):
    session_token: str
    field_name: str
    corrected_value: Optional[str] = Field(
        None, description="Renter's correction, null if accepted"
    )
    confirmed: bool = True


class RenterProfile(BaseModel):
    session_token: str
    full_name: Optional[str] = Field(None, max_length=200)
    household_size: Optional[int] = Field(None, ge=1, le=20)
    annual_income: Optional[float] = Field(None, ge=0.0)
    monthly_income: Optional[float] = Field(None, ge=0.0)
    income_source: Optional[IncomeSource] = None
    has_voucher: Optional[bool] = None
    voucher_type: Optional[str] = Field(None, pattern=r"^(section8|other|)$")
    current_address: Optional[str] = Field(None, max_length=500)
    has_government_id: Optional[bool] = None
    is_veteran: Optional[bool] = None
    is_senior: Optional[bool] = None
    has_disability: Optional[bool] = None
    property_county: Optional[str] = None
    property_cbsa: Optional[str] = None

    @field_validator("annual_income", "monthly_income")
    @classmethod
    def prevent_negative_income(cls, v):
        if v is not None and v < 0:
            raise ValueError("Income cannot be negative")
        return v


class RuleQuery(BaseModel):
    session_token: str = ""
    question: str = Field(..., max_length=1000)
    context: Optional[RenterProfile] = None


class RuleAnswer(BaseModel):
    answer: str
    citations: list[dict] = Field(
        ..., description="List of {source_url, effective_date, snippet}"
    )
    abstained: bool = False


class CalculationRequest(BaseModel):
    annual_income: float = Field(..., ge=0.0)
    household_size: int = Field(..., ge=1, le=20)
    county_or_cbsa: str


class CalculationResult(BaseModel):
    annual_income: float
    household_size: int
    area_median_income: Optional[float] = None
    income_limit_30: Optional[float] = None
    income_limit_50: Optional[float] = None
    income_limit_60: Optional[float] = None
    ami_percentage: Optional[float] = Field(
        None, description="Income as % of AMI"
    )
    formula_steps: list[str] = Field(
        ..., description="Human-readable calculation trace"
    )
    source_url: Optional[str] = None
    effective_date: Optional[str] = None


class ChecklistItem(BaseModel):
    item_name: str
    status: str = Field(
        ..., description="present | missing | expired"
    )
    document_supported: bool = False
    expiry_date: Optional[str] = None
    notes: Optional[str] = None


class PacketRequest(BaseModel):
    session_token: str
    include_fields: list[str] = Field(default_factory=list)
    export_format: str = "pdf"


class PacketResponse(BaseModel):
    packet_id: str
    download_url: str
    fields_included: int
    expires_at: str


class SessionInfo(BaseModel):
    session_token: str
    created_at: str
    ttl_seconds: int
    has_profile: bool
    fields_confirmed: int
    rule_queries_made: int
    calculations_run: int
