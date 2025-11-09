import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  // Helper to process inline formatting like **bold**
  const processInline = (text: string, key: React.Key) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <React.Fragment key={key}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </React.Fragment>
    );
  };

  // 1. Split content into blocks separated by one or more empty lines
  const blocks = content.split(/\n\s*\n/);

  const renderedBlocks = blocks.map((block, blockIndex) => {
    const lines = block.split('\n');
    const isList = lines.length > 0 && lines.every(line => line.trim().startsWith('* '));

    // 2. If all lines in a block start with '* ', render it as a list
    if (isList) {
      return (
        <ul key={blockIndex} className="list-disc list-inside space-y-1 my-2">
          {lines.map((line, lineIndex) => (
            <li key={lineIndex}>
              {processInline(line.trim().substring(2), `${blockIndex}-${lineIndex}`)}
            </li>
          ))}
        </ul>
      );
    }

    // 3. Otherwise, render the block as a paragraph
    //    We join lines with <br /> to preserve soft line breaks within a paragraph
    return (
      <p key={blockIndex} className="my-1">
        {lines.map((line, lineIndex) => (
          <React.Fragment key={lineIndex}>
            {processInline(line, `${blockIndex}-${lineIndex}`)}
            {lineIndex < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  });

  return <div className={className}>{renderedBlocks}</div>;
};

export default MarkdownRenderer;