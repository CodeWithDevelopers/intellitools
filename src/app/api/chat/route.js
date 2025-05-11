import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI('AIzaSyADtAStrtrP9OseGxvuwTWxyL8qevJZjaI');

// Helper function to sanitize and format text
const formatText = (text) => {
  return text
    .replace(/\n+/g, '\n')
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/^[-*]\s/gm, '\n• ')
    .replace(/^(\d+)\.\s/gm, '\n$1. ')
    .replace(/^(#{1,3})\s/gm, '\n$1 ')
    .trim();
};

// Format the chat history for context
const formatHistory = (messages) => {
  return messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));
};

export async function POST(request) {
  try {
    const { messages } = await request.json();
    
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid messages format');
    }

    const userMessage = messages[messages.length - 1].content;

    // Initialize model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
    });

    // Format previous messages for context
    const history = formatHistory(messages.slice(0, -1));

    // Start new chat session
    const chat = await model.startChat({
      history,
    });

    try {
      // Send message and get streaming response
      const result = await chat.sendMessageStream([{ text: userMessage }]);
      
      // Create stream for response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let buffer = '';
            let isFirstChunk = true;

            for await (const chunk of result.stream) {
              const text = chunk.text();
              
              // Add to buffer
              buffer += text;

              // Process buffer when we have complete sentences or paragraphs
              if (buffer.includes('.') || buffer.includes('\n')) {
                let formattedText = formatText(buffer);
                
                // Add spacing for first chunk
                if (isFirstChunk && formattedText) {
                  formattedText = '\n' + formattedText;
                  isFirstChunk = false;
                }

                if (formattedText) {
                  controller.enqueue(formattedText);
                  buffer = '';
                }
              }
            }

            // Send any remaining text in buffer
            if (buffer.trim()) {
              controller.enqueue(formatText(buffer));
            }

            controller.close();
          } catch (error) {
            console.error('Stream processing error:', error);
            controller.error(new Error('Failed to process response stream'));
          }
        }
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/plain',
          'Transfer-Encoding': 'chunked',
        },
      });

    } catch (chatError) {
      console.error('Chat error:', chatError);
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error.message 
      },
      { status: 400 }
    );
  }
}
