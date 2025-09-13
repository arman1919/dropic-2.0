import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Album from '@/models/Album';

// GET /api/albums/:albumId/public — публичные данные альбома без авторизации
export async function GET(
  _req: NextRequest,
  { params }: { params: any },
) {
  try {
    const { albumId } = params;
    await connectDB();

    const album = await Album.findOne({ albumId }).lean();
    if (!album) {
      return NextResponse.json({ message: 'Album not found' }, { status: 404 });
    }

    const images = (album.photos || []).map(
      ({ photoId, url, description, date, description_hidden, date_hidden }: any) => ({
        photoId,
        url,
        description,
        date,
        description_hidden,
        date_hidden,
      }),
    );

    return NextResponse.json({
      albumTitle: album.title,
      description: album.description,
      images,
      options: album.options || {},
    });
  } catch (err: any) {
    console.error('Public album GET error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
