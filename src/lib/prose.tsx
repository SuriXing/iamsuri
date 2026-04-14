import { Fragment, type ReactElement } from 'react';

/**
 * Tiny markdown-ish renderer for P1.7 detail bodies.
 *
 * Supports only what the canonical content actually uses:
 *   - `## h2` and `### h3` headings (line-prefixed)
 *   - paragraphs separated by blank lines (`\n\n`)
 *   - inline `code` via single backticks
 *
 * NOT a full markdown parser. The body strings in src/data/*.ts are
 * authored by hand, so the surface is small and deterministic.
 */

interface ProseProps {
  body: string;
  className?: string;
}

export function Prose({ body, className }: ProseProps): ReactElement {
  // Split into blocks on blank lines; each block becomes one element.
  const blocks = body.split(/\n\n+/);

  return (
    <div className={className}>
      {blocks.map((rawBlock, i) => {
        const block = rawBlock.trim();
        if (block.length === 0) return null;

        if (block.startsWith('### ')) {
          return <h3 key={i}>{renderInline(block.slice(4))}</h3>;
        }
        if (block.startsWith('## ')) {
          return <h2 key={i}>{renderInline(block.slice(3))}</h2>;
        }

        return <p key={i}>{renderInline(block)}</p>;
      })}
    </div>
  );
}

/**
 * Render inline `code` runs. Single-pass split on backticks; even
 * indices = plain text, odd indices = code. No escaping needed for the
 * portfolio content surface.
 */
function renderInline(text: string): ReactElement {
  const parts = text.split('`');
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code key={i}>{part}</code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
