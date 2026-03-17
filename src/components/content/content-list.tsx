'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  Filter,
  Grid3X3,
  List,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { ContentCard } from './content-card';
import { ContentUpload } from './content-upload';
import { useSessionContent, useContentStats } from '@/hooks/content';
import { Content, ContentType, ContentListParams } from '@/types/content';

interface ContentListProps {
  sessionId: string;
  className?: string;
  readOnly?: boolean; // Control whether users can upload/edit content
}

export function ContentList({
  sessionId,
  className = '',
  readOnly = true,
}: ContentListProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const limit = 12; // Items per page

  // Build query parameters
  const queryParams: ContentListParams = {
    page: currentPage,
    limit,
    ...(selectedType !== 'ALL' && { type: selectedType as ContentType }),
  };

  const {
    data: contentData,
    isLoading,
    isError,
    error,
    refetch,
  } = useSessionContent(sessionId, queryParams);

  const stats = useContentStats(sessionId);

  // Filter content by search term (client-side filtering)
  const filteredContent =
    contentData?.content.filter((content) =>
      content.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleUploadSuccess = () => {
    refetch();
  };

  const handleEditContent = (content: Content) => {
    // TODO: Implement edit functionality
    console.log('Edit content:', content);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (!contentData?.pagination || contentData.pagination.pages <= 1) {
      return null;
    }

    const { page, pages } = contentData.pagination;

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          Page {page} of {pages}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  const renderContentGrid = () => {
    if (filteredContent.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-semibold mb-2">No content found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedType !== 'ALL'
              ? 'Try adjusting your filters or search term.'
              : readOnly
                ? 'No content available yet.'
                : 'Upload some content to get started.'}
          </p>
          {!readOnly && (
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Content
            </Button>
          )}
        </div>
      );
    }

    const gridClass =
      viewMode === 'grid'
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'
        : 'space-y-4';

    return (
      <div className={gridClass}>
        {filteredContent.map((content) => (
          <ContentCard
            key={content.id}
            content={content}
            onEdit={handleEditContent}
            className={viewMode === 'list' ? 'flex-row' : ''}
            readOnly={readOnly}
          />
        ))}
      </div>
    );
  };

  const renderLoadingSkeleton = () => {
    const skeletonCount = viewMode === 'grid' ? 6 : 3;
    const gridClass =
      viewMode === 'grid'
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'
        : 'space-y-4';

    return (
      <div className={gridClass}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Content</h2>
          <p className="text-muted-foreground">
            {readOnly
              ? 'View and download session content'
              : 'Manage and share files with session participants'}
          </p>
        </div>
        {!readOnly && (
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Content
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.byType.IMAGE}</div>
          <div className="text-sm text-muted-foreground">Images</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.byType.VIDEO}</div>
          <div className="text-sm text-muted-foreground">Videos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.byType.PDF}</div>
          <div className="text-sm text-muted-foreground">PDFs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.byType.TEXT}</div>
          <div className="text-sm text-muted-foreground">Documents</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Select
            value={selectedType}
            onValueChange={(value) =>
              setSelectedType(value as ContentType | 'ALL')
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="IMAGE">Images</SelectItem>
              <SelectItem value="VIDEO">Videos</SelectItem>
              <SelectItem value="PDF">PDFs</SelectItem>
              <SelectItem value="TEXT">Documents</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {(searchTerm || selectedType !== 'ALL') && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchTerm}
              <button
                onClick={() => setSearchTerm('')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {selectedType !== 'ALL' && (
            <Badge variant="secondary" className="gap-1">
              Type: {selectedType}
              <button
                onClick={() => setSelectedType('ALL')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Content */}
      {isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load content. {error?.message || 'Please try again.'}
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        renderLoadingSkeleton()
      ) : (
        <>
          {renderContentGrid()}
          {renderPagination()}
        </>
      )}

      {/* Upload Modal - Only show in non-read-only mode */}
      {!readOnly && (
        <ContentUpload
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          sessionId={sessionId}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
