'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface PdfJsReaderProps {
  url: string;
  title: string;
}

const MIN_SCALE = 0.8;
const MAX_SCALE = 2.2;
const SCALE_STEP = 0.2;

export function PdfJsReader({ url, title }: PdfJsReaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1.2);

  const pdfDocRef = useRef<any>(null);
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const renderCycleRef = useRef(0);

  const pageIndexes = useMemo(
    () => Array.from({ length: pageCount }, (_, index) => index + 1),
    [pageCount],
  );

  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setPageCount(0);

      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        (pdfjs as any).GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();

        const loadingTask = (pdfjs as any).getDocument({
          url,
          withCredentials: false,
        });

        const pdfDoc = await loadingTask.promise;
        if (cancelled) {
          await pdfDoc.destroy();
          return;
        }

        pdfDocRef.current = pdfDoc;
        setPageCount(pdfDoc.numPages || 0);
      } catch (error: any) {
        if (cancelled) return;
        setErrorMessage(error?.message || 'Unable to render this PDF.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      renderCycleRef.current += 1;

      if (pdfDocRef.current?.destroy) {
        pdfDocRef.current.destroy();
      }
      pdfDocRef.current = null;
      canvasRefs.current = [];
    };
  }, [url]);

  useEffect(() => {
    const pdfDoc = pdfDocRef.current;
    if (!pdfDoc || pageCount === 0) return;

    const renderCycle = ++renderCycleRef.current;
    let cancelled = false;

    const renderPages = async () => {
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        if (cancelled || renderCycle !== renderCycleRef.current) return;

        const canvas = canvasRefs.current[pageNumber - 1];
        if (!canvas) continue;

        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const pixelRatio = window.devicePixelRatio || 1;
        const context = canvas.getContext('2d');

        if (!context) continue;

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;
      }
    };

    renderPages().catch((error: any) => {
      if (cancelled || renderCycle !== renderCycleRef.current) return;
      setErrorMessage(error?.message || 'Unable to render this PDF.');
    });

    return () => {
      cancelled = true;
    };
  }, [pageCount, scale]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 px-2 pt-2">
        <p className="text-xs text-muted-foreground">
          {pageCount > 0 ? `${pageCount} page${pageCount === 1 ? '' : 's'}` : 'PDF preview'}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={scale <= MIN_SCALE}
            onClick={() => setScale(prev => Math.max(MIN_SCALE, Number((prev - SCALE_STEP).toFixed(2))))}
          >
            Zoom -
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={scale >= MAX_SCALE}
            onClick={() => setScale(prev => Math.min(MAX_SCALE, Number((prev + SCALE_STEP).toFixed(2))))}
          >
            Zoom +
          </Button>
        </div>
      </div>

      <div className="h-[560px] overflow-auto bg-muted/20 rounded-md border">
        {isLoading && (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Loading PDF...
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="space-y-2 p-3">
            <p className="text-xs text-destructive">{errorMessage}</p>
            <iframe src={url} title={`${title} PDF`} className="h-[500px] w-full rounded-md border" />
          </div>
        )}

        {!isLoading && !errorMessage && pageCount > 0 && (
          <div className="flex flex-col items-center gap-3 p-3">
            {pageIndexes.map((pageNumber, index) => (
              <canvas
                key={`${url}-page-${pageNumber}`}
                ref={element => {
                  canvasRefs.current[index] = element;
                }}
                className="max-w-full rounded-md border bg-white shadow-sm"
                aria-label={`${title} page ${pageNumber}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
