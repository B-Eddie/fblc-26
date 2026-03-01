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
} from "lucide-react";
import SignaturePad from "./SignaturePad";

interface PDFSignerProps {
  /** Volunteer name to embed in the PDF */
  volunteerName: string;
  /** Business / supervisor name */
  supervisorName: string;
  /** Total approved hours */
  totalHours: number;
  /** Opportunity title */
  opportunityTitle: string;
  /** Called after signing completes with the signed PDF bytes */
  onSigned?: (pdfBytes: Uint8Array) => void;
  /** Application id for record keeping */
  applicationId?: string;
}

export default function PDFSigner({
  volunteerName,
  supervisorName,
  totalHours,
  opportunityTitle,
  onSigned,
}: PDFSignerProps) {
  const [step, setStep] = useState<"preview" | "sign" | "done">("preview");
  const [, setSignatureDataUrl] = useState<string | null>(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignatureCapture = useCallback(
    async (dataUrl: string) => {
      setSignatureDataUrl(dataUrl);
      setProcessing(true);
      setError(null);

      try {
        // Fetch the blank PDF from public folder
        const pdfResponse = await fetch(
          "/record-of-community-involvement-hours.pdf",
        );
        if (!pdfResponse.ok) throw new Error("Could not load PDF template");
        const pdfBytes = await pdfResponse.arrayBuffer();

        // Load PDF with pdf-lib
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Embed the signature image
        const sigImageBytes = await fetch(dataUrl).then((r) =>
          r.arrayBuffer(),
        );
        const sigImage = await pdfDoc.embedPng(sigImageBytes);
        const sigDims = sigImage.scale(0.35);

        // Place the signature on the page
        // Position: lower portion of the page where the supervisor signature field typically is
        // Adjust these coordinates based on the actual PDF layout
        const sigX = width * 0.08;
        const sigY = height * 0.08;

        firstPage.drawImage(sigImage, {
          x: sigX,
          y: sigY,
          width: Math.min(sigDims.width, 200),
          height: Math.min(sigDims.height, 80),
        });

        // Add text annotations for the record
        const { rgb } = await import("pdf-lib");

        // Supervisor name text near signature
        firstPage.drawText(supervisorName, {
          x: sigX + 210,
          y: sigY + 20,
          size: 10,
          color: rgb(0, 0, 0),
        });

        // Date of signing
        const today = new Date().toLocaleDateString();
        firstPage.drawText(today, {
          x: sigX + 210,
          y: sigY + 5,
          size: 9,
          color: rgb(0.3, 0.3, 0.3),
        });

        // Volunteer info at the top area
        firstPage.drawText(`Volunteer: ${volunteerName}`, {
          x: width * 0.08,
          y: height - 80,
          size: 10,
          color: rgb(0, 0, 0),
        });

        firstPage.drawText(
          `Activity: ${opportunityTitle}  |  Hours: ${totalHours.toFixed(1)}`,
          {
            x: width * 0.08,
            y: height - 95,
            size: 9,
            color: rgb(0.2, 0.2, 0.2),
          },
        );

        // Save the modified PDF
        const signedBytes = await pdfDoc.save();
        const blob = new Blob([new Uint8Array(signedBytes)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        setSignedPdfUrl(url);
        setStep("done");
        onSigned?.(signedBytes);
      } catch (err: any) {
        console.error("PDF signing error:", err);
        setError(err.message || "Failed to process PDF");
      } finally {
        setProcessing(false);
      }
    },
    [supervisorName, volunteerName, totalHours, opportunityTitle, onSigned],
  );

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
    setStep("preview");
    setSignatureDataUrl(null);
    setSignedPdfUrl(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        {[
          { id: "preview", label: "Preview Form", icon: Eye },
          { id: "sign", label: "Draw Signature", icon: PenTool },
          { id: "done", label: "Download", icon: Download },
        ].map((s, i) => (
          <div key={s.id} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-12 h-0.5 mx-2 ${step === s.id || (s.id === "done" && step === "done") || (s.id === "sign" && step !== "preview") ? "bg-green-500" : "bg-gray-700"}`}
              />
            )}
            <div
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                step === s.id
                  ? "bg-gray-700/60 text-white"
                  : step === "done" || (step === "sign" && s.id === "preview")
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

      {/* Step 1: Preview */}
      {step === "preview" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gray-800/30 border border-gray-700/40 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <span>Record of Community Involvement Hours</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-400">Volunteer:</span>
                <span className="text-white ml-2">{volunteerName}</span>
              </div>
              <div>
                <span className="text-gray-400">Supervisor:</span>
                <span className="text-white ml-2">{supervisorName}</span>
              </div>
              <div>
                <span className="text-gray-400">Activity:</span>
                <span className="text-white ml-2">{opportunityTitle}</span>
              </div>
              <div>
                <span className="text-gray-400">Total Hours:</span>
                <span className="text-white ml-2 font-semibold">
                  {totalHours.toFixed(1)}
                </span>
              </div>
            </div>

            {/* PDF Preview */}
            <div className="border border-gray-700/40 rounded-lg overflow-hidden bg-gray-900/60">
              <iframe
                src="/record-of-community-involvement-hours.pdf"
                className="w-full h-[400px]"
                title="PDF Preview"
              />
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
              <span>Proceed to Sign</span>
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

      {/* Step 2: Signature */}
      {step === "sign" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gray-800/30 border border-gray-700/40 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Draw Your Signature
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Use your mouse or finger to sign below. This signature will be
              embedded into the community involvement hours PDF form.
            </p>
            <SignaturePad onSignatureCapture={handleSignatureCapture} />
          </div>

          {processing && (
            <div className="flex items-center justify-center space-x-3 p-4 bg-gray-800/30 border border-gray-700/40 rounded-xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-5 h-5 border-2 border-gray-600/30 border-t-gray-400 rounded-full"
              />
              <span className="text-gray-300 text-sm">
                Embedding signature into PDF...
              </span>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStep("preview")}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-700/50 text-gray-300 rounded-lg font-medium hover:bg-gray-800/50 transition text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Back to Preview</span>
          </motion.button>
        </motion.div>
      )}

      {/* Step 3: Done */}
      {step === "done" && signedPdfUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">
              PDF Signed Successfully!
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              The volunteer hours form has been signed. You can preview and
              download it below.
            </p>
          </div>

          {/* Signed PDF Preview */}
          <div className="bg-gray-800/30 border border-gray-700/40 rounded-xl p-4">
            <iframe
              src={signedPdfUrl}
              className="w-full h-[400px] rounded-lg"
              title="Signed PDF Preview"
            />
          </div>

          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={downloadSignedPdf}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-green-600/30 transition"
            >
              <Download className="w-5 h-5" />
              <span>Download Signed PDF</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={reset}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-700/50 text-gray-300 rounded-lg font-medium hover:bg-gray-800/50 transition"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Sign Again</span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
