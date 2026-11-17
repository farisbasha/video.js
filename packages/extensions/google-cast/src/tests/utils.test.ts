import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { getPlaylistSegmentFormat } from '../utils';

/** Serve `playlists` by URL, as a CDN would. */
function servePlaylists(playlists: Record<string, string>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string | URL) => new Response(playlists[String(url)] ?? '', { status: 200 }))
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getPlaylistSegmentFormat', () => {
  it("reads the segment format from a multivariant playlist's first variant", async () => {
    servePlaylists({
      'https://example.com/main.m3u8': [
        '#EXTM3U',
        '#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",URI="subs/en.m3u8"',
        '#EXT-X-STREAM-INF:BANDWIDTH=800000,SUBTITLES="subs"',
        'video/low.m3u8',
        '#EXT-X-STREAM-INF:BANDWIDTH=2000000',
        'video/high.m3u8',
      ].join('\n'),
      'https://example.com/video/low.m3u8': ['#EXTM3U', '#EXT-X-MAP:URI="init.mp4"', '#EXTINF:4,', 'seg0.m4s'].join(
        '\n'
      ),
    });

    expect(await getPlaylistSegmentFormat('https://example.com/main.m3u8')).toBe('m4s');
  });

  it('reads the segment format from a media playlist, ignoring query strings and CRLF line endings', async () => {
    servePlaylists({
      'https://example.com/media.m3u8': ['#EXTM3U', '#EXTINF:4,', 'seg0.ts?token=abc', ''].join('\r\n'),
    });

    expect(await getPlaylistSegmentFormat('https://example.com/media.m3u8')).toBe('ts');
  });
});
