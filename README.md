# Occams Advisory Chatbot

A small LLM-based chatbot that answers queries about Occams Advisory using information from their website (https://www.occamsadvisory.com/). The chatbot is built using Node.js and LangChain with a basic UI for demonstration purposes.

## Features

- Web scraping of Occams Advisory website content
- Vector storage for efficient information retrieval
- LLM integration via LangChain
- Simple and intuitive user interface
- Strict limitation to only provide information found on the website

## Prerequisites

- Node.js (v16.0.0 or higher)
- npm (v7.0.0 or higher)
- OpenAI API key

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/hdksrma/occams-advisory-chatbot
   cd occams-advisory-chatbot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   NODE_ENV=development
   ```

## Usage

1. Scrape the Occams Advisory website (this step is optional as the scraper will run automatically when the server starts if no data is found):
   ```
   npm run scrape
   ```

2. Start the server:
   ```
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000` to use the chatbot.

## Project Structure

- `scraper.js`: Script to scrape content from the Occams Advisory website
- `server.js`: Backend server with LangChain integration
- `public/index.html`: Frontend UI for the chatbot
- `data/`: Directory for storing scraped data and vector embeddings

## How It Works

1. **Web Scraping**: The scraper extracts content from the Occams Advisory website, including headings, paragraphs, and list items.

2. **Data Processing**: The scraped content is split into chunks for efficient storage and retrieval.

3. **Vector Embeddings**: Text chunks are converted into vector embeddings using OpenAI's embedding model.

4. **Question Answering**: When a user asks a question, the system:
   - Converts the question to a vector embedding
   - Finds the most relevant chunks of information
   - Uses an LLM to generate a response based on those chunks
   - Ensures responses are limited to information from the website

5. **User Interface**: A simple chat interface allows users to interact with the chatbot.

## Limitations

- The chatbot can only provide information that exists on the Occams Advisory website.
- It may not understand complex or ambiguous queries perfectly.
- The information is only as current as the last scrape of the website.

## Extending the Project

1. **Improve Scraping**: Enhance the scraper to handle dynamic content or additional pages.
2. **Advanced UI**: Add features like chat history, message timestamps, or mobile responsiveness.
3. **Scheduled Updates**: Implement automatic re-scraping to keep information current.
4. **Fine-tuning**: Fine-tune the LLM for better domain-specific responses.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
