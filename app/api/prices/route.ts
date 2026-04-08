import { NextResponse } from 'next/server';
import { fetchAllAssets } from '@/lib/data/ingestion';

export async function GET() {
  try {
    const data = await fetchAllAssets();
    return NextResponse.json({
      data,
      timestamp: new Date().toISOString(),
      integrity: 'verified' as const,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error fetching prices';
    console.error('Price API error:', message);
    return NextResponse.json(
      { error: message, fallback: true },
      { status: 503 }
    );
  }
}
