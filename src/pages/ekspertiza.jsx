"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const Ekspertiza = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [question, setQuestion] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [analysisId, setAnalysisId] = useState(null) // Store analysis ID for polling

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (selectedFile && allowedTypes.includes(selectedFile.type)) {
      setFile(selectedFile)
      setError("")
    } else {
      setFile(null)
      setError("Please select a PDF, TXT, DOC, or DOCX file.")
    }
  }

  const fetchAnalysisResult = async (id) => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token) {
        setError("No token found, please log in.")
        setIsLoading(false)
        return false
      }

      const response = await fetch(`https://imzo-ai.uzjoylar.uz/get/pdf/analysis/${id}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError("Unauthorized access. Please log in again.")
          setIsLoading(false)
          return false
        }
        return false // Return false to indicate non-200 status
      }

      const data = await response.json()
      setResult(data.responce)
      setShowResult(true)
      setIsLoading(false)
      return true // Return true to indicate 200 status
    } catch (err) {
      setError(err.message || "An error occurred while fetching the result.")
      setIsLoading(false)
      return false
    }
  }

  // Polling function to repeatedly check for analysis result every 13 seconds
  const startPolling = (id) => {
    const poll = async () => {
      const success = await fetchAnalysisResult(id)
      if (!success) {
        // If status is not 200, schedule next poll after 13 seconds
        setTimeout(() => poll(), 13000)
      }
    }
    poll() // Start polling immediately
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !question) {
      setError("Please upload a file and provide a question.")
      return
    }

    setIsLoading(true)
    setError("")
    setShowResult(false)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("question", question)

    try {
      const token = localStorage.getItem("access_token")
      if (!token) {
        setError("No token found, please log in.")
        setIsLoading(false)
        return
      }

      const response = await fetch("https://imzo-ai.uzjoylar.uz/get/pdf/analysis", {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError("Unauthorized access. Please log in again.")
          setIsLoading(false)
          return
        }
        throw new Error("Failed to submit the file and question.")
      }

      const result = await response.json()
      if (result.id) {
        setAnalysisId(result.id) // Store analysis ID
        startPolling(result.id) // Start polling for the result
      } else {
        setError("No analysis ID received from server.")
        setIsLoading(false)
      }
    } catch (err) {
      setError(err.message || "An error occurred while submitting.")
      setIsLoading(false)
    }
  }

  // Cleanup polling on component unmount or new analysis
  useEffect(() => {
    return () => {
      // Cleanup logic if needed (e.g., clear timeouts)
    }
  }, [])

  const handleNewAnalysis = () => {
    setFile(null)
    setQuestion("")
    setResult("")
    setShowResult(false)
    setError("")
    setAnalysisId(null) // Reset analysis ID
    document.getElementById("file-upload").value = null // Reset file input
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 mr-4 group"
          >
            <svg
              className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Document Analysis
          </h1>
        </div>

        <div className="max-w-4xl mx-auto">
          {!showResult ? (
            /* Upload Form */
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload & Analyze Document</h2>
                <p className="text-gray-600">Upload your document and ask any question about its content</p>
              </div>

              <div className="space-y-6">
                {/* File Upload */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Select Document
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.txt,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      <svg
                        className="w-8 h-8 text-gray-400 group-hover:text-gray-600 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="text-sm text-gray-600 group-hover:text-gray-800">
                        {file ? file.name : "Click to upload PDF, TXT, DOC, or DOCX"}
                      </span>
                    </label>
                  </div>
                  {file && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium">{file.name} selected</span>
                    </div>
                  )}
                </div>

                {/* Question Input */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Your Question
                  </label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What would you like to know about this document?"
                    className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white/50 backdrop-blur-sm"
                    rows="4"
                  />
                </div>

                {error && (
                  <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 18.333 3.924 20 5.464 20z"
                      />
                    </svg>
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !file || !question}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
                    isLoading || !file || !question
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.113 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Analyzing Document...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span>Analyze Document</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Results Display */
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Analysis Complete</h2>
                    <p className="text-gray-600 text-sm">Here's what I found in your document</p>
                  </div>
                </div>
                <button
                  onClick={handleNewAnalysis}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-medium">New Analysis</span>
                </button>
              </div>

              {/* Question Display */}
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Your Question:</h3>
                <p className="text-blue-700">{question}</p>
              </div>

              {/* Result Display */}
              <div className="prose max-w-none">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Analysis Result:
                  </h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{result}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Ekspertiza