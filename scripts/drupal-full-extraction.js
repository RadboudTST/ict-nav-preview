/**
 * Drupal ICT Pages Full Extraction Script
 *
 * Run this in the browser console while logged into Drupal CMS.
 * It will extract all direct ICT pages and download results as JSON.
 *
 * READ-ONLY: This script only reads data, never submits forms.
 *
 * Usage:
 * 1. Log into Drupal at https://www.ru.nl
 * 2. Open browser console (F12 or Cmd+Option+J)
 * 3. Paste this entire script and press Enter
 * 4. Wait ~1-2 minutes for extraction
 * 5. JSON file will auto-download when complete
 */

// Only direct ICT pages (not cross-links to other sections)
const ALL_NODE_IDS = {
  wachtwoord: [53060, 1420, 1419, 1413],
  wifi: [19341, 1352, 55638],
  buitenDeCampusWerken: [1649, 1652, 1570],
  bestandenDelen: [1854, 54217, 55047, 1355, 55044, 70957],
  printen: [53789, 1351, 66586],
  emailEnAgenda: [51375, 1350, 1650],
  beveiliging: [1855, 1665, 1354, 54474, 54472, 47669, 73076],
  software: [53303, 71338, 55197, 1324, 76637, 46905, 56113, 46225],
  hardware: [53221, 53759, 53302, 66585, 55535]
};

// Cross-links (pages that link to other sections)
const CROSS_LINKS = {
  buitenDeCampusWerken: [
    { title: "Thuiswerken", url: "/medewerkers/welzijn-ontwikkeling/thuiswerken" },
    { title: "Citrix Workspace", url: "/handleidingen/citrix-workspace" }
  ],
  bestandenDelen: [
    { title: "Cloudopslag OneDrive", url: "/medewerkers/ict/cloudopslag-onedrive" }
  ],
  printen: [
    { title: "Printer installeren", url: "/handleidingen/printer-installeren" },
    { title: "Dubbelzijdig printen", url: "/handleidingen/dubbelzijdig-printen" }
  ],
  emailEnAgenda: [
    { title: "Afwezigheidsassistent", url: "/handleidingen/afwezigheidsassistent" },
    { title: "Gedeelde mailbox", url: "/handleidingen/gedeelde-mailbox" },
    { title: "Mailinglijsten", url: "/handleidingen/mailinglijsten" },
    { title: "E-mail doorsturen", url: "/handleidingen/email-doorsturen" },
    { title: "Functionele mailbox", url: "/handleidingen/functionele-mailbox" }
  ]
};

// Flatten to single array with category info
const ALL_PAGES = Object.entries(ALL_NODE_IDS).flatMap(([category, ids]) =>
  ids.map(nodeId => ({ nodeId, category }))
);

console.log(`Starting extraction of ${ALL_PAGES.length} direct ICT pages...`);

async function extractPage(nodeId, category) {
  try {
    const response = await fetch(`/node/${nodeId}/edit`, {
      credentials: 'include'
    });

    if (!response.ok) {
      console.warn(`Failed to fetch node ${nodeId}: ${response.status}`);
      return { nodeId, category, error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract all fields
    const data = {
      nodeId,
      category,
      extractedAt: new Date().toISOString(),

      // Basic fields
      title: doc.querySelector('input[name="title[0][value]"]')?.value?.trim(),
      description: doc.querySelector('textarea[name="body[0][summary]"]')?.value,
      urlAlias: doc.querySelector('input[name="path[0][alias]"]')?.value,

      // Content (HTML body)
      content: doc.querySelector('textarea[name="body[0][value]"]')?.value,

      // Publication date
      publishedAt: doc.querySelector('input[name="field_publication_date[0][value][date]"]')?.value,

      // Metadata
      metadata: {
        // Audience (checked checkboxes)
        audience: Array.from(doc.querySelectorAll('input[name^="field_audience"]:checked'))
          .map(cb => {
            const label = cb.parentElement?.textContent?.trim();
            return label && !label.startsWith('-') ? label : null;
          })
          .filter(Boolean),

        // Category from Rubriek
        rubriekCategory: doc.querySelector('select[name="field_topic[0][target_id]"]')?.options[
          doc.querySelector('select[name="field_topic[0][target_id]"]')?.selectedIndex
        ]?.text,

        // Organisation
        organisation: doc.querySelector('input[name="field_organisation[0][target_id]"]')?.value,

        // Keywords
        keywords: Array.from(doc.querySelectorAll('input[name^="field_keyword"]'))
          .map(i => i.value)
          .filter(Boolean)
      },

      // Contact info
      contact: {
        email: doc.querySelector('input[name="field_email[0][value]"]')?.value,
        phone: doc.querySelector('input[name="field_phone_number[0][value]"]')?.value,
        department: doc.querySelector('input[name="field_contact_department[0][target_id]"]')?.value
      },

      // Parse links from HTML content
      links: (() => {
        const bodyHtml = doc.querySelector('textarea[name="body[0][value]"]')?.value || '';
        const bodyDoc = parser.parseFromString(bodyHtml, 'text/html');
        return Array.from(bodyDoc.querySelectorAll('a')).map(a => ({
          text: a.textContent?.trim(),
          href: a.getAttribute('href')
        })).filter(l => l.href);
      })(),

      // Handleidingen (manual links)
      handleidingen: Array.from(doc.querySelectorAll('input[name^="field_manual"]'))
        .map(i => i.value)
        .filter(Boolean)
    };

    return data;
  } catch (error) {
    console.error(`Error extracting node ${nodeId}:`, error);
    return { nodeId, category, error: error.message };
  }
}

async function extractAll() {
  const results = [];
  const startTime = Date.now();

  // Process in batches of 5 for speed
  const BATCH_SIZE = 5;

  for (let i = 0; i < ALL_PAGES.length; i += BATCH_SIZE) {
    const batch = ALL_PAGES.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(({ nodeId, category }) => extractPage(nodeId, category))
    );
    results.push(...batchResults);

    const progress = Math.min(i + BATCH_SIZE, ALL_PAGES.length);
    console.log(`Progress: ${progress}/${ALL_PAGES.length} pages extracted`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Extraction complete! ${results.length} direct pages in ${elapsed}s`);

  // Create output object
  const output = {
    _meta: {
      extractedAt: new Date().toISOString(),
      source: 'Drupal CMS /node/{id}/edit pages',
      totalDirectPages: results.length,
      totalCrossLinks: Object.values(CROSS_LINKS).flat().length,
      extractionTimeSeconds: parseFloat(elapsed),
      nodeIdsByCategory: ALL_NODE_IDS
    },
    pages: results,
    crossLinks: CROSS_LINKS
  };

  // Download as JSON
  const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `drupal-ict-extraction-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('JSON file downloaded!');
  return output;
}

// Run extraction
extractAll();
