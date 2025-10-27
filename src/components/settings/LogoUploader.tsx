"use client";

/**
 * LOGO UPLOADER
 *
 * Upload and manage school logo with Juno storage.
 * Supports drag-and-drop, file preview, and URL fallback.
 */

import React, { useState, useRef } from "react";
import { uploadFile, deleteAsset } from "@junobuild/core";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface LogoUploaderProps {
  currentLogoUrl?: string;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
}

export function LogoUploader({
  currentLogoUrl,
  onUploadComplete,
  onRemove,
}: LogoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection
   */
  const handleFileSelect = async (file: File) => {
    // Validate file
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, SVG)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      // 2MB limit
      setError("File size must be less than 2MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Upload to Juno
      const result = await uploadFile({
        collection: "school_assets",
        data: file,
        filename: `logo-${Date.now()}.${file.name.split(".").pop()}`,
      });

      // Get the download URL
      const downloadUrl = result.downloadUrl;

      if (!downloadUrl) {
        throw new Error("Failed to get download URL");
      }

      // Update config with new logo URL
      onUploadComplete(downloadUrl);

      setPreview(downloadUrl);
    } catch (err) {
      console.error("Error uploading logo:", err);
      setError("Failed to upload logo. Please try again.");
      setPreview(currentLogoUrl || null);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handle drag events
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  /**
   * Handle drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle file input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle remove logo
   */
  const handleRemove = () => {
    setPreview(null);
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
            : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {preview ? (
          /* Preview Area */
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={preview}
                alt="Logo preview"
                className="h-20 w-20 rounded object-contain bg-white p-2"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Logo uploaded
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentLogoUrl ? "Saved in cloud storage" : "Not saved yet"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          /* Upload Instructions */
          <div className="text-center">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Uploading logo...
                </p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Drop your logo here, or{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    browse
                  </button>
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG or SVG up to 2MB
                </p>
              </>
            )}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleInputChange}
          disabled={uploading}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tips */}
      <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        <p className="font-medium">💡 Tips for best results:</p>
        <ul className="mt-1 list-inside list-disc space-y-1">
          <li>Use transparent background (PNG) for best appearance</li>
          <li>Recommended size: 200x200 pixels or larger</li>
          <li>Square or horizontal logos work best</li>
        </ul>
      </div>
    </div>
  );
}
