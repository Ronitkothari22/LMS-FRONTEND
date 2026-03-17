'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
} from 'lucide-react';
import { Content, getContentTypeIcon } from '@/types/content';
import { useDeleteContent, useDownloadContent } from '@/hooks/content';
import { toast } from 'sonner';

interface ContentCardProps {
  content: Content;
  onEdit?: (content: Content) => void;
  showActions?: boolean;
  className?: string;
  readOnly?: boolean; // New prop to control read-only mode
}

export function ContentCard({
  content,
  onEdit,
  showActions = true,
  className = '',
  readOnly = true, // Default to read-only for users
}: ContentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteContentMutation = useDeleteContent();
  const downloadContentMutation = useDownloadContent();

  const handleDownload = () => {
    downloadContentMutation.mutate(content);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(content);
    } else {
      toast.info('Edit functionality not implemented yet');
    }
  };

  const handleDelete = () => {
    deleteContentMutation.mutate(content.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        toast.success('Content deleted successfully');
      },
      onError: (error) => {
        console.error('Delete error:', error);
        toast.error('Failed to delete content');
      },
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IMAGE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'VIDEO':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'PDF':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'TEXT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <>
      <Card
        className={`hover:shadow-md transition-shadow duration-200 ${className}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{getContentTypeIcon(content.type)}</div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold truncate">
                  {content.title}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge
                    variant="secondary"
                    className={getTypeColor(content.type)}
                  >
                    {content.type}
                  </Badge>
                  {content.session && (
                    <span className="text-sm text-muted-foreground truncate">
                      {content.session.title}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  {!readOnly && (
                    <>
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Content Preview */}
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden relative">
              {content.type === 'IMAGE' ? (
                <Image
                  src={content.url}
                  alt={content.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove(
                      'hidden'
                    );
                  }}
                />
              ) : (
                <div className="text-4xl opacity-50">
                  {getContentTypeIcon(content.type)}
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(content.createdAt)}</span>
              </div>

              {content.canView && content.canView.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>{content.canView.length} viewer(s)</span>
                </div>
              )}

              {content.canEdit && content.canEdit.length > 0 && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{content.canEdit.length} editor(s)</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={downloadContentMutation.isPending}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog - Only show in non-read-only mode */}
      {!readOnly && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Content</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{content.title}&quot;?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteContentMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteContentMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
