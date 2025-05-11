import { NextResponse } from 'next/server';
import { getSubtitles } from 'youtube-captions-scraper';
import { google } from 'googleapis';
import Cache from 'memory-cache';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // Cache results for 24 hours
const youtube = google.youtube('v3');

// Validate API key
if (!process.env.YOUTUBE_API_KEY) {
    console.warn('YouTube API key is not configured. Some features may not work.');
}

const API_KEY = process.env.YOUTUBE_API_KEY;

export async function POST(request) {
    try {
        const { videoUrl } = await request.json();

        if (!videoUrl) {
            return errorResponse('YouTube video URL is required.', 400);
        }

        // Extract Video ID
        const videoId = extractVideoId(videoUrl);
        if (!videoId) {
            return errorResponse('Invalid YouTube URL. Please provide a valid YouTube video URL.', 400);
        }

        // Check cache
        const cachedData = Cache.get(videoId);
        if (cachedData) {
            return successResponse(cachedData);
        }

        // Fetch video info and subtitles
        const videoData = await fetchVideoData(videoId);
        if (!videoData) {
            return errorResponse('Could not fetch video information. The video might be private or unavailable.', 400);
        }

        // Process transcript
        const processedData = processTranscript(videoData.transcript);

        const responseData = {
            videoId,
            title: videoData.title,
            description: videoData.description,
            transcript: videoData.transcript,
            summary: processedData.summary,
            bulletPoints: processedData.bulletPoints,
            message: 'Video processed successfully.'
        };

        // Cache the response
        Cache.put(videoId, responseData, CACHE_DURATION);

        return successResponse(responseData);
    } catch (error) {
        console.error('Error processing video:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code
        });

        // Handle specific error cases
        if (error.message.includes('No captions available')) {
            return errorResponse('This video has no captions available. Please try a different video.', 400);
        }
        if (error.message.includes('Video not found')) {
            return errorResponse('Video not found. It might be private or deleted.', 404);
        }
        if (error.message.includes('API key')) {
            return errorResponse('YouTube API is not properly configured. Please check your API key.', 500);
        }
        if (error.message.includes('quota')) {
            return errorResponse('YouTube API quota exceeded. Please try again later.', 429);
        }
        if (error.message.includes('network')) {
            return errorResponse('Network error while fetching video data. Please check your internet connection.', 503);
        }

        // Log the full error for debugging
        console.error('Full error details:', error);

        return errorResponse('Server error while processing video. Please try again later.', 500);
    }
}

export async function PUT(request) {
    try {
        const { query, videoId } = await request.json();

        if (!videoId) {
            return errorResponse('Video ID is required.', 400);
        }
        if (!query) {
            return errorResponse('Query text is required.', 400);
        }

        const cachedData = Cache.get(videoId);
        if (!cachedData || !cachedData.transcript) {
            return errorResponse('Please process the video first using the POST endpoint.', 400);
        }

        // Find relevant content from transcript
        const answer = findRelevantContent(cachedData.transcript, query);
        return successResponse({ response: answer });
    } catch (error) {
        console.error('Error processing query:', error);
        return errorResponse('Error processing your query. Please try again.', 500);
    }
}

// ====== 📌 Helper Functions ======

// ✅ Fetch Video Data (Info + Subtitles)
async function fetchVideoData(videoId) {
    try {
        if (!API_KEY) {
            throw new Error('YouTube API key is not configured');
        }

        // Get video details using YouTube API
        const videoInfo = await youtube.videos.list({
            key: API_KEY,
            part: ['snippet'],
            id: [videoId]
        }).catch(error => {
            console.error('YouTube API Error:', {
                message: error.message,
                code: error.code,
                status: error.status
            });
            throw error;
        });

        if (!videoInfo.data.items || videoInfo.data.items.length === 0) {
            throw new Error('Video not found');
        }

        const videoDetails = videoInfo.data.items[0].snippet;

        // Get captions using youtube-captions-scraper
        let transcript;
        const languages = ['en', 'a.en', 'en-US'];
        let lastError = null;

        for (const lang of languages) {
            try {
                transcript = await getSubtitles({
                    videoID: videoId,
                    lang: lang
                });
                if (transcript && transcript.length > 0) {
                    console.log(`Successfully fetched captions in ${lang}`);
                    break;
                }
            } catch (error) {
                console.log(`Failed to fetch captions in ${lang}:`, error.message);
                lastError = error;
                continue;
            }
        }

        if (!transcript || transcript.length === 0) {
            console.error('Caption fetch errors:', lastError);
            throw new Error('No captions available');
        }

        // Format transcript
        const formattedTranscript = transcript.map(item => ({
            offset: parseFloat(item.start),
            text: item.text.trim()
        }));

        return {
            title: videoDetails.title,
            description: videoDetails.description || '',
            transcript: formattedTranscript
        };
    } catch (error) {
        console.error('Error fetching video data:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code
        });
        throw error;
    }
}

// ✅ Process Transcript for Summary & Bullet Points
function processTranscript(transcript) {
    try {
        const fullText = transcript
            .map(item => item.text.trim())
            .join(' ')
            .replace(/\s+/g, ' ')
            .replace(/\[.*?\]/g, ''); // Remove any [text] patterns

        const sentences = fullText
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 20 && !s.match(/^[0-9]+$/)); // Filter out numbers and short sentences

        // Generate summary from first few sentences
        const summary = sentences
            .slice(0, 5)
            .join('. ') + '.';

        // Generate bullet points
        const bulletPoints = sentences
            .filter(sentence => {
                const words = sentence.split(/\s+/);
                return words.length >= 8 &&
                    words.length <= 30 &&
                    !sentence.toLowerCase().includes('subscribe') &&
                    !sentence.toLowerCase().includes('like this video') &&
                    !sentence.toLowerCase().includes('click the bell') &&
                    !sentence.toLowerCase().includes('don\'t forget to');
            })
            .slice(0, 8)
            .map(sentence => sentence + '.');

        return { summary, bulletPoints };
    } catch (error) {
        console.error('Error processing transcript:', error);
        return {
            summary: 'Error processing transcript.',
            bulletPoints: []
        };
    }
}

// ✅ Find Relevant Content for Query
function findRelevantContent(transcript, query) {
    try {
        // Clean and normalize the query
        const cleanQuery = query.toLowerCase().trim();
        const queryWords = cleanQuery.split(/\s+/).filter(word => word.length > 2);

        if (queryWords.length === 0) {
            return "Please provide a more specific query.";
        }

        // Create chunks with more context
        const chunks = [];
        let currentChunk = { text: '', timestamp: '', startOffset: 0 };
        let chunkSize = 0;
        const MAX_CHUNK_SIZE = 10; // Number of transcript items per chunk

        transcript.forEach((item, index) => {
            currentChunk.text += item.text + ' ';
            chunkSize++;

            if (index === 0) {
                currentChunk.startOffset = item.offset;
                currentChunk.timestamp = formatTime(item.offset);
            }

            if (chunkSize >= MAX_CHUNK_SIZE) {
                chunks.push({ ...currentChunk });
                currentChunk = { text: '', timestamp: '', startOffset: 0 };
                chunkSize = 0;
            }
        });

        if (currentChunk.text) {
            chunks.push(currentChunk);
        }

        // Score chunks based on multiple factors
        const scoredChunks = chunks.map(chunk => {
            const chunkText = chunk.text.toLowerCase();
            const chunkWords = chunkText.split(/\s+/);
            let score = 0;
            let exactMatches = 0;
            let partialMatches = 0;

            // Check for exact phrase match
            if (chunkText.includes(cleanQuery)) {
                score += 2;
            }

            // Check for individual word matches
            queryWords.forEach(queryWord => {
                // Exact word match
                if (chunkWords.includes(queryWord)) {
                    score += 1;
                    exactMatches++;
                }

                // Partial word match
                chunkWords.forEach(chunkWord => {
                    if (chunkWord.includes(queryWord) || queryWord.includes(chunkWord)) {
                        score += 0.5;
                        partialMatches++;
                    }
                });
            });

            // Calculate word order score
            const queryWordPositions = queryWords.map(word => chunkText.indexOf(word));
            if (queryWordPositions.every(pos => pos !== -1)) {
                const isInOrder = queryWordPositions.every((pos, i) =>
                    i === 0 || pos > queryWordPositions[i - 1]
                );
                if (isInOrder) score += 0.5;
            }

            // Normalize score based on chunk length
            const normalizedScore = score / (chunkWords.length * 0.1);

            return {
                ...chunk,
                score: normalizedScore,
                exactMatches,
                partialMatches
            };
        });

        // Filter and sort chunks
        const relevantChunks = scoredChunks
            .filter(chunk => chunk.score > 0.1 || chunk.exactMatches > 0)
            .sort((a, b) => {
                // Prioritize chunks with exact matches
                if (a.exactMatches !== b.exactMatches) {
                    return b.exactMatches - a.exactMatches;
                }
                // Then sort by score
                return b.score - a.score;
            })
            .slice(0, 3); // Get top 3 most relevant chunks

        if (relevantChunks.length === 0) {
            return "No relevant content found. Try rephrasing your query or using different keywords.";
        }

        // Format the response with timestamps and context
        const formattedResponse = relevantChunks.map(chunk => {
            const context = chunk.text.trim();
            return `[${chunk.timestamp}] ${context}`;
        }).join('\n\n');

        // Add a note if there were partial matches
        const hasPartialMatches = relevantChunks.some(chunk => chunk.partialMatches > 0);
        if (hasPartialMatches) {
            return formattedResponse + '\n\nNote: Some results may be partially relevant to your query.';
        }

        return formattedResponse;
    } catch (error) {
        console.error('Error finding relevant content:', {
            message: error.message,
            query,
            stack: error.stack
        });
        return "Error processing your query. Please try again with different keywords.";
    }
}

// ✅ Format Time
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// ✅ Extract Video ID
function extractVideoId(url) {
    try {
        const urlObj = new URL(url);
        const searchParams = new URLSearchParams(urlObj.search);

        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }
        if (urlObj.hostname.includes('youtube.com')) {
            return searchParams.get('v');
        }

        return null;
    } catch {
        return null;
    }
}

// ✅ Response Handlers
function successResponse(data, status = 200) {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400'
        }
    });
}

function errorResponse(message, status = 400) {
    return new NextResponse(JSON.stringify({ error: message }), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        }
    });
}
