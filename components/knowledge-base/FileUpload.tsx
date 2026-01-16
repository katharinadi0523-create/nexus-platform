"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  value?: File[];
  onChange?: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  className?: string;
}

export function FileUpload({
  value = [],
  onChange,
  accept = ".doc,.docx,.pdf,.txt",
  maxFiles = 20,
  maxSize = 200,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];

    fileArray.forEach((file) => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`文件 ${file.name} 超过 ${maxSize}MB 限制`);
        return;
      }

      // Check file count
      if (value.length + validFiles.length >= maxFiles) {
        alert(`最多只能上传 ${maxFiles} 个文件`);
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      onChange?.([...value, ...validFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange?.(newFiles);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <Upload className="mb-4 h-12 w-12 text-slate-400" />
        <p className="mb-2 text-sm font-medium text-slate-700">
          将文件拖拽到此处或点击上传
        </p>
        <p className="text-xs text-slate-500">
          支持上传 {accept.replace(/\./g, "").replace(/,/g, "、")} 文件；单次至多上传{" "}
          {maxFiles} 个文件；每个文件不超过 {maxSize}MB
        </p>
      </div>

      {/* File List */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3"
            >
              <div className="flex-1 truncate">
                <p className="text-sm text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
