"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { PDFDocument } from "pdf-lib";
import {
  FileText,
  Download,
  Eye,
  PenTool,
  CheckCircle,
  RotateCcw,
  AlertCircle,
  Send,
  ClipboardEdit,
} from "lucide-react";
import SignaturePad from "./SignaturePad";
import { supabase } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  PDF form-field definitions — extracted from the actual PDF         */
/* ------------------------------------------------------------------ */
interface FieldDef {
  pdfFieldName: string;
  label: string;
  isSignature?: boolean;
  prefillKey?: "volunteerName" | "supervisorName" | "totalHours" | "opportunityTitle";
  /** Which dashboard this field is filled on */
  role: "business" | "volunteer" | "both";
}

const PDF_FIELDS: FieldDef[] = [
  { pdfFieldName: "Student Name", label: "Student Name", prefillKey: "volunteerName", role: "business" },
  { pdfFieldName: "Name of Community Sponsor", label: "Name of Community Sponsor", prefillKey: "supervisorName", role: "business" },
  { pdfFieldName: "Estimated Hours", label: "Estimated Hours", prefillKey: "totalHours", role: "business" },
  { pdfFieldName: "Location  Address", label: "Location / Address", role: "business" },
  { pdfFieldName: "Proposed Activity", label: "Proposed Activity", prefillKey: "opportunityTitle", role: "business" },
  { pdfFieldName: "Sponsor Contact phone  or email", label: "Sponsor Contact (phone / email)", role: "business" },
  { pdfFieldName: "Completion Date", label: "Completion Date", role: "business" },
  { pdfFieldName: "Total Hours", label: "Total Hours", prefillKey: "totalHours", role: "business" },
  { pdfFieldName: "Date Entered", label: "Date Entered", role: "business" },
  { pdfFieldName: "Sponsor Signature2", label: "Sponsor Signature", isSignature: true, role: "business" },
  { pdfFieldName: "Student Signature", label: "Student Signature", isSignature: true, role: "volunteer" },
  { pdfFieldName: "Parent  Guardian Signature permission If student under 18", label: "Parent / Guardian Signature (if under 18)", role: "volunteer" },
  { pdfFieldName: "Principal or designate signature if necessary1", label: "Principal or Designate Signature (if necessary)", role: "volunteer" },
];

/* Exact widget rectangles from the PDF (pdf-lib inspection) */
const SIG_RECTS: Record<string, { x: number; y: number; w: number; h: number }> = {
  "Sponsor Signature2":  { x: 382.92, y: 120, w: 183.36, h: 24.24 },
  "Student Signature":   { x: 111.12, y: 93,  w: 183.12, h: 25.2  },
  "Parent  Guardian Signature permission If student under 18": { x: 476.64, y: 201, w: 88.56, h: 28.8 },
  "Principal or designate signature if necessary1": { x: 233.52, y: 179.04, w: 331.92, h: 20.28 },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface PDFSignerProps {
  volunteerName: string;
  supervisorName: string;
  totalHours: number;
  opportunityTitle: string;
  onSigned?: (pdfBytes: Uint8Array) => void;
  applicationId?: string;
  signatureRequestId?: string;
  /** Which role is filling the form — controls which fields are shown */
  role?: "business" | "volunteer";
  /** Load an existing (partially-filled) PDF instead of the blank template */
  pdfUrl?: string;
}

type Step = "fill" | "sign" | "done";

export default function PDFSigner({
  volunteerName,
  supervisorName,
  totalHours,
  opportunityTitle,
  onSigned,
  applicationId,
  signatureRequestId,
  role = "business",
  pdfUrl,
}: PDFSignerProps) {
  const visibleFields = PDF_FIELDS.filter((f) => f.role === role || f.role === "both");
  const [step, setStep] = useState<Step>("fill");
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Form field values keyed by pdfFieldName
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of visibleFields) {
      if (f.isSignature) continue;
      if (f.prefillKey === "volunteerName") init[f.pdfFieldName] = volunteerName;
      else if (f.prefillKey === "supervisorName") init[f.pdfFieldName] = supervisorName;
      else if (f.prefillKey === "totalHours") init[f.pdfFieldName] = totalHours.toFixed(1);
      else if (f.prefillKey === "opportunityTitle") init[f.pdfFieldName] = opportunityTitle;
      else init[f.pdfFieldName] = "";
    }
    return init;
  });

  // Signature data-URLs keyed by pdfFieldName
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [activeSigField, setActiveSigField] = useState<string | null>(null);

  const setField = (name: string, value: string) =>
    setFormValues((prev) => ({ ...prev, [name]: value }));

  /* ---- build the PDF with form data + signatures ---- */
  const buildPdf = useCallback(async () => {
    setProcessing(true);
    setError(null);
    try {
      const pdfSource = pdfUrl || "/record-of-community-involvement-hours.pdf";
      const pdfResponse = await fetch(pdfSource);
      if (!pdfResponse.ok) throw new Error("Could not load PDF");
      const pdfBytes = await pdfResponse.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Fill every text field with standardised 11pt font
      const { StandardFonts } = await import("pdf-lib");
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (const f of visibleFields) {
        if (f.isSignature) continue;
        const value = formValues[f.pdfFieldName] ?? "";
        try {
          const field = form.getTextField(f.pdfFieldName);
          field.setText(value);
          field.setFontSize(11);
          field.defaultUpdateAppearances(font);
        } catch {
          // field might not exist — skip
        }
      }

      // Embed signature images
      const page = pdfDoc.getPages()[0];

      const embedSig = async (
        dataUrl: string,
        rect: { x: number; y: number; w: number; h: number },
        fieldName: string,
      ) => {
        try { form.getTextField(fieldName).setText(""); } catch {}

        const sigBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
        const sigImage = await pdfDoc.embedPng(sigBytes);

        const pad = 2;
        const availW = rect.w - pad * 2;
        const availH = rect.h - pad * 2;
        const scale = Math.min(availW / sigImage.width, availH / sigImage.height);
        const drawW = sigImage.width * scale;
        const drawH = sigImage.height * scale;
        const drawX = rect.x + pad + (availW - drawW) / 2;
        const drawY = rect.y + pad + (availH - drawH) / 2;

        page.drawImage(sigImage, { x: drawX, y: drawY, width: drawW, height: drawH });
      };

      // Embed all captured signatures into their exact PDF field rectangles
      for (const [fieldName, dataUrl] of Object.entries(signatures)) {
        const rect = SIG_RECTS[fieldName];
        if (rect && dataUrl) {
          await embedSig(dataUrl, rect, fieldName);
        }
      }

      // Only flatten on the final step (volunteer signs last)
      if (role === "volunteer") {
        form.flatten();
      }

      const signedBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(signedBytes)], { type: "application/pdf" });
      const localUrl = URL.createObjectURL(blob);

      // Upload to Supabase Storage
      let publicUrl: string | null = null;
      try {
        const fileName = `signed-${applicationId || "pdf"}-${Date.now()}.pdf`;
        const { error: uploadErr } = await supabase.storage
          .from("signed-pdfs")
          .upload(fileName, new Uint8Array(signedBytes), {
            contentType: "application/pdf",
            upsert: true,
          });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from("signed-pdfs")
            .getPublicUrl(fileName);
          publicUrl = urlData?.publicUrl ?? null;
        }
      } catch {
        // best-effort
      }

      if (publicUrl && signatureRequestId) {
        await supabase
          .from("signature_requests")
          .update({ signed_pdf_url: publicUrl } as any)
          .eq("id", signatureRequestId);
      }

      setSignedPdfUrl(publicUrl || localUrl);
      setStep("done");
      onSigned?.(signedBytes);
    } catch (err: any) {
      console.error("PDF build error:", err);
      setError(err.message || "Failed to build PDF");
    } finally {
      setProcessing(false);
    }
  }, [formValues, signatures, applicationId, signatureRequestId, onSigned, pdfUrl, role]);

  const downloadSignedPdf = () => {
    if (!signedPdfUrl) return;
    const a = document.createElement("a");
    a.href = signedPdfUrl;
    a.download = `signed-volunteer-hours-${volunteerName.replace(/\s+/g, "-").toLowerCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const reset = () => {
    setStep("fill");
    setSignedPdfUrl(null);
    setError(null);
    setSent(false);
  };

  const sendToVolunteer = async () => {
    if (!signatureRequestId) {
      setSent(true);
      return;
    }
    try {
      await supabase
        .from("signature_requests")
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
        } as any)
        .eq("id", signatureRequestId);
      setSent(true);
    } catch (err) {
      console.error("Error sending to volunteer:", err);
    }
  };

  const stepDefs: { id: Step; label: string; icon: any }[] = [
    { id: "fill", label: "Fill Form", icon: ClipboardEdit },
    { id: "sign", label: "Sign", icon: PenTool },
    { id: "done", label: "Review & Send", icon: Send },
  ];
  const stepIndex = stepDefs.findIndex((s) => s.id === step);

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        {stepDefs.map((s, i) => (
          <div key={s.id} className="flex items-center">
            {i > 0 && (
              <div className={`w-12 h-0.5 mx-2 ${i <= stepIndex ? "bg-green-500" : "bg-gray-700"}`} />
            )}
            <div
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                step === s.id
                  ? "bg-gray-700/60 text-white"
                  : i < stepIndex
                    ? "text-green-400"
                    : "text-gray-500"
              }`}
            >
              <s.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-4 bg-red-600/10 border border-red-600/30 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ====== STEP 1 — Fill Form ====== */}
      {step === "fill" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-gray-800/30 border border-gray-700/40 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <span>Record of Community Involvement Hours</span>
            </h3>
            <p className="text-gray-400 text-sm mb-5">
              Fill in the fields below. They will be written directly into the PDF form.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleFields.filter((f) => !f.isSignature).map((f) => (
                <div key={f.pdfFieldName} className={f.pdfFieldName === "Student Name" ? "md:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{f.label}</label>
                  <input
                    type="text"
                    value={formValues[f.pdfFieldName] ?? ""}
                    onChange={(e) => setField(f.pdfFieldName, e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep("sign")}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition"
            >
              <PenTool className="w-5 h-5" />
              <span>Next: Signatures</span>
            </motion.button>
            <a
              href="/record-of-community-involvement-hours.pdf"
              download
              className="flex items-center space-x-2 px-6 py-3 border border-gray-700/50 text-gray-300 rounded-lg font-medium hover:bg-gray-800/50 transition"
            >
              <Download className="w-5 h-5" />
              <span>Download Blank</span>
            </a>
          </div>
        </motion.div>
      )}

      {/* ====== STEP 2 — Signatures ====== */}
      {step === "sign" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {visibleFields.filter((f) => f.isSignature).map((f) => (
            <div key={f.pdfFieldName} className="bg-gray-800/30 border border-gray-700/40 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">{f.label}</h3>
              <p className="text-gray-400 text-sm mb-3">
                Draw your signature below. It will be placed inside the &ldquo;{f.label}&rdquo; box on the PDF.
              </p>

              {signatures[f.pdfFieldName] ? (
                <div className="space-y-3">
                  <div className="border-2 border-green-600/40 rounded-xl p-3 bg-white flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={signatures[f.pdfFieldName]} alt="Signature" className="max-h-24 object-contain" />
                  </div>
                  <div className="flex space-x-3">
                    <span className="flex items-center space-x-1 text-green-400 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      <span>Captured</span>
                    </span>
                    <button
                      onClick={() => setSignatures((prev) => { const next = { ...prev }; delete next[f.pdfFieldName]; return next; })}
                      className="text-gray-400 text-sm hover:text-white transition"
                    >
                      Re-draw
                    </button>
                  </div>
                </div>
              ) : activeSigField === f.pdfFieldName ? (
                <SignaturePad
                  onSignatureCapture={(dataUrl) => {
                    setSignatures((prev) => ({ ...prev, [f.pdfFieldName]: dataUrl }));
                    setActiveSigField(null);
                  }}
                />
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveSigField(f.pdfFieldName)}
                  className="flex items-center space-x-2 px-5 py-2.5 border border-gray-700/50 text-gray-300 rounded-lg font-medium hover:bg-gray-800/50 transition text-sm"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Draw Signature</span>
                </motion.button>
              )}
            </div>
          ))}

          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={buildPdf}
              disabled={processing}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition disabled:opacity-50"
            >
              <Eye className="w-5 h-5" />
              <span>{processing ? "Building PDF..." : "Generate & Preview PDF"}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep("fill")}
              className="flex items-center space-x-2 px-4 py-2.5 border border-gray-700/50 text-gray-300 rounded-lg font-medium hover:bg-gray-800/50 transition text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Back to Form</span>
            </motion.button>
          </div>

          {processing && (
            <div className="flex items-center justify-center space-x-3 p-4 bg-gray-800/30 border border-gray-700/40 rounded-xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-5 h-5 border-2 border-gray-600/30 border-t-gray-400 rounded-full"
              />
              <span className="text-gray-300 text-sm">Filling form fields &amp; embedding signatures...</span>
            </div>
          )}
        </motion.div>
      )}

      {/* ====== STEP 3 — Review & Send ====== */}
      {step === "done" && signedPdfUrl && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">
              {sent ? "Sent to Volunteer!" : "PDF Ready!"}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {sent
                ? "The signed form is now available on the volunteer\u2019s dashboard."
                : "Review the completed form below, then send it to the volunteer."}
            </p>
          </div>

          <div className="bg-gray-800/30 border border-gray-700/40 rounded-xl p-4">
            <iframe src={signedPdfUrl} className="w-full h-[500px] rounded-lg" title="Signed PDF Preview" />
          </div>

          <div className="flex flex-wrap gap-3">
            {!sent && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={sendToVolunteer}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-green-600/30 transition"
              >
                <Send className="w-5 h-5" />
                <span>Send to Volunteer</span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={downloadSignedPdf}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-700/50 text-gray-300 rounded-lg font-medium hover:bg-gray-800/50 transition"
            >
              <Download className="w-5 h-5" />
              <span>Download Copy</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={reset}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-700/50 text-gray-300 rounded-lg font-medium hover:bg-gray-800/50 transition"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Start Over</span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
