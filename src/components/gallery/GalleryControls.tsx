'use client';

import React from 'react';

interface Props {
  imagesCount: number;
  selectMode: boolean;
  selectedCount: number;
  toggleSelectMode: () => void;
  selectAllImages: () => void;
  deleteSelectedImages: () => void;
}

const GalleryControls: React.FC<Props> = ({
  imagesCount,
  selectMode,
  selectedCount,
  toggleSelectMode,
  selectAllImages,
  deleteSelectedImages,
}) => {
  if (imagesCount === 0) return null;

  return (
    <div className="gallery-controls">
      <button onClick={toggleSelectMode} className="control-button mr-4">
        {selectMode ? 'Exit selection mode' : 'Select multiple'}
      </button>

      {selectMode && (
        <>
          <button onClick={selectAllImages} className="control-button mr-4">
            {selectedCount === imagesCount ? 'Deselect all' : 'Select all'}
          </button>
          <button
            onClick={deleteSelectedImages}
            className="delete-button"
            disabled={selectedCount === 0}
          >
            Delete selected ({selectedCount})
          </button>
        </>
      )}
    </div>
  );
};

export default GalleryControls;
