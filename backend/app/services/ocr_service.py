"""
CLINORA — OCR Text Extraction Engine (Phase 5)

Multi-Engine Architecture:
  1. PDFs (Digital): High-speed native text extraction via PyMuPDF.
  2. Scanned PDFs: Render pages to 300 DPI images -> RapidOCR neural network engine.
  3. Images (PNG / JPG / TIFF / WebP): RapidOCR neural network engine with Tesseract fallback.

Extracted text is stored in Document.ocr_text and Document.status is updated to 'processed'.
"""

import logging
import os
import uuid
from typing import Optional, Tuple

import pymupdf  # PyMuPDF
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.repositories.document_repository import get_document_by_id, update_document
from app.schemas.document import DocumentUpdate
from app.services.document_service import map_document_to_response

logger = logging.getLogger(__name__)

# Minimum characters for a PDF page to count as "has native digital text"
MIN_NATIVE_TEXT_LENGTH = 20

# Singleton RapidOCR engine instance
_rapid_ocr_engine = None


def get_ocr_engine():
    """Lazily initializes and caches the RapidOCR neural network engine."""
    global _rapid_ocr_engine
    if _rapid_ocr_engine is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _rapid_ocr_engine = RapidOCR()
            logger.info("RapidOCR ONNX engine initialized successfully.")
        except Exception as e:
            logger.warning(f"Could not load RapidOCR engine: {e}")
            _rapid_ocr_engine = False
    return _rapid_ocr_engine


# ──────────────────────────────────────────────
# Image Preprocessing
# ──────────────────────────────────────────────

def preprocess_image(pil_image: Image.Image) -> Image.Image:
    """
    Preprocess a PIL image for enhanced OCR clarity:
      1. Convert to grayscale
      2. Auto-contrast histogram stretch
      3. Edge sharpening
      4. Upscaling if resolution < 1000px
    """
    img = pil_image.convert("L")
    img = ImageOps.autocontrast(img, cutoff=1)
    img = img.filter(ImageFilter.SHARPEN)

    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.4)

    width, height = img.size
    if width < 1000 or height < 1000:
        scale = max(1000 / width, 1000 / height, 1.0)
        if scale > 1.0:
            new_size = (int(width * scale), int(height * scale))
            img = img.resize(new_size, Image.LANCZOS)

    return img


# ──────────────────────────────────────────────
# Text Extraction from Single Image
# ──────────────────────────────────────────────

def extract_text_from_image_file(file_path: str) -> Tuple[str, float]:
    """
    Extracts text from an image using RapidOCR, with Tesseract as fallback.
    Returns (extracted_text, mean_confidence_percentage).
    """
    # 1. Try RapidOCR (high accuracy neural OCR)
    engine = get_ocr_engine()
    if engine:
        try:
            result, _ = engine(file_path)
            if result:
                lines = []
                confidences = []
                for item in result:
                    text_line = item[1].strip()
                    conf = float(item[2])
                    if text_line:
                        lines.append(text_line)
                        confidences.append(conf)

                full_text = "\n".join(lines)
                mean_conf = (sum(confidences) / len(confidences) * 100.0) if confidences else 0.0
                logger.info(f"RapidOCR extracted {len(lines)} lines with mean confidence {mean_conf:.1f}%")
                return full_text, mean_conf
        except Exception as e:
            logger.warning(f"RapidOCR failed on {file_path}, trying fallback: {e}")

    # 2. Fallback to Tesseract if available
    try:
        import pytesseract
        if os.path.exists(settings.TESSERACT_CMD):
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

        pil_image = Image.open(file_path)
        preprocessed = preprocess_image(pil_image)
        text = pytesseract.image_to_string(preprocessed, config="--oem 3 --psm 6").strip()
        return text, 80.0
    except Exception as e:
        logger.error(f"Fallback OCR also failed: {e}")
        return "", 0.0


# ──────────────────────────────────────────────
# Text Extraction from PDF (Two-Pass)
# ──────────────────────────────────────────────

def extract_text_from_pdf(file_path: str) -> Tuple[str, str]:
    """
    Extract text from a PDF file using a two-pass approach:
      Pass 1 — Native text extraction via PyMuPDF (fast, for digital PDFs).
      Pass 2 — Render each page to 300 DPI image -> RapidOCR (for scanned PDFs).

    Returns (extracted_text, method) where method is 'native' or 'ocr'.
    """
    try:
        pdf_doc = pymupdf.open(file_path)
    except Exception as e:
        logger.error(f"Failed to open PDF {file_path}: {e}")
        return "", "failed"

    # ── Pass 1: Native text extraction ──
    native_text_parts = []
    has_meaningful_text = True

    for page_num in range(len(pdf_doc)):
        page = pdf_doc[page_num]
        page_text = page.get_text("text").strip()
        native_text_parts.append(page_text)

        if len(page_text) < MIN_NATIVE_TEXT_LENGTH:
            has_meaningful_text = False

    if has_meaningful_text and any(native_text_parts):
        full_text = "\n\n".join(
            f"--- Page {i + 1} ---\n{t}"
            for i, t in enumerate(native_text_parts)
            if t
        )
        pdf_doc.close()
        logger.info(f"PDF native extraction succeeded: {len(full_text)} chars from {len(pdf_doc)} pages")
        return full_text.strip(), "native"

    # ── Pass 2: Scanned PDF fallback (render pages to images) ──
    logger.info(f"PDF has no digital text — rendering {len(pdf_doc)} pages for neural OCR")
    ocr_text_parts = []
    engine = get_ocr_engine()

    for page_num in range(len(pdf_doc)):
        page = pdf_doc[page_num]
        zoom = settings.OCR_DPI / 72.0
        matrix = pymupdf.Matrix(zoom, zoom)
        pixmap = page.get_pixmap(matrix=matrix)

        pil_image = Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples)

        page_lines = []
        if engine:
            import numpy as np
            np_img = np.array(pil_image)
            result, _ = engine(np_img)
            if result:
                page_lines = [item[1].strip() for item in result if item[1].strip()]

        if not page_lines:
            # Fallback to Tesseract if RapidOCR had no output
            try:
                import pytesseract
                if os.path.exists(settings.TESSERACT_CMD):
                    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
                preprocessed = preprocess_image(pil_image)
                page_text = pytesseract.image_to_string(preprocessed, config="--oem 3 --psm 6").strip()
                if page_text:
                    page_lines = [page_text]
            except Exception:
                pass

        if page_lines:
            ocr_text_parts.append(f"--- Page {page_num + 1} ---\n" + "\n".join(page_lines))

    pdf_doc.close()
    full_text = "\n\n".join(ocr_text_parts).strip()
    logger.info(f"PDF neural OCR completed: {len(full_text)} chars")
    return full_text, "ocr"


# ──────────────────────────────────────────────
# Main Orchestrator
# ──────────────────────────────────────────────

def process_document_ocr(db: Session, document_id: uuid.UUID):
    """
    Main OCR pipeline orchestrator.

    1. Loads the document from DB.
    2. Sets status to 'processing'.
    3. Determines extraction method based on mime_type.
    4. Runs neural OCR or native PDF text extraction.
    5. Stores result in Document.ocr_text and sets status to 'processed'.
    6. Returns updated DocumentResponse.
    """
    doc = get_document_by_id(db, document_id)
    if not doc:
        raise ValueError(f"Document {document_id} not found")

    if not doc.is_active:
        raise ValueError(f"Document {document_id} has been deleted")

    # Update status to processing
    update_data = DocumentUpdate(status="processing")
    doc = update_document(db, doc, update_data)
    logger.info(f"OCR started for document {document_id} ({doc.mime_type})")

    file_path = os.path.join(os.getcwd(), doc.file_path)
    if not os.path.exists(file_path):
        update_data = DocumentUpdate(status="failed")
        doc = update_document(db, doc, update_data)
        raise FileNotFoundError(f"Document file not found on disk: {file_path}")

    extracted_text = ""
    extraction_method = "unknown"

    try:
        if doc.mime_type == "application/pdf":
            extracted_text, extraction_method = extract_text_from_pdf(file_path)
        elif doc.mime_type in ("image/png", "image/jpeg", "image/jpg", "image/tiff", "image/webp"):
            extracted_text, _ = extract_text_from_image_file(file_path)
            extraction_method = "neural_ocr"
        else:
            raise ValueError(f"Unsupported mime type for OCR: {doc.mime_type}")

    except Exception as e:
        logger.error(f"OCR extraction failed for document {document_id}: {e}")
        update_data = DocumentUpdate(status="failed")
        doc = update_document(db, doc, update_data)
        raise

    if extracted_text:
        update_data = DocumentUpdate(
            status="processed",
            ocr_text=extracted_text,
        )
        doc = update_document(db, doc, update_data)
        logger.info(
            f"OCR successfully completed for document {document_id}: "
            f"{len(extracted_text)} chars via {extraction_method}"
        )
        # Auto-index OCR chunks into ChromaDB vector database (Phase 7 RAG)
        try:
            from app.services.rag_service import index_single_document
            index_single_document(db, doc.id)
        except Exception as e:
            logger.warning(f"Auto vector indexing skipped for document {document_id}: {e}")
    else:
        update_data = DocumentUpdate(status="failed")
        doc = update_document(db, doc, update_data)
        logger.warning(f"OCR produced no text for document {document_id}")

    return map_document_to_response(doc)
