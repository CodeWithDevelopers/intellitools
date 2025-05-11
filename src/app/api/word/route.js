import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import natural from 'natural';
import { SummarizerManager } from 'node-summarizer';

// Initialize NLP components
const tokenizer = new natural.WordTokenizer();
const tfidf = new natural.TfIdf();
let documentContent = '';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json(
                { error: 'Please upload a .doc or .docx file' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Extract text from document
        const result = await mammoth.extractRawText({ buffer });
        documentContent = result.value;

        // Generate summary using TextRank algorithm
        const summarizer = new natural.SentenceTokenizer();
        const sentences = summarizer.tokenize(documentContent);
        
        // Get top 3 sentences as summary
        const summary = sentences.slice(0, 3).join(' ');

        // Perform sentiment analysis
        const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
        const tokens = tokenizer.tokenize(documentContent);
        const sentiment = analyzer.getSentiment(tokens);

        // Add document to TF-IDF for later querying
        tfidf.addDocument(documentContent);

        // Extract key phrases using simple noun phrase extraction
        const keyPhrases = getKeyPhrases(documentContent);

        return NextResponse.json({
            summary,
            sentiment,
            keyPhrases,
            message: 'Document processed successfully'
        });
    } catch (error) {
        console.error('Error processing document:', error);
        return NextResponse.json(
            { error: 'Error processing document. Please try again.' },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const { query } = await request.json();

        if (!documentContent) {
            return NextResponse.json(
                { error: 'Please upload a document first' },
                { status: 400 }
            );
        }

        if (!query) {
            return NextResponse.json(
                { error: 'Please provide a query' },
                { status: 400 }
            );
        }

        // Split document into sentences
        const sentenceTokenizer = new natural.SentenceTokenizer();
        const sentences = sentenceTokenizer.tokenize(documentContent);
        
        // Find relevant sentences using similarity
        const relevantSentences = [];
        sentences.forEach((sentence) => {
            if (sentence.trim().length > 0) {
                const similarity = calculateSimilarity(sentence, query);
                if (similarity > 0.2) { // Lower threshold for better matches
                    relevantSentences.push({
                        sentence: sentence.trim(),
                        score: similarity
                    });
                }
            }
        });

        // Sort by relevance and get top results
        relevantSentences.sort((a, b) => b.score - a.score);
        const topResults = relevantSentences.slice(0, 2);

        const response = topResults.length > 0
            ? topResults.map(r => r.sentence).join(' ')
            : "I couldn't find a relevant answer to your query in the document.";

        return NextResponse.json({ response });
    } catch (error) {
        console.error('Error processing query:', error);
        return NextResponse.json(
            { error: 'Error processing your query. Please try again.' },
            { status: 500 }
        );
    }
}

// Helper function to calculate similarity between query and sentence
function calculateSimilarity(sentence, query) {
    const sentenceTokens = tokenizer.tokenize(sentence.toLowerCase());
    const queryTokens = tokenizer.tokenize(query.toLowerCase());
    
    let matchCount = 0;
    queryTokens.forEach(token => {
        if (sentenceTokens.includes(token)) {
            matchCount++;
        }
    });
    
    return matchCount / queryTokens.length;
}

// Helper function to extract key phrases using simple noun phrase extraction
function getKeyPhrases(text) {
    const language = "EN"
    const defaultCategory = 'N';
    const wordTokenizer = new natural.WordTokenizer();
    const words = wordTokenizer.tokenize(text);
    
    // Use the lexicon for basic POS tagging
    const lexicon = new natural.Lexicon(language, defaultCategory);
    const ruleSet = new natural.RuleSet('EN');
    const tagger = new natural.BrillPOSTagger(lexicon, ruleSet);
    
    const taggedWords = tagger.tag(words).taggedWords;
    
    // Extract noun phrases (consecutive nouns)
    const phrases = [];
    let currentPhrase = [];
    
    taggedWords.forEach((taggedWord) => {
        if (taggedWord.tag.startsWith('N')) {
            currentPhrase.push(taggedWord.token);
        } else if (currentPhrase.length > 0) {
            if (currentPhrase.length >= 2) {
                phrases.push(currentPhrase.join(' '));
            }
            currentPhrase = [];
        }
    });
    
    // Add the last phrase if it exists
    if (currentPhrase.length >= 2) {
        phrases.push(currentPhrase.join(' '));
    }
    
    // Get unique phrases and return top 5
    return [...new Set(phrases)].slice(0, 5);
}
