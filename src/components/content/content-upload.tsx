'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Video,
  FileIcon,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  validateContentFile,
  getContentTypeFromFile,
  formatFileSize,
  CONTENT_CONFIG,
} from '@/types/content';
import { useUploadContent } from '@/hooks/content';
import { toast } from 'sonner';

interface ContentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onUploadSuccess?: () => void;
}

export function ContentUpload({
  isOpen,
  onClose,
  sessionId,
  onUploadSuccess,
}: ContentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const uploadContentMutation = useUploadContent();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const validation = validateContentFile(file);

      if (!validation.isValid) {
        setValidationError(validation.error || 'Invalid file');
        setSelectedFile(null);
        return;
      }

      setValidationError(null);
      setSelectedFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove file extension
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': CONTENT_CONFIG.SUPPORTED_IMAGE_TYPES,
      'video/*': CONTENT_CONFIG.SUPPORTED_VIDEO_TYPES,
      'application/pdf': CONTENT_CONFIG.SUPPORTED_PDF_TYPES,
      'text/*': CONTENT_CONFIG.SUPPORTED_TEXT_TYPES,
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
    },
    maxSize: CONTENT_CONFIG.MAX_FILE_SIZE,
  });

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      toast.error('Please select a file and enter a title');
      return;
    }

    const contentType = getContentTypeFromFile(selectedFile);
    if (!contentType) {
      toast.error('Unsupported file type');
      return;
    }

    try {
      await uploadContentMutation.mutateAsync({
        file: selectedFile,
        title: title.trim(),
        sessionId,
        type: contentType,
      });

      // Reset form
      setSelectedFile(null);
      setTitle('');
      setUploadProgress(0);
      setValidationError(null);

      // Close dialog and notify parent
      onClose();
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      toast.success('Content uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload content');
    }
  };

  const handleClose = () => {
    if (!uploadContentMutation.isPending) {
      setSelectedFile(null);
      setTitle('');
      setUploadProgress(0);
      setValidationError(null);
      onClose();
    }
  };

  const getFileIcon = (file: File) => {
    const type = getContentTypeFromFile(file);
    switch (type) {
      case 'IMAGE':
        return <ImageIcon className="h-8 w-8 text-blue-500" />;
      case 'VIDEO':
        return <Video className="h-8 w-8 text-purple-500" />;
      case 'PDF':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'TEXT':
        return <FileText className="h-8 w-8 text-green-500" />;
      default:
        return <FileIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Content</DialogTitle>
          <DialogDescription>
            Upload files to share with session participants. Maximum file size:{' '}
            {formatFileSize(CONTENT_CONFIG.MAX_FILE_SIZE)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Drop Zone */}
          {!selectedFile && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? 'Drop the file here...'
                  : 'Drag & drop a file here, or click to select'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports images, videos, PDFs, and text documents
              </p>
            </div>
          )}

          {/* Selected File */}
          {selectedFile && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-3">
                {getFileIcon(selectedFile)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)} •{' '}
                    {getContentTypeFromFile(selectedFile)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setTitle('');
                    setValidationError(null);
                  }}
                  disabled={uploadContentMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Title Input */}
          {selectedFile && (
            <div className="space-y-2">
              <Label htmlFor="title">Content Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this content"
                disabled={uploadContentMutation.isPending}
              />
            </div>
          )}

          {/* Upload Progress */}
          {uploadContentMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploadContentMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={
              !selectedFile || !title.trim() || uploadContentMutation.isPending
            }
          >
            {uploadContentMutation.isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
