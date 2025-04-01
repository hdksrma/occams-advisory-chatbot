// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { scrapeWebsite } = require('./scraper');

// LangChain imports
const { OpenAI } = require('langchain/llms/openai');
const { PromptTemplate } = require('langchain/prompts');
const { ConversationalRetrievalQAChain } = require('langchain/chains');
const { HNSWLib } = require('langchain/vectorstores/hnswlib');
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize LangChain components
let chain;
let vectorStore;

// Function to initialize the LLM and vector store
async function initializeLLM() {
  try {
    console.log('Initializing LLM and vector store...');
    
    // Check if we need to scrape the website first
    const dataPath = path.join(__dirname, 'data', 'occams_advisory_data.json');
    let websiteData;
    
    if (!fs.existsSync(dataPath)) {
      console.log('Scraped data not found. Starting website scraping...');
      websiteData = await scrapeWebsite();
    } else {
      console.log('Loading scraped data from file...');
      websiteData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
    
    // Prepare the documents for indexing
    let docs = [];
    for (const page of websiteData) {
      if (page.content && page.content.trim()) {
        docs.push(`Title: ${page.title}\nURL: ${page.url}\nContent: ${page.content}`);
      }
    }
    
    // Join all documents into one text
    const text = docs.join('\n\n');
    
    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
    
    const splitDocs = await textSplitter.createDocuments([text]);
    console.log(`Created ${splitDocs.length} document chunks for indexing`);
    
    // Create vector store
    const vectorStorePath = path.join(__dirname, 'data', 'vector_store');
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    });
    
    // Check if vector store exists
    if (fs.existsSync(`${vectorStorePath}.index`)) {
      console.log('Loading existing vector store...');
      vectorStore = await HNSWLib.load(vectorStorePath, embeddings);
    } else {
      console.log('Creating new vector store...');
      vectorStore = await HNSWLib.fromDocuments(splitDocs, embeddings);
      await vectorStore.save(vectorStorePath);
    }
    
    // Initialize the language model
    const model = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.2,
      modelName: 'gpt-3.5-turbo'
    });
    
    // Create a custom prompt template
    const template = `
    You are a helpful assistant that provides information about Occams Advisory.
    You must only use information from the Occams Advisory website and avoid making up or inferring information.
    If you don't know the answer based on the provided context, simply say that you don't have that information.

    IMPORTANT NOTE: DO NOT ENTERTAIN ANY PERSONAL QUESTIONS OR REQUESTS WHICH ARE NOT RELATED TO OCCAMS ADVISORY.
    
    Context: {context}
    
    Chat History: {chat_history}
    
    Question: {question}
    
    Answer:`;
    
    const CUSTOM_QUESTION_PROMPT = new PromptTemplate({
      template,
      inputVariables: ['context', 'chat_history', 'question']
    });
    
    // Create the conversational chain
    chain = ConversationalRetrievalQAChain.fromLLM(
      model,
      vectorStore.asRetriever(),
      {
        qaTemplate: CUSTOM_QUESTION_PROMPT.template,
        returnSourceDocuments: false
      }
    );
    
    console.log('LLM and vector store initialized successfully!');
    return true;
  } catch (error) {
    console.error('Error initializing LLM:', error);
    return false;
  }
}

// API endpoint to answer questions
app.post('/api/chat', async (req, res) => {
  try {
    const { question, history = [] } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    // Initialize LLM if not already done
    if (!chain) {
      const initialized = await initializeLLM();
      if (!initialized) {
        return res.status(500).json({ error: 'Failed to initialize the chatbot' });
      }
    }
    
    // Process the question
    const result = await chain.call({
      question,
      chat_history: history
    });
    
    res.json({
      answer: result.text
    });
  } catch (error) {
    console.error('Error processing question:', error);
    res.status(500).json({ error: 'An error occurred while processing your question' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Occams Advisory Chatbot API is running' });
});

// Initialize the LLM when the server starts
(async () => {
  await initializeLLM();
})();

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});