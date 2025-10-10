'use client';

import React, { useState } from 'react';

type Props = {
  onImageUploaded: (cid: string, url: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
};

export default function ImageUpload({ onImageUploaded, onUploadError, className }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/pinata/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Upload failed');
      onImageUploaded(json.cid, json.url);
    } catch (err: any) {
      onUploadError?.(err?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={className}>
      <label className="block">
        <span className="sr-only">Choose image</span>
        <input type="file" accept="image/*" onChange={handleChange} className="file-input file-input-bordered w-full" />
      </label>
      {isUploading && <div className="text-sm mt-2">Uploading...</div>}
      {preview && (
        <div className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="rounded-xl max-h-48 object-cover" />
        </div>
      )}
    </div>
  );
}


