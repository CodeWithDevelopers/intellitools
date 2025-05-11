'use server';
import { NextResponse } from 'next/server';
import natural from 'natural';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

// Initialize Google AI with environment variable
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

// Add debug log
console.log('API Key configured:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);

// Helper function to clean text
const cleanText = (text) => {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\n\r]+/g, '. ')
    .replace(/[^\w\s.,!?]/g, '')
    .trim();
};

// Helper function to split text into sentences
const splitIntoSentences = (text) => {
  return text.match(/[^.!?]+[.!?]+/g) || [];
};

// Helper function to get word count
const getWordCount = (text) => {
  return text.trim().split(/\s+/).length;
};

// Helper function to get reading time in minutes
const getReadingTime = (wordCount) => {
  const wordsPerMinute = 200;
  return Math.ceil(wordCount / wordsPerMinute);
};

// Helper function to get sentence score
const getSentenceScore = (sentence, tfidf, docIndex) => {
  const words = tokenizer.tokenize(sentence.toLowerCase());
  return words.reduce((score, word) => {
    return score + (tfidf.tfidf(word, docIndex) || 0);
  }, 0) / words.length;
};

// Helper function to identify main topics
const getMainTopics = (text) => {
  const words = tokenizer.tokenize(text.toLowerCase());
  const wordFreq = {};

  words.forEach(word => {
    if (word.length > 3) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
};

// Function for extractive summarization
const generateExtractiveSummary = async (text, summaryLength = 0.3) => {
  try {
    const cleanedText = cleanText(text);
    const sentences = splitIntoSentences(cleanedText);

    if (sentences.length === 0) {
      return {
        topics: [],
        summary: "Text is too short or contains no complete sentences.",
        conclusion: "",
        analysis: {}
      };
    }

    const tfidf = new TfIdf();
    sentences.forEach(sentence => tfidf.addDocument(sentence));

    const scoredSentences = sentences.map((sentence, index) => ({
      sentence: sentence.trim(),
      score: getSentenceScore(sentence, tfidf, index),
      index
    }));

    const topics = getMainTopics(cleanedText);
    const numSentences = Math.max(3, Math.ceil(sentences.length * summaryLength));
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, numSentences)
      .sort((a, b) => a.index - b.index)
      .map(item => item.sentence);

    const lastSentence = sentences[sentences.length - 1];
    const conclusionMarkers = ['conclusion', 'finally', 'therefore', 'thus', 'in summary'];
    const hasConclusion = conclusionMarkers.some(marker =>
      lastSentence.toLowerCase().includes(marker)
    );

    return {
      topics,
      summary: topSentences.join(' '),
      conclusion: hasConclusion ? lastSentence : '',
      analysis: {
        originalWords: getWordCount(text),
        summaryWords: getWordCount(topSentences.join(' ')),
        originalChars: text.length,
        summaryChars: topSentences.join(' ').length,
        readingTime: getReadingTime(getWordCount(text)),
        summaryReadingTime: getReadingTime(getWordCount(topSentences.join(' ')))
      }
    };
  } catch (error) {
    console.error('Error in extractive summary:', error);
    throw new Error('Failed to generate extractive summary');
  }
};

// Function for abstractive summarization
const generateAbstractiveSummary = async (text) => {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('Google AI API key is not configured');
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.4,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 1024,
      },
    });

    const prompt = `Please provide a comprehensive summary of the following text. The summary should:
1. Capture the main ideas and key points
2. Be well-structured with clear paragraphs
3. Maintain logical flow and coherence
4. Include important details while removing redundancy
5. Be approximately 25-30% of the original length

Text to summarize:
${text}

Format the response as follows:
1. First, list 3-5 main topics
2. Then, provide the summary
3. If there's a conclusion in the original text, include it
4. Do not include any additional commentary`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    if (!summary) {
      throw new Error('Failed to generate summary from AI model');
    }

    // Extract topics from the summary
    const topics = getMainTopics(summary);

    // Split the summary into parts
    const parts = summary.split('\n\n');
    const mainSummary = parts.find(p =>
      !p.toLowerCase().includes('main topic') &&
      !p.toLowerCase().includes('conclusion')
    ) || summary;

    const conclusion = parts.find(p =>
      p.toLowerCase().includes('conclusion')
    ) || '';

    return {
      topics,
      summary: mainSummary.trim(),
      conclusion: conclusion.trim(),
      analysis: {
        originalWords: getWordCount(text),
        summaryWords: getWordCount(mainSummary),
        originalChars: text.length,
        summaryChars: mainSummary.length,
        readingTime: getReadingTime(getWordCount(text)),
        summaryReadingTime: getReadingTime(getWordCount(mainSummary))
      }
    };
  } catch (error) {
    console.error('Error in abstractive summary:', error);
    if (error.message.includes('API key')) {
      throw new Error('AI summarization is not properly configured. Please check API key.');
    }
    throw new Error('Failed to generate abstractive summary: ' + error.message);
  }
};

export async function POST(request) {
  try {
    const { text, type = 'extractive' } = await request.json();

    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input');
    }

    if (text.length < 100) {
      throw new Error('Text is too short. Please provide at least 100 characters.');
    }

    try {
      // Generate summary based on type
      const { topics, summary, conclusion, analysis } =
        type === 'abstractive'
          ? await generateAbstractiveSummary(text)
          : await generateExtractiveSummary(text);

      // Format topics into a sentence
      const topicsText = topics.length > 0
        ? `The main topics discussed are: ${topics.join(', ')}.`
        : 'No clear main topics identified.';

      // Format the summary
      const formattedSummary = `
## Main Topics
${topicsText}

## Summary
${summary}
${conclusion ? `\n## Conclusion\n${conclusion}` : ''}

## Analysis
📊 Length Comparison
- Original Text: ${analysis.originalWords} words (${analysis.originalChars} characters)
- Summary: ${analysis.summaryWords} words (${analysis.summaryChars} characters)
- Reduction: ${Math.round((1 - analysis.summaryWords / analysis.originalWords) * 100)}%

⏱️ Reading Time
- Original Text: ${analysis.readingTime} minute${analysis.readingTime > 1 ? 's' : ''}
- Summary: ${analysis.summaryReadingTime} minute${analysis.summaryReadingTime > 1 ? 's' : ''}`;

      return new NextResponse(formattedSummary, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });

    } catch (summaryError) {
      console.error('Summarization error:', summaryError);
      return NextResponse.json(
        { error: summaryError.message || 'Failed to generate summary. Please try with different text.' },
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
