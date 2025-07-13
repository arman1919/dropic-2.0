import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

import Album from '@/models/Album';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    await connectDB();

    const albums = await Album.find({ userId }).lean();
    const formatted = albums.map((album: any) => ({
      _id: album._id,
      albumId: album.albumId,
      title: album.title,
      createdAt: album.createdAt,
      photoCount: album.photos?.length || 0,
      deleteToken: album.deleteToken,
    }));

    return NextResponse.json({ albums: formatted });
  } catch (err: any) {
    console.error('Albums GET error:', err);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const body = await req.json();
    const { title = 'Untitled Album' } = body || {};

    await connectDB();
    const newAlbum = new Album({
      albumId: uuidv4(),
      userId,
      title,
      deleteToken: uuidv4(),
      photos: [],
    });
    await newAlbum.save();

    return NextResponse.json(
      { albumId: newAlbum.albumId, deleteToken: newAlbum.deleteToken },
      { status: 201 },
    );
  } catch (err: any) {
    console.error('Albums POST error:', err);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
