// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ReportActionSection } from './ReportActionSection';

const props = {
  url: 'https://example.com',
  hash: '9249232fefb9a1c0455ba007d7784f6c',
  shareImageUrl: 'https://example.com/share.png',
};

describe('ReportActionSection', () => {
  it.each([
    [0, 'Need help fixing your security headers?'],
    [79.99, 'Need help fixing your security headers?'],
    [80, 'Share Your Results'],
    [100, 'Share Your Results'],
  ])('selects the action at score %s', (score, heading) => {
    const html = renderToStaticMarkup(<ReportActionSection {...props} score={score} />);

    expect(html).toContain(heading);
  });

  it('does not render sharing controls just below the score boundary', () => {
    const html = renderToStaticMarkup(<ReportActionSection {...props} score={79.99} />);

    expect(html).not.toContain('Share on LinkedIn');
    expect(html).not.toContain('Share on Twitter');
    expect(html).not.toContain(props.shareImageUrl);
  });
});
