/**
 * Parses an SVG file into a tree of elements with a strict XML parser
 * (saxes): malformed markup, DTDs, CDATA and text content fail instead of
 * being guessed at.
 */

import { SaxesParser } from 'saxes';

export interface SvgElement {
  readonly name: string;
  /** Attributes in source order. */
  readonly attributes: ReadonlyMap<string, string>;
  readonly children: readonly SvgElement[];
}

export class SvgSyntaxError extends Error {
  override name = 'SvgSyntaxError';
}

export function parseSvg(source: string): SvgElement {
  const parser = new SaxesParser({ xmlns: false, position: true });
  const stack: {
    name: string;
    attributes: Map<string, string>;
    children: SvgElement[];
  }[] = [];
  let root: SvgElement | undefined;
  const fail = (message: string): never => {
    throw new SvgSyntaxError(`${message} (line ${parser.line})`);
  };
  parser.on('error', (error) => fail(error.message));
  parser.on('doctype', () => fail('a DOCTYPE is not supported'));
  parser.on('cdata', () => fail('CDATA is not supported'));
  parser.on('processinginstruction', (instruction) => {
    if (instruction.target !== 'xml')
      fail(`<?${instruction.target}?> is not supported`);
  });
  parser.on('text', (text) => {
    // Only metadata elements hold text; the normalizer drops them.
    const parent = stack.at(-1)?.name;
    if (parent === 'title' || parent === 'desc' || parent === 'metadata')
      return;
    if (text.trim() !== '')
      fail(`text content "${text.trim().slice(0, 40)}" is not supported`);
  });
  parser.on('opentag', (tag) => {
    if (root !== undefined) fail('content after the root element');
    stack.push({
      name: tag.name,
      attributes: new Map(
        Object.entries(tag.attributes as Record<string, string>),
      ),
      children: [],
    });
  });
  parser.on('closetag', () => {
    const element = stack.pop()!;
    const parent = stack.at(-1);
    if (parent === undefined) root = element;
    else parent.children.push(element);
  });
  parser.write(source).close();
  if (root === undefined) fail('no root element');
  return root!;
}
