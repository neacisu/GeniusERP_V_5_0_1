import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List } from 'lucide-react';

interface TextEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
}

/**
 * Text Editor Component
 * 
 * A simple rich text editor component for the document editor
 */
const TextEditor: React.FC<TextEditorProps> = ({ 
  initialContent = '', 
  onChange 
}) => {
  const [content, setContent] = useState(initialContent);
  
  // Update content and notify parent component
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (onChange) {
      onChange(newContent);
    }
  };
  
  // Simulate formatting actions
  const handleFormat = (format: string) => {
    // In a real implementation, this would apply the formatting
    console.log(`Applying ${format} formatting`);
  };
  
  return (
    <Card className="border rounded-md overflow-hidden">
      <div className="bg-muted p-2 flex flex-wrap gap-1 border-b">
        <Button variant="ghost" size="sm" onClick={() => handleFormat('bold')}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleFormat('italic')}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleFormat('underline')}>
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1 self-center" />
        <Button variant="ghost" size="sm" onClick={() => handleFormat('align-left')}>
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleFormat('align-center')}>
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleFormat('align-right')}>
          <AlignRight className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1 self-center" />
        <Button variant="ghost" size="sm" onClick={() => handleFormat('list')}>
          <List className="h-4 w-4" />
        </Button>
      </div>
      <CardContent className="p-0 min-h-[400px]">
        <textarea
          className="w-full h-full min-h-[400px] p-4 border-0 resize-none focus:outline-none"
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Începeți să scrieți conținutul documentului..."
        />
      </CardContent>
    </Card>
  );
};

export default TextEditor;