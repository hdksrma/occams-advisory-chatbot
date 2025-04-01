const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// URLs to scrape from the Occams Advisory website
const urlsToScrape = [
  'https://www.occamsadvisory.com/',
  'https://www.occamsadvisory.com/about',
  'https://www.occamsadvisory.com/our-services',
  'https://www.occamsadvisory.com/our-team',
  'https://www.occamsadvisory.com/contact',
  'https://www.occamsadvisory.com/business-services-growth-incubation',
  'https://www.occamsadvisory.com/financial-technology-payment-solutions',
  'https://www.occamsadvisory.com/capital-markets-investment-banking',
  'https://www.occamsadvisory.com/tax-credits'
];

// Function to scrape text content from a URL
async function scrapeUrl(url) {
  try {
    console.log(`Scraping ${url}...`);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Remove script tags, style tags, and comments
    $('script, style, comments').remove();
    
    // Extract the page title
    const title = $('title').text().trim();
    
    // Extract visible text content from the body, preserving structure
    let content = '';
    
    // Extract headings with their content
    $('h1, h2, h3, h4, h5, h6').each((index, element) => {
      const headingText = $(element).text().trim();
      if (headingText) {
        content += `### ${headingText}\n\n`;
      }
    });
    
    // Extract paragraphs
    $('p').each((index, element) => {
      const paragraphText = $(element).text().trim();
      if (paragraphText) {
        content += `${paragraphText}\n\n`;
      }
    });
    
    // Extract list items
    $('ul, ol').each((index, element) => {
      $(element).find('li').each((i, li) => {
        const listItemText = $(li).text().trim();
        if (listItemText) {
          content += `- ${listItemText}\n`;
        }
      });
      content += '\n';
    });
    
    // Process any specific sections or custom elements as needed
    $('.service-item, .team-member, .contact-info').each((index, element) => {
      const sectionText = $(element).text().trim();
      if (sectionText) {
        content += `${sectionText}\n\n`;
      }
    });
    
    // Clean up extra whitespace and empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
    
    return {
      url,
      title,
      content,
      source: 'Occams Advisory Website'
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return {
      url,
      title: 'Error',
      content: `Failed to scrape content: ${error.message}`,
      source: 'Error'
    };
  }
}

// Main function to scrape all URLs and save the content
async function scrapeWebsite() {
  const scrapedData = [];
  
  for (const url of urlsToScrape) {
    const pageData = await scrapeUrl(url);
    scrapedData.push(pageData);
  }
  
  // Create data directory if it doesn't exist
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Save the scraped data to a JSON file
  const outputPath = path.join(dataDir, 'occams_advisory_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(scrapedData, null, 2));
  
  console.log(`Scraped data saved to ${outputPath}`);
  return scrapedData;
}

// Export the function for use in other modules
module.exports = {
  scrapeWebsite
};

// Run the scraper if this file is executed directly
if (require.main === module) {
  scrapeWebsite().catch(console.error);
}