"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import {api} from "../api/api"

const ApplicationFormPage = () => {
    const [requiredFields, setRequiredFields] = useState([]);
    const [htmlTemplate, setHtmlTemplate] = useState("");
    const [formValues, setFormValues] = useState({});
    const [previewHtml, setPreviewHtml] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const pdfCategoryID = searchParams.get("pdfCategoryID");

    // Fetch required fields and HTML template when pdfCategoryID changes
    useEffect(() => {
        if (pdfCategoryID) {
            const fetchData = async () => {
                setLoading(true);
                setError(null);
                try {
                    // Fetch application required fields
                    const fieldsResponse = await api.get(
                        `/application-items?pdf_category_item_id=${pdfCategoryID}`
                    );
                    const fields = fieldsResponse.data.application_requireds || [];
                    setRequiredFields(fields);

                    // Initialize form values
                    const initialValues = fields.reduce((acc, field) => {
                        acc[field.id] = "";
                        return acc;
                    }, {});
                    setFormValues(initialValues);

                    // Fetch HTML template
                    const htmlResponse = await api.get(
                        `/html-download?pdf_category_item_id=${pdfCategoryID}`
                    );
                    setHtmlTemplate(htmlResponse.data);
                    setPreviewHtml(htmlResponse.data); // Initial preview without replacements
                } catch (err) {
                    setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        } else {
            setRequiredFields([]);
            setHtmlTemplate("");
            setFormValues({});
            setPreviewHtml("");
        }
    }, [pdfCategoryID]);

    // Update preview when form values change
    useEffect(() => {
        if (htmlTemplate && Object.keys(formValues).length > 0) {
            let updatedHtml = htmlTemplate;
            Object.entries(formValues).forEach(([key, value]) => {
                const placeholder = new RegExp(`{{.${key}}}`, "g");
                updatedHtml = updatedHtml.replace(placeholder, value || "");
            });
            setPreviewHtml(updatedHtml);
        }
    }, [formValues, htmlTemplate]);

    const handleInputChange = (fieldId, value) => {
        setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    };

    const handleBack = () => {
        navigate(-1); // Navigate back to the previous page
    };

    const handleDownload = () => {
        try {
            // Use only the previewHtml for PDF generation
            const pdfHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Document_${pdfCategoryID}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              table, img, div { page-break-inside: avoid; }
            </style>
          </head>
          <body>
            ${previewHtml}
          </body>
        </html>
      `;

            console.log("PDF HTML:", pdfHtml); // Debug: Check HTML content

            const element = document.createElement("div");
            element.innerHTML = pdfHtml;
            const opt = {
                margin: 10,
                filename: `document_${pdfCategoryID}_${new Date().toISOString().slice(0, 10)}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: true },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                pagebreak: { mode: ["avoid-all", "css", "legacy"], avoid: "table" },
            };
            html2pdf().from(element).set(opt).save();
        } catch (err) {
            console.error("PDF generation error:", err);
            alert("PDF generatsiyasida xatolik yuz berdi. Iltimos, konsolni tekshiring.");
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Yuklanmoqda...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    return (
        <div className="flex w-full h-screen bg-gray-100">
            {/* Back Button */}
            <button
                onClick={handleBack}
                className="absolute top-4 left-4 p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
            >
                <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </button>

            {/* Main content: Form fields on left, Preview on right */}
            <div className="flex w-full ml-12 mt-12">
                {/* Form fields */}
                <div className="w-1/2 p-6 bg-white overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Ariza Maydonlari</h2>
                    {requiredFields.length > 0 ? (
                        requiredFields.map((field) => (
                            <div key={field.id} className="mb-4">
                                <label className="block text-sm font-medium mb-1">{field.text}</label>
                                <input
                                    type={field.type === "date" ? "date" : "text"}
                                    value={formValues[field.id] || ""}
                                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                                    className="w-full border border-gray-300 rounded p-2"
                                    placeholder={field.text}
                                />
                            </div>
                        ))
                    ) : (
                        <p>Iltimos, element tanlang.</p>
                    )}
                </div>

                {/* Document preview */}
                <div className="w-1/2 p-6 bg-gray-50 overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Hujjat Ko'rinishi</h2>
                    <div>
                        <div
                            className="bg-white p-4 border border-gray-300 rounded shadow"
                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />
                        <div className="p-6 flex justify-end w-full">
                            <button
                                onClick={handleDownload}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                                PDF sifatida yuklab olish
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplicationFormPage;