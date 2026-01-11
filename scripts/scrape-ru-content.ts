import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://www.ru.nl';
const ICT_URL = `${BASE_URL}/services/campusfaciliteiten-gebouwen/ict`;
const OUTPUT_PATH = path.join(process.cwd(), 'src/features/navigation-editor/data/scraped-content.json');

interface ScrapedPage {
  id: string;
  title: string;
  description: string;
  intro?: string;
  content?: string;
  url: string;
}

interface ScrapedCategory {
  id: string;
  label: string;
  description?: string;
  url: string;
  pages: ScrapedPage[];
}

// Helper to add delay between requests
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch HTML content from a URL
async function fetchPage(url: string): Promise<string> {
  console.log(`  Fetching: ${url}`);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'nl,en;q=0.9',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

// Extract text content, cleaning up whitespace
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// Convert HTML element to clean HTML for TipTap
function elementToHtml($: cheerio.CheerioAPI, el: cheerio.Cheerio<cheerio.Element>): string {
  let result = '';

  el.children().each((_, child) => {
    const $child = $(child);
    const tagName = (child as cheerio.Element).tagName?.toLowerCase() || '';

    switch (tagName) {
      case 'h1':
      case 'h2': {
        const text = cleanText($child.text());
        if (text) {
          result += `<h2>${text}</h2>`;
        }
        break;
      }
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const text = cleanText($child.text());
        if (text) {
          result += `<h3>${text}</h3>`;
        }
        break;
      }
      case 'p': {
        const text = cleanText($child.text());
        if (text) {
          result += `<p>${text}</p>`;
        }
        break;
      }
      case 'ul': {
        let items = '';
        $child.children('li').each((_, li) => {
          const text = cleanText($(li).text());
          if (text) {
            items += `<li><p>${text}</p></li>`;
          }
        });
        if (items) {
          result += `<ul>${items}</ul>`;
        }
        break;
      }
      case 'ol': {
        let items = '';
        $child.children('li').each((_, li) => {
          const text = cleanText($(li).text());
          if (text) {
            items += `<li><p>${text}</p></li>`;
          }
        });
        if (items) {
          result += `<ol>${items}</ol>`;
        }
        break;
      }
      case 'table': {
        // Extract table as HTML table
        let tableHtml = '<table><tbody>';
        let isFirstRow = true;
        $child.find('tr').each((_, tr) => {
          tableHtml += '<tr>';
          $(tr).find('th, td').each((_, cell) => {
            const text = cleanText($(cell).text());
            const tag = isFirstRow ? 'th' : 'td';
            tableHtml += `<${tag}><p>${text}</p></${tag}>`;
          });
          tableHtml += '</tr>';
          isFirstRow = false;
        });
        tableHtml += '</tbody></table>';
        result += tableHtml;
        break;
      }
      case 'blockquote': {
        const text = cleanText($child.text());
        if (text) {
          result += `<blockquote><p>${text}</p></blockquote>`;
        }
        break;
      }
      case 'div':
      case 'section':
      case 'article':
      case 'main': {
        // Recursively process container elements
        result += elementToHtml($, $child);
        break;
      }
      case 'a': {
        // Convert links to TipTap format
        const href = $child.attr('href');
        const text = cleanText($child.text());
        if (href && text && !$child.hasClass('btn') && !$child.closest('nav').length) {
          const fullHref = href.startsWith('/') ? `https://www.ru.nl${href}` : href;
          result += `<a href="${fullHref}">${text}</a>`;
        }
        break;
      }
      case 'strong':
      case 'b': {
        const text = cleanText($child.text());
        if (text) {
          result += `<strong>${text}</strong>`;
        }
        break;
      }
      case 'em':
      case 'i': {
        const text = cleanText($child.text());
        if (text) {
          result += `<em>${text}</em>`;
        }
        break;
      }
      default: {
        // For other elements, wrap in paragraph
        const text = cleanText($child.text());
        if (text && tagName !== 'script' && tagName !== 'style' && tagName !== 'nav') {
          result += `<p>${text}</p>`;
        }
      }
    }
  });

  return result;
}

// Extract page content
async function scrapePage(url: string, categoryId: string, pageIndex: number): Promise<ScrapedPage | null> {
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    // Get page title
    const title = cleanText($('h1').first().text()) || cleanText($('title').text().split('|')[0]);

    // Get meta description
    let description = $('meta[name="description"]').attr('content') || '';

    // Get intro - usually in a lead/intro section or first paragraph after h1
    let intro = '';
    const introEl = $('.intro, .lead, [class*="intro"], .content-intro').first();
    if (introEl.length) {
      intro = cleanText(introEl.text());
    } else {
      // Try to get first paragraph after h1
      const firstP = $('main h1').first().nextAll('p').first();
      if (firstP.length) {
        intro = cleanText(firstP.text());
      }
    }

    // If no description from meta, use intro
    if (!description && intro) {
      description = intro.substring(0, 200);
    }

    // Get main content - look for the main content area
    let content = '';

    // Try different selectors for main content
    const contentSelectors = [
      'main article',
      'main .content',
      '.content-main',
      'article.content',
      'main',
    ];

    for (const selector of contentSelectors) {
      const contentEl = $(selector).first();
      if (contentEl.length) {
        // Clone to avoid modifying original
        const contentClone = contentEl.clone();

        // Remove elements we don't want
        contentClone.find('nav, header, footer, .breadcrumb, .sidebar, .local-menu, script, style, .btn, .card-grid, .share-buttons, [class*="cookie"], [class*="banner"]').remove();

        // Extract text content
        content = elementToHtml($, contentClone);

        if (content.length > 100) {
          break; // Found substantial content
        }
      }
    }

    const id = `page-${categoryId}-${pageIndex + 1}`;

    return {
      id,
      title: title || 'Zonder titel',
      description: description || 'Geen beschrijving beschikbaar.',
      intro: intro || undefined,
      content: content || undefined,
      url,
    };
  } catch (error) {
    console.error(`  Error scraping page ${url}:`, error);
    return null;
  }
}

// Extract category with all its pages
async function scrapeCategory(url: string, label: string, categoryIndex: number): Promise<ScrapedCategory> {
  console.log(`\nScraping category: ${label}`);

  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const categoryId = `cat-${categoryIndex + 1}`;

  // Get category description from intro or first paragraph
  const descEl = $('.intro, .lead, [class*="intro"], main p').first();
  const description = descEl.length ? cleanText(descEl.text()) : '';

  // Find all page links within this category
  const pageLinks: { title: string; url: string }[] = [];

  // Look for links in the sidebar that are children of this category
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    const text = cleanText($(el).text());

    // Check if this is a subpage of the current category
    if (href && text && href.includes(url.replace(BASE_URL, '')) && href !== url.replace(BASE_URL, '')) {
      const fullUrl = href.startsWith('/') ? BASE_URL + href : href;
      // Avoid duplicates
      if (!pageLinks.some((p) => p.url === fullUrl) && fullUrl !== url) {
        pageLinks.push({ title: text, url: fullUrl });
      }
    }
  });

  // Also look in the main content area for cards or links
  $('.card a, .overview-card a, main a').each((_, el) => {
    const href = $(el).attr('href');
    const text = cleanText($(el).text());

    if (href && text && href.includes('/ict/') && !href.endsWith('/ict/')) {
      const fullUrl = href.startsWith('/') ? BASE_URL + href : href;
      const categorySlug = url.replace(BASE_URL, '').split('/').filter(Boolean).pop();
      if (categorySlug && href.includes(categorySlug) && !pageLinks.some((p) => p.url === fullUrl) && fullUrl !== url) {
        pageLinks.push({ title: text, url: fullUrl });
      }
    }
  });

  console.log(`  Found ${pageLinks.length} pages`);

  // Scrape each page
  const pages: ScrapedPage[] = [];
  for (let i = 0; i < pageLinks.length; i++) {
    await delay(500); // 500ms delay between requests
    const page = await scrapePage(pageLinks[i].url, categoryId, i);
    if (page) {
      // Use the link text as title if scraping didn't get a good one
      if (!page.title || page.title === 'Zonder titel') {
        page.title = pageLinks[i].title;
      }
      pages.push(page);
      console.log(`    [${i + 1}/${pageLinks.length}] ${page.title} - ${page.content?.length || 0} chars content`);
    }
  }

  return {
    id: categoryId,
    label,
    description: description || undefined,
    url,
    pages,
  };
}

// Main scraping function
async function scrapeRuContent(): Promise<void> {
  console.log('Starting RU ICT content scrape...\n');
  console.log('Fetching main ICT page...');

  const html = await fetchPage(ICT_URL);
  const $ = cheerio.load(html);

  // Extract category links from the sidebar
  const categoryLinks: { label: string; url: string }[] = [];

  $('a[href*="/ict/"]').each((_, el) => {
    const href = $(el).attr('href');
    const text = cleanText($(el).text());

    if (href && text) {
      const parts = href.split('/').filter((p) => p);
      // Category URLs have 4 segments: services/campusfaciliteiten-gebouwen/ict/[category]
      if (parts.length === 4 && !href.includes('#')) {
        const fullUrl = href.startsWith('/') ? BASE_URL + href : href;
        if (!categoryLinks.some((c) => c.url === fullUrl)) {
          categoryLinks.push({ label: text, url: fullUrl });
        }
      }
    }
  });

  console.log(`Found ${categoryLinks.length} categories\n`);

  // Scrape each category
  const categories: ScrapedCategory[] = [];
  for (let i = 0; i < categoryLinks.length; i++) {
    await delay(500); // 500ms delay between requests
    const category = await scrapeCategory(categoryLinks[i].url, categoryLinks[i].label, i);
    categories.push(category);
  }

  // Sort categories alphabetically by label for consistency
  categories.sort((a, b) => a.label.localeCompare(b.label, 'nl'));

  // Reassign IDs after sorting
  categories.forEach((cat, i) => {
    cat.id = `cat-${i + 1}`;
    cat.pages.forEach((page, j) => {
      page.id = `page-${i + 1}-${j + 1}`;
    });
  });

  // Save to file
  const output = {
    _meta: {
      source: ICT_URL,
      scrapedAt: new Date().toISOString(),
      totalCategories: categories.length,
      totalPages: categories.reduce((sum, cat) => sum + cat.pages.length, 0),
    },
    categories,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n\nScraping complete!`);
  console.log(`Saved to: ${OUTPUT_PATH}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Total pages: ${output._meta.totalPages}`);

  // Show content stats
  let totalContent = 0;
  let pagesWithContent = 0;
  categories.forEach(cat => {
    cat.pages.forEach(page => {
      if (page.content && page.content.length > 0) {
        totalContent += page.content.length;
        pagesWithContent++;
      }
    });
  });
  console.log(`Pages with content: ${pagesWithContent}/${output._meta.totalPages}`);
  console.log(`Total content: ${(totalContent / 1024).toFixed(1)} KB`);
}

// Run the scraper
scrapeRuContent().catch(console.error);
