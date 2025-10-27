"use client";

/**
 * LOGO UPLOAD COMPONENT
 *
 * Handles logo file uploads with:
 * - Drag & drop support
 * - File type validation (PNG, JPG, SVG)
 * - Image preview
 * - Juno storage integration
 * - Optimistic updates
 */

import React, { useState, useRef, ChangeEvent, DragEvent } from "react";
import { uploadFile, deleteAsset } from "@junobuild/core";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface LogoUploadProps {
  currentLogo?: string;
  currentStorageKey?: string;
  onLogoChange: (logoUrl: string, storageKey?: string) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function LogoUpload({
  currentLogo,
  currentStorageKey,
  onLogoChange,
  disabled = false,
}: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentLogo);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only PNG, JPG, and SVG files are allowed";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 2MB";
    }
    return null;
  };

  const handleFileUpload = async (file: File) => {
    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setUploading(true);

      // Delete old logo if exists
      if (currentStorageKey) {
        try {
          await deleteAsset({
            collection: "logos",
            fullPath: currentStorageKey,
          });
        } catch (err) {
          console.warn("Could not delete old logo:", err);
        }
      }

      // Upload new logo to Juno storage
      const result = await uploadFile({
        collection: "logos",
        data: file,
        filename: `logo-${Date.now()}-${file.name}`,
      });

      // Get the download URL
      const logoUrl = result.downloadUrl;
      const storageKey = result.fullPath;

      // Update preview and notify parent
      setPreview(logoUrl);
      onLogoChange(logoUrl, storageKey);
    } catch (err) {
      console.error("Error uploading logo:", err);
      setError("Failed to upload logo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleRemoveLogo = async () => {
    if (!currentStorageKey) {
      setPreview(undefined);
      onLogoChange("");
      return;
    }

    try {
      setUploading(true);
      await deleteAsset({
        collection: "logos",
        fullPath: currentStorageKey,
      });
      setPreview(undefined);
      onLogoChange("");
    } catch (err) {
      console.error("Error removing logo:", err);
      setError("Failed to remove logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label>School Logo</Label>

      {/* Preview */}
      {preview && (
        <Card className="relative w-full max-w-xs p-4">
          <img
            src={preview}
            alt="School logo preview"
            className="h-32 w-full object-contain"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute right-2 top-2"
            onClick={handleRemoveLogo}
            disabled={uploading || disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </Card>
      )}

      {/* Upload Area */}
      <div
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileSelect}
          disabled={uploading || disabled}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-600">Uploading logo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="h-12 w-12 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Drop your logo here, or{" "}
                <span className="text-blue-600">browse</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, or SVG (max 2MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
