"use client"

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CategorySidebar = ({ onCategorySelect, className = "" }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const navigate = useNavigate();
  const hasFetched = useRef(false); // Track if categories have been fetched

  // Fetch categories from API
  const fetchCategories = async () => {
    if (hasFetched.current) return; // Skip if already fetched
    setLoading(true);
    try {
      const response = await axios.get("https://imzo-ai.uzjoylar.uz/pdf-category/list");
      setCategories(response.data);
      hasFetched.current = true; // Mark as fetched
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleItemClick = (categoryId, itemId) => {
    const key = `${categoryId}-item-${itemId}`;
    setSelectedKeys([key]);
    onCategorySelect?.(categoryId, itemId);
    navigate(`/document?pdfCategoryID=${itemId}`);
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`h-full ${className}`}>
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center text-white">
          <svg
            className="w-5 h-5 mr-3 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <span className="font-semibold">Kategoriyalar</span>
        </div>
      </div>

      <div className="h-full overflow-y-auto p-4">
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="bg-gray-800/50 rounded-lg border border-gray-700">
              <button
                onClick={() => handleCategoryClick(category.id)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700/50 transition-colors duration-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z"
                    />
                  </svg>
                  <span className="text-gray-200 hover:text-white font-medium">
                    {category.name}
                  </span>
                  {category.items.length > 0 && (
                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">
                      {category.items.length}
                    </span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${
                    expandedCategories.includes(category.id) ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {expandedCategories.includes(category.id) && (
                <div className="pb-2 px-3">
                  {category.items.length > 0 ? (
                    <div className="space-y-1">
                      {category.items.map((item) => {
                        const itemKey = `${category.id}-item-${item.id}`;
                        const isSelected = selectedKeys.includes(itemKey);

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleItemClick(category.id, item.id)}
                            className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-all duration-200 ${
                              isSelected
                                ? "bg-blue-600/20 border border-blue-600/30 text-blue-300"
                                : "hover:bg-gray-700/30 text-gray-300 hover:text-white"
                            }`}
                          >
                            <svg
                              className="w-4 h-4 text-green-400"
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
                            <span className="text-sm font-medium truncate">
                              {item.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center">
                      <p className="text-gray-500 text-sm">Bo'sh kategoriya</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {categories.length === 0 && !loading && (
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 mx-auto text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z"
              />
            </svg>
            <p className="text-gray-500 text-sm">Kategoriyalar topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { CategorySidebar };
export default CategorySidebar;