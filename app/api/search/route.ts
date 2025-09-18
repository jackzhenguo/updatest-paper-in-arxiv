import { NextRequest, NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';
import type { Paper } from '@/components/papers/types';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const keyword = body.keyword as string;
  const maxResults = Number(body.maxResults ?? body.max_results ?? 10);

  if (!keyword) {
    return NextResponse.json({ message: 'Keyword is required.' }, { status: 400 });
  }

  const query = `all:"${keyword}"`;
  const baseUrl = 'http://export.arxiv.org/api/query';
  const url = new URL(baseUrl);
  url.searchParams.set('search_query', query);
  url.searchParams.set('start', '0');
  url.searchParams.set('max_results', String(maxResults));
  url.searchParams.set('sortBy', 'submittedDate');
  url.searchParams.set('sortOrder', 'descending');

  try {
    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Failed to fetch arXiv data');
    }
    const data = await response.text();
    const parsed = await parseStringPromise(data, { explicitArray: true });

    const entries = Array.isArray(parsed?.feed?.entry) ? parsed.feed.entry : [];
    const papers: Paper[] = entries.map((entry: any) => {
      const title = entry.title?.[0] ?? 'Untitled';
      const link = entry.id?.[0] ?? '';
      const published = entry.published?.[0] ?? '';
      const summary = (entry.summary?.[0] ?? '').trim();
      const authors = Array.isArray(entry.author) ? entry.author : [];
      const firstAuthor = authors[0]?.name?.[0] ?? 'Unknown Author';
      const authorAffiliation = authors[0]?.affiliation?.[0] ?? 'No affiliation listed';
      const doiSegment = link.split('/').pop() ?? '';

      return {
        title,
        link,
        doi: doiSegment,
        published,
        summary,
        first_author: firstAuthor,
        author_affiliation: authorAffiliation,
        status: 'pending',
      } as Paper;
    });

    return NextResponse.json(papers);
  } catch (error) {
    console.error('Error fetching arXiv data:', error);
    return NextResponse.json(
      { message: 'Failed to fetch papers. Please try again later.' },
      { status: 500 },
    );
  }
}
