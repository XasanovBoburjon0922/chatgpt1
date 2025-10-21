"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import axios from "axios";

const API_BASE_URL = "https://imzo-ai.uzjoylar.uz";

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showLangModal, setShowLangModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState("uz");

  // localStorage dan tilni olish
  useEffect(() => {
    const savedLang = localStorage.getItem("i18nextLng") || "uz";
    setSelectedLang(savedLang);
    i18n.changeLanguage(savedLang);
  }, [i18n]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user) {
      setFullName(user.full_name || "");
      setPhoneNumber(user.phone_number || "");
    }
  }, [user, isAuthenticated, navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
    setSelectedLang(lng);
    setShowLangModal(false);
    toast.success(t("languageChanged"), { theme: "dark", position: "top-center" });
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error(t("nameRequired"), { theme: "dark" });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const userId = localStorage.getItem("user_id");

      await axios.post(
        `${API_BASE_URL}/users/update?id=${userId}`,
        {
          full_name: fullName,
          phone_number: phoneNumber,
        },
        {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      login({ ...user, full_name: fullName, phone_number: phoneNumber }, token);
      localStorage.setItem("full_name", fullName);

      toast.success(t("save"), { theme: "dark" });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t("nameUpdateError"), { theme: "dark" });
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const getLangText = () => {
    return selectedLang === "uz" ? "O'zbekcha" : "Русский";
  };

// === MOBILE VIEW (rasmdagi kabi) ===
if (isMobile) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white transition flex items-center gap-2"
          >
            <span className="text-xl">&lt;</span>
            <span className="text-sm">Orqaga</span>
          </button>
          <h1 className="text-xl font-bold">Profil</h1>
          <div className="w-8" /> {/* Spacer for alignment */}
        </div>
  
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          {/* Account Section */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-700 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm text-gray-400">Ism</p>
                </div>
              </div>
              <span className="text-blue-400 text-bold text-[22px]">{fullName}</span>
            </div>
  
            {/* Edit Name Input (only in edit mode) */}
            {isEditing && (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-3 bg-gray-800 text-white rounded-lg px-3 py-2 w-full text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ismingizni kiriting"
              />
            )}
          </div>
  
          {/* App Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 mb-2">App</h3>
  
            {/* Language */}
            <div
              className="bg-[#1a1a1a] rounded-lg p-4 flex justify-between items-center cursor-pointer"
              onClick={() => setShowLangModal(true)}
            >
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-600 rounded mr-3"></div>
                <span>Til</span>
              </div>
              <span className="text-gray-400">{getLangText()} &gt;</span>
            </div>
  
            {/* Appearance */}
            <div className="bg-[#1a1a1a] rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-600 rounded mr-3"></div>
                <span>Appearance</span>
              </div>
              <span className="text-gray-400">Dark Mode</span>
            </div>
          </div>
  
          {/* Edit / Save Buttons */}
          {isEditing ? (
            <div className="mt-6 flex gap-3">
              <button
                onClick={toggleEdit}
                className="flex-1 bg-gray-700 text-gray-300 py-3 rounded-xl font-medium"
                disabled={loading}
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-white text-black py-3 rounded-xl font-medium"
                disabled={loading}
              >
                {loading ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          ) : (
            <button
              onClick={toggleEdit}
              className="mt-6 w-full bg-white text-black py-3 rounded-xl font-medium"
            >
              Tahrirlash
            </button>
          )}
        </div>
  
        {/* Language Modal */}
        {showLangModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-xs">
              <h3 className="text-lg font-bold mb-4 text-center">Tilni tanlang</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleLanguageChange("uz")}
                  className={`w-full py-3 rounded-xl font-medium transition ${
                    selectedLang === "uz"
                      ? "bg-white text-black"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  O'zbekcha
                </button>
                <button
                  onClick={() => handleLanguageChange("ru")}
                  className={`w-full py-3 rounded-xl font-medium transition ${
                    selectedLang === "ru"
                      ? "bg-white text-black"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  Русский
                </button>
              </div>
              <button
                onClick={() => setShowLangModal(false)}
                className="mt-4 w-full bg-gray-700 text-gray-300 py-3 rounded-xl font-medium"
              >
                Yopish
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // === DESKTOP VIEW (Zamonaviy) ===
  return (
    <div className="min-h-screen bg-black text-white flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 shadow-2xl border border-gray-800">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Profil Sozlamalari</h1>
            <button
              onClick={() => navigate("/")}
              className="text-gray-400 hover:text-white transition"
            >
              &gt; Orqaga
            </button>
          </div>

          {/* Profile Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold">
                {fullName.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400">Foydalanuvchi nomi</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-gray-700 text-white rounded-xl px-4 py-2 w-full mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ismingizni kiriting"
                  />
                ) : (
                  <h2 className="text-2xl font-semibold">{fullName || "Foydalanuvchi"}</h2>
                )}
                <p className="text-gray-400 mt-1">{phoneNumber || "+998 XX XXX XX XX"}</p>
              </div>
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Language */}
            <div
              className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 cursor-pointer hover:bg-gray-800/70 transition"
              onClick={() => setShowLangModal(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <span className="text-blue-400">Globe</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Til</p>
                    <p className="font-medium">{getLangText()}</p>
                  </div>
                </div>
                <span className="text-gray-500">&gt;</span>
              </div>
            </div>

            {/* Theme */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <span className="text-purple-400">Moon</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Mavzu</p>
                    <p className="font-medium">Qorong'i rejim</p>
                  </div>
                </div>
                <span className="text-gray-500">&gt;</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {isEditing ? (
              <>
                <button
                  onClick={toggleEdit}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition"
                  disabled={loading}
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium transition hover:from-blue-600 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </>
            ) : (
              <button
                onClick={toggleEdit}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium transition hover:from-blue-600 hover:to-purple-700"
              >
                Tahrirlash
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Language Modal */}
      {showLangModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-8">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700">
            <h3 className="text-2xl font-bold mb-6 text-center">Tilni tanlang</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleLanguageChange("uz")}
                className={`py-4 rounded-xl font-medium text-lg transition ${
                  selectedLang === "uz"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                O'zbekcha
              </button>
              <button
                onClick={() => handleLanguageChange("ru")}
                className={`py-4 rounded-xl font-medium text-lg transition ${
                  selectedLang === "ru"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                Русский
              </button>
            </div>
            <button
              onClick={() => setShowLangModal(false)}
              className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}