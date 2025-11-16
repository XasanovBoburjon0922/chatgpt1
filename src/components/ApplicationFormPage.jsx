"use client"

import React, { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { api } from "../api/api"
import html2pdf from "html2pdf.js"
import { FileTextOutlined } from "@ant-design/icons"

const ApplicationFormPage = () => {
    const [requiredFields, setRequiredFields] = useState([])
    const [htmlTemplate, setHtmlTemplate] = useState("")
    const [formValues, setFormValues] = useState({})
    const [previewHtml, setPreviewHtml] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [userId, setUserId] = useState(null) // Yangi: Foydalanuvchi ID
    const [uploading, setUploading] = useState(false) // Yuklash holati

    const location = useLocation()
    const navigate = useNavigate()
    const searchParams = new URLSearchParams(location.search)
    const pdfCategoryID = searchParams.get("pdfCategoryID")

    // -------------------------------------------------
    // 1. Foydalanuvchi ma'lumotlarini olish (/users/me)
    // -------------------------------------------------
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get("/users/me")
                setUserId(res.data.id)
            } catch (err) {
                console.error("Foydalanuvchi ma'lumotlarini olishda xato:", err)
                setError("Foydalanuvchi ma'lumotlarini yuklashda xatolik")
            }
        }
        fetchUser()
    }, [])

    // -------------------------------------------------
    // 2. Ma'lumotlarni olish (fields + HTML template)
    // -------------------------------------------------
    useEffect(() => {
        if (!pdfCategoryID) {
            setError("No PDF category selected")
            return
        }

        const fetchData = async () => {
            setLoading(true)
            setError(null)
            try {
                const fieldsRes = await api.get(`/application-items?pdf_category_item_id=${pdfCategoryID}`)
                const fields = fieldsRes.data.application_requireds || []
                setRequiredFields(fields)

                const initialValues = fields.reduce((acc, field) => {
                    acc[field.id] = ""
                    return acc
                }, {})
                setFormValues(initialValues)

                const htmlRes = await api.get(`/html-download?pdf_category_item_id=${pdfCategoryID}`)
                const template = htmlRes.data || ""
                setHtmlTemplate(template)
                setPreviewHtml(template)
            } catch (err) {
                if (err.response?.status === 404) {
                    navigate(`/dashboard/pdf-categories/template/${pdfCategoryID}?create=true`)
                } else if (err.response?.status === 401) {
                    setError("Unauthorized: Please log in again")
                    navigate("/")
                } else {
                    setError("Ma'lumotlarni yuklashda xatolik yuz berdi")
                }
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [pdfCategoryID, navigate])

    // -------------------------------------------------
    // 3. Preview yangilash
    // -------------------------------------------------
    useEffect(() => {
        if (htmlTemplate && Object.keys(formValues).length > 0) {
            let updated = htmlTemplate
            Object.entries(formValues).forEach(([key, value]) => {
                const regex = new RegExp(`{{.${key}}}`, "g")
                updated = updated.replace(regex, value || "")
            })
            setPreviewHtml(updated)
        }
    }, [formValues, htmlTemplate])

    // -------------------------------------------------
    // 4. Input o‘zgarishi
    // -------------------------------------------------
    const handleInputChange = (fieldId, value) => {
        setFormValues(prev => ({ ...prev, [fieldId]: value }))
    }

    // -------------------------------------------------
    // 5. Orqaga qaytish
    // -------------------------------------------------
    const handleBack = () => {
        navigate(-1)
    }

    // -------------------------------------------------
    // 6. PDF yaratish va API ga yuklash (api orqali)
    // -------------------------------------------------
    const handleDownload = async () => {
        if (!userId) {
            alert("Foydalanuvchi ma'lumotlari yuklanmagan.")
            return
        }

        setUploading(true)
        try {
            const pdfHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Document_${pdfCategoryID}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              table, img, div { page-break-inside: avoid; }
            </style>
          </head>
          <body>${previewHtml}</body>
        </html>
      `

            const element = document.createElement("div")
            element.innerHTML = pdfHtml

            const opt = {
                margin: 10,
                filename: `document_${pdfCategoryID}_${new Date().toISOString().slice(0, 10)}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                pagebreak: { mode: ["avoid-all", "css", "legacy"], avoid: "table" },
            }

            // PDF ni blob sifatida yaratish
            const pdf = await html2pdf().from(element).set(opt).outputPdf('blob')

            // Fayl nomi
            const fileName = `document_${pdfCategoryID}_${new Date().toISOString().slice(0, 10)}.pdf`
            const file = new File([pdf], fileName, { type: "application/pdf" })

            // FormData yaratish
            const formData = new FormData()
            formData.append("file", file)

            // API orqali yuklash (baseURL avtomatik qo'shiladi)
            await api.post(
                `/application-user/create`,
                formData,
                {
                    params: {
                        user_id: userId,
                        name: fileName
                    },
                    headers: {
                        'accept': 'application/json',
                        // Content-Type ni qo'ymang — browser avto qo'yadi
                    }
                }
            )

            alert("PDF muvaffaqiyatli yuklandi!")

            // Mahalliy yuklab olish
            const url = window.URL.createObjectURL(pdf)
            const a = document.createElement("a")
            a.href = url
            a.download = fileName
            a.click()
            window.URL.revokeObjectURL(url)

        } catch (err) {
            console.error("PDF yuklashda xatolik:", err)
            if (err.response?.status === 401) {
                alert("Sessiya tugadi. Iltimos, qayta kiring.")
                navigate("/")
            } else {
                alert("PDF yaratish yoki yuklashda xatolik yuz berdi.")
            }
        } finally {
            setUploading(false)
        }
    }

    // -------------------------------------------------
    // 7. UI
    // -------------------------------------------------
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                Yuklanmoqda...
            </div>
        )
    }

    if (error) {
        return <div className="text-red-500 text-center p-6">{error}</div>
    }

    return (
        <div className="flex w-full h-screen bg-gray-100">
            {/* Back Button */}
            <button
                onClick={handleBack}
                className="absolute top-4 left-4 p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors z-10"
            >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Main Content */}
            <div className="flex w-full ml-12 mt-12">
                {/* Form Fields */}
                <div className="w-1/2 p-6 bg-white overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Ariza Maydonlari</h2>
                    {requiredFields.length > 0 ? (
                        requiredFields.map(field => (
                            <div key={field.id} className="mb-4">
                                <label className="block text-sm font-medium mb-1">{field.text}</label>
                                {field.type === "datetime" || field.type === "date" ? (
                                    <input
                                        type="date"
                                        value={formValues[field.id] || ""}
                                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={formValues[field.id] || ""}
                                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                        placeholder={field.text}
                                    />
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">Iltimos, element tanlang.</p>
                    )}
                </div>

                {/* Document Preview */}
                <div className="w-1/2 p-6 bg-gray-50 overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Hujjat Ko'rinishi</h2>
                    <div className="bg-white p-4 border border-gray-300 rounded shadow">
                        <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={handleDownload}
                            disabled={uploading || !userId}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2
                ${uploading || !userId
                                    ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                        >
                            {uploading ? (
                                <>Yuklanmoqda...</>
                            ) : (
                                <>
                                    <FileTextOutlined />
                                    PDF yuklash va saqlash
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ApplicationFormPage