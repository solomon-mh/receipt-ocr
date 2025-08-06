"use client";

import { useState } from "react";
import { uploadReceipt } from "../utils/graphql-client";

interface ReceiptItem {
  id: number;
  name: string;
  quantity: number;
}

interface Receipt {
  storeName: string;
  purchaseDate: string;
  totalAmount: number;
  items: ReceiptItem[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setReceipt(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await uploadReceipt(file);
      if (result?.uploadReceipt?.success) {
        setReceipt(result.uploadReceipt.receipt);
        setError(null);
      } else {
        setError(result.uploadReceipt?.message || "Extraction failed.");
        setReceipt(null);
      }
    } catch (error) {
      console.log(error);

      setError("Something went wrong.");
      setReceipt(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Animated Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-indigo-900 mb-2 animate-gradient bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Shewaber
          </h1>
          <p className="text-indigo-600 opacity-80">Smart Receipt Processing</p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <span className="mr-2">🧾</span> Receipt OCR Upload
            </h2>
            <p className="text-gray-500 mt-2">
              Upload an image of your receipt to extract purchase details
            </p>

            <div className="mt-6 space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-8 h-8 mb-3 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    ></path>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    {file ? file.name : "PNG, JPG (MAX. 5MB)"}
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                  !file || loading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Upload & Process"
                )}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-start">
                  <svg
                    className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          {receipt && (
            <div className="border-t border-gray-100 bg-indigo-50/50 p-6 sm:p-8 transition-all duration-500 animate-fade-in">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
                <span className="mr-2">🛒</span> Parsed Receipt Data
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">Store</p>
                  <p className="font-medium text-indigo-700">
                    {receipt.storeName}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-indigo-700">
                    {new Date(
                      Number(receipt.purchaseDate)
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-bold text-xl text-indigo-700">
                    ${receipt.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    ></path>
                  </svg>
                  Purchased Items
                </h4>
                <ul className="space-y-2">
                  {receipt.items.map(
                    (item: { id: number; name: string; quantity: number }) => (
                      <li
                        key={item.id}
                        className="bg-white p-3 rounded-lg shadow-xs hover:shadow-sm transition-shadow duration-200 flex justify-between"
                      >
                        <span className="text-gray-700">{item.name}</span>
                        {item.quantity ? (
                          <span className="text-indigo-600 font-medium">
                            x{item.quantity}
                          </span>
                        ) : null}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
