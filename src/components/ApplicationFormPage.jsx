"use client";

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { api } from "../api/api";

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

    // Fetch data
    useEffect(() => {
        if (!pdfCategoryID) {
            setError("PDF kategoriyasi tanlanmagan");
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const fieldsRes = await api.get(`/application-items?pdf_category_item_id=${pdfCategoryID}`);
                const fields = fieldsRes.data.application_requireds || [];
                setRequiredFields(fields);

                const initialValues = fields.reduce((acc, field) => {
                    acc[field.id] = "";
                    return acc;
                }, {});
                setFormValues(initialValues);

                const htmlRes = await api.get(`/html-download?pdf_category_item_id=${pdfCategoryID}`);
                const template = htmlRes.data || "";
                setHtmlTemplate(template);
                setPreviewHtml(template);
            } catch (err) {
                if (err.response?.status === 404) {
                    navigate(`/dashboard/pdf-categories/template/${pdfCategoryID}?create=true`);
                } else if (err.response?.status === 401) {
                    navigate("/");
                } else {
                    setError("Ma'lumotlarni yuklashda xatolik");
                }
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [pdfCategoryID, navigate]);

    // Update preview
    useEffect(() => {
        if (htmlTemplate && Object.keys(formValues).length > 0) {
            let updated = htmlTemplate;
            Object.entries(formValues).forEach(([key, value]) => {
                const regex = new RegExp(`{{.${key}}}`, "g");
                updated = updated.replace(regex, value || "");
            });
            setPreviewHtml(updated);
        }
    }, [formValues, htmlTemplate]);

    const handleInputChange = (fieldId, value) => {
        setFormValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleBack = () => navigate(-1);

    const handleDownload = () => {
        try {
            const pdfHtml = `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <title>Document_${pdfCategoryID}</title>
                    <style>
                      body { font-family: 'Times New Roman', serif; margin: 20mm; line-height: 1.6; }
                      @page { size: A4; margin: 0; }
                      table, img { page-break-inside: avoid; }
                      .page-break { page-break-before: always; }
                    </style>
                  </head>
                  <body>${previewHtml}</body>
                </html>
            `;

            const element = document.createElement("div");
            element.innerHTML = pdfHtml;

            const opt = {
                margin: [10, 10, 10, 10],
                filename: `Ariza_${pdfCategoryID}_${new Date().toISOString().slice(0, 10)}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            };

            html2pdf().from(element).set(opt).save();
        } catch (err) {
            console.error("PDF xato:", err);
            alert("PDF yaratishda xato yuz berdi.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-lg">Yuklanmoqda...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <p className="text-red-600 text-center">{error}</p>
                <button onClick={handleBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Orqaga
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Back Button - Har doim ko'rinadi */}
            <button
                onClick={handleBack}
                className="fixed top-4 left-4 z-50 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all"
                aria-label="Orqaga"
            >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Main Content - Responsive Grid */}
            <div className="flex-1 p-0 pt-16 md:p-6 lg:p-8 mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                    {/* Form Fields */}
                    <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 overflow-y-auto max-h-[80vh] lg:max-h-full">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-5">Ariza Maydonlari</h2>
                        {requiredFields.length > 0 ? (
                            <div className="space-y-4">
                                {requiredFields.map((field) => (
                                    <div key={field.id}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {field.text}
                                        </label>
                                        <input
                                            type={field.type === "date" ? "date" : "text"}
                                            value={formValues[field.id] || ""}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder={field.text}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">Maydonlar mavjud emas.</p>
                        )}
                    </div>

                    {/* Preview + Download */}
                    <div className="bg-gray-100 rounded-xl shadow-sm p-0 md:p-6 flex flex-col">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-5">Hujjat Ko'rinishi</h2>
                        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-0 md:p-6 overflow-auto shadow-inner">
                            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                        </div>
                        <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-end">
                            <button
                                onClick={handleDownload}
                                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                PDF yuklab olish
                            </button>
                            <button
                                onClick={() => navigate(`/dashboard/pdf-categories/template/${pdfCategoryID}`)}
                                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                Shablonni tahrirlash
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplicationFormPage;