// import { NextResponse } from 'next/server';
// import pdfParse from 'pdf-parse';
// import crypto from 'crypto';
// import Cache from 'memory-cache';
// import { GoogleGenerativeAI } from '@google/generative-ai';

// const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
// const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// // Initialize Google AI with proper error handling
// let genAI;
// try {
//     if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
//         console.warn('Google AI API key is not configured. Some features may not work.');
//     } else {
//         genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
//     }
// } catch (error) {
//     console.error('Error initializing Google AI:', error);
// }

// export const config = {
//     api: {
//         bodyParser: false,
//     },
// };

// export async function POST(request) {
//     try {
//         const formData = await request.formData();
//         const file = formData.get('file');

//         if (!file) {
//             return NextResponse.json(
//                 { error: 'No file provided' },
//                 { status: 400 }
//             );
//         }

//         if (!file.type || !file.type.includes('pdf')) {
//             return NextResponse.json(
//                 { error: 'Invalid file type. Please upload a PDF file' },
//                 { status: 400 }
//             );
//         }

//         if (file.size > MAX_FILE_SIZE) {
//             return NextResponse.json(
//                 { error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` },
//                 { status: 400 }
//             );
//         }

//         const buffer = await file.arrayBuffer();
//         const fileHash = generateFileHash(buffer);

//         // Check cache
//         const cachedData = Cache.get(fileHash);
//         if (cachedData) {
//             return NextResponse.json({ ...cachedData, fromCache: true });
//         }

//         // Process PDF
//         const data = await pdfParse(Buffer.from(buffer));
//         const text = cleanText(data.text);

//         if (!text || text.trim().length === 0) {
//             return NextResponse.json(
//                 { error: 'No readable text found in the PDF' },
//                 { status: 400 }
//             );
//         }

//         // Process document content
//         let processedData;
//         try {
//             if (genAI) {
//                 processedData = await processDocumentWithAI(text);
//             } else {
//                 processedData = processDocumentBasic(text);
//             }
//         } catch (error) {
//             console.error('Error in document processing:', error);
//             processedData = processDocumentBasic(text);
//         }

//         // Calculate basic sentiment score
//         const sentiment = calculateBasicSentiment(text);
//         const readabilityScore = calculateReadabilityScore(sentiment);

//         // Extract key phrases
//         const keyPhrases = extractKeyPhrases(text);

//         // Store the full text in cache for future chat queries
//         const cacheData = {
//             ...processedData,
//             fullText: text,
//             conversations: [],
//             sentiment,
//             readabilityScore,
//             keyPhrases
//         };

//         Cache.put(fileHash, cacheData, CACHE_DURATION);

//         const responseData = {
//             ...processedData,
//             fileHash,
//             sentiment,
//             readabilityScore,
//             keyPhrases,
//             metadata: {
//                 title: data.info?.Title || 'Untitled',
//                 author: data.info?.Author || 'Unknown',
//                 creationDate: data.info?.CreationDate,
//                 keywords: data.info?.Keywords || '',
//                 pageCount: data.numpages,
//                 version: data.info?.PDFFormatVersion,
//                 producer: data.info?.Producer,
//                 fileSize: Math.round(file.size / 1024) + ' KB'
//             },
//             statistics: {
//                 wordCount: text.split(/\s+/).length,
//                 characterCount: text.length,
//                 sentenceCount: text.split(/[.!?]+/).length - 1,
//                 readingTime: Math.ceil(text.split(/\s+/).length / 200) // Assuming 200 words per minute
//             }
//         };

//         return NextResponse.json(responseData);
//     } catch (error) {
//         console.error('Error processing PDF:', error);
//         return NextResponse.json(
//             { error: error.message || 'Error processing PDF. Please try again.' },
//             { status: error.status || 500 }
//         );
//     }
// }

// export async function PUT(request) {
//     try {
//         const body = await request.json();
//         const { query, fileKey } = body;

//         if (!query || !fileKey) {
//             return NextResponse.json(
//                 { error: 'Query and file key are required' },
//                 { status: 400 }
//             );
//         }

//         const cachedData = Cache.get(fileKey);
//         if (!cachedData) {
//             return NextResponse.json(
//                 { error: 'PDF session expired. Please upload the file again' },
//                 { status: 404 }
//             );
//         }

//         // Get relevant content from the PDF based on the query
//         let relevantContent;
//         try {
//             if (genAI) {
//                 relevantContent = await findRelevantContentWithAI(cachedData.fullText, query);
//             } else {
//                 relevantContent = findRelevantContentBasic(cachedData.fullText, query);
//             }
//         } catch (error) {
//             console.error('Error in content search:', error);
//             relevantContent = findRelevantContentBasic(cachedData.fullText, query);
//         }

//         // Add to conversation history
//         const conversation = {
//             query,
//             response: relevantContent.answer,
//             timestamp: new Date().toISOString(),
//             context: relevantContent.context
//         };

//         cachedData.conversations = cachedData.conversations || [];
//         cachedData.conversations.push(conversation);
//         Cache.put(fileKey, cachedData, CACHE_DURATION);

//         return NextResponse.json({
//             answer: relevantContent.answer,
//             context: relevantContent.context,
//             conversations: cachedData.conversations
//         });
//     } catch (error) {
//         console.error('Error processing query:', error);
//         return NextResponse.json(
//             { error: error.message || 'Error processing query' },
//             { status: 500 }
//         );
//     }
// }

// // === Helper Functions === //
// function cleanText(text) {
//     return text
//         .replace(/\s+/g, ' ')
//         .replace(/[^\w\s.,!?-]/g, '')
//         .trim();
// }

// function calculateBasicSentiment(text) {
//     const positiveWords = new Set(['good', 'great', 'excellent', 'positive', 'happy', 'success', 'best', 'better', 'improve', 'improved']);
//     const negativeWords = new Set(['bad', 'poor', 'negative', 'unhappy', 'failure', 'worst', 'worse', 'problem', 'issue', 'difficult']);

//     const words = text.toLowerCase().split(/\s+/);
//     let score = 0;

//     words.forEach(word => {
//         if (positiveWords.has(word)) score += 1;
//         if (negativeWords.has(word)) score -= 1;
//     });

//     // Normalize score between -5 and 5
//     return Math.max(-5, Math.min(5, score / 10));
// }

// function calculateReadabilityScore(sentiment) {
//     // Convert sentiment score (-5 to 5) to a percentage (0 to 100)
//     return Math.round((sentiment + 5) * 10);
// }

// function extractKeyPhrases(text) {
//     const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
//     const words = text.toLowerCase().split(/\s+/);
//     const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being']);

//     // Count word frequencies
//     const wordFreq = {};
//     words.forEach(word => {
//         if (word.length > 3 && !stopWords.has(word)) {
//             wordFreq[word] = (wordFreq[word] || 0) + 1;
//         }
//     });

//     // Get top words
//     const topWords = Object.entries(wordFreq)
//         .sort((a, b) => b[1] - a[1])
//         .slice(0, 10)
//         .map(([word]) => word);

//     // Find sentences containing top words
//     const phrases = [];
//     sentences.forEach(sentence => {
//         const sentenceWords = sentence.toLowerCase().split(/\s+/);
//         const containsTopWord = topWords.some(word => sentenceWords.includes(word));
//         if (containsTopWord && sentenceWords.length >= 3 && sentenceWords.length <= 10) {
//             phrases.push(sentence.trim());
//         }
//     });

//     // Return top 5 phrases
//     return phrases.slice(0, 5);
// }

// async function processDocumentWithAI(text) {
//     try {
//         if (!genAI) {
//             throw new Error('Google AI not initialized');
//         }

//         const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

//         // Generate summary
//         const summaryPrompt = `Please provide a concise summary of the following text, highlighting the main points and key findings. Keep it under 200 words:\n\n${text.substring(0, 10000)}`;
//         const summaryResult = await model.generateContent(summaryPrompt);
//         const summary = summaryResult.response.text();

//         // Extract key points
//         const keyPointsPrompt = `Please extract 5-7 key points from the following text. Each point should be a complete sentence and capture an important aspect of the content:\n\n${text.substring(0, 10000)}`;
//         const keyPointsResult = await model.generateContent(keyPointsPrompt);
//         const bulletPoints = keyPointsResult.response.text().split('\n').filter(point => point.trim());

//         // Extract topics
//         const topicsPrompt = `Please identify 5 main topics or themes from the following text. Return only the topic names, one per line:\n\n${text.substring(0, 10000)}`;
//         const topicsResult = await model.generateContent(topicsPrompt);
//         const topics = topicsResult.response.text().split('\n').filter(topic => topic.trim());

//         return {
//             summary,
//             bulletPoints,
//             topics
//         };
//     } catch (error) {
//         console.error('Error in AI processing:', error);
//         throw error; // Let the caller handle the fallback
//     }
// }

// function processDocumentBasic(text) {
//     const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
//     const summary = generateSummary(sentences);
//     const bulletPoints = extractKeyPoints(sentences);
//     const topics = extractTopicsSimple(text);

//     return {
//         summary,
//         bulletPoints,
//         topics
//     };
// }

// async function findRelevantContentWithAI(text, query) {
//     try {
//         const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

//         // Find relevant context
//         const contextPrompt = `Given the following text and question, find the most relevant section that answers the question. Return only the relevant text:\n\nText: ${text.substring(0, 10000)}\n\nQuestion: ${query}`;
//         const contextResult = await model.generateContent(contextPrompt);
//         const context = contextResult.response.text();

//         // Generate answer
//         const answerPrompt = `Based on the following context, provide a clear and concise answer to the question. If the context doesn't contain enough information to answer the question, say so:\n\nContext: ${context}\n\nQuestion: ${query}`;
//         const answerResult = await model.generateContent(answerPrompt);
//         const answer = answerResult.response.text();

//         return { answer, context };
//     } catch (error) {
//         console.error('Error in AI content search:', error);
//         // Fallback to basic content search
//         return findRelevantContentBasic(text, query);
//     }
// }

// function findRelevantContentBasic(text, query) {
//     const paragraphs = text.split(/\n\s*\n/);

//     const relevantParagraphs = paragraphs
//         .map(p => ({
//             text: p.trim(),
//             score: query.toLowerCase().split(' ')
//                 .filter(word => word.length > 2)
//                 .reduce((score, word) =>
//                     score + (p.toLowerCase().includes(word) ? 1 : 0), 0)
//         }))
//         .filter(p => p.score > 0)
//         .sort((a, b) => b.score - a.score)
//         .slice(0, 2);

//     if (relevantParagraphs.length === 0) {
//         return {
//             answer: "I couldn't find a specific answer to your question in the document. Could you please rephrase your question or be more specific?",
//             context: null
//         };
//     }

//     const context = relevantParagraphs.map(p => p.text).join('\n\n');
//     const answer = `Based on the document content:\n\n${context}`;

//     return { answer, context };
// }

// function generateSummary(sentences) {
//     return sentences.slice(0, 3).join('. ') + '.';
// }

// function extractKeyPoints(sentences) {
//     return sentences
//         .filter((s, i) => {
//             const words = s.trim().split(/\s+/);
//             return (
//                 words.length > 5 &&
//                 words.length < 30 &&
//                 (i < sentences.length * 0.3 || i > sentences.length * 0.7)
//             );
//         })
//         .slice(0, 5)
//         .map(s => s.trim());
// }

// function extractTopicsSimple(text) {
//     const words = text.toLowerCase().split(/\s+/);
//     const wordFreq = {};
//     const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);

//     words.forEach(word => {
//         if (word.length > 3 && !stopWords.has(word)) {
//             wordFreq[word] = (wordFreq[word] || 0) + 1;
//         }
//     });

//     return Object.entries(wordFreq)
//         .sort((a, b) => b[1] - a[1])
//         .slice(0, 5)
//         .map(([word]) => word);
// }

// function generateFileHash(buffer) {
//     return crypto.createHash('md5').update(Buffer.from(buffer)).digest('hex');
// }
