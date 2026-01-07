describe('Fanatics Careers - Quality & Test Jobs Scraper', () => {
  const FANATICS_URL =
    'https://fa-exki-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/jobs';
  const keywords = ['Quality', 'Test', 'Automation', 'QA'];

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('scrapes all Quality/Test positions from base careers page', () => {
    cy.visitFanaticsCareers();

    cy.handleCookieConsent();
    cy.debugIntercept('@getJobs'); // logs intercepted URL

    const matchedJobs = [];
    cy.collectJobs(matchedJobs, keywords);

    cy.wrap(matchedJobs).then(jobs => {
      cy.writeFile('fixtures/fanatics-jobs.json', {
        totalJobs: jobs.length,
        jobs,
        timestamp: new Date().toISOString(),
      });
    });
  });

  it('uses keyword parameter in URL and waits on jobs API', () => {
    cy.visitFanaticsCareers(`${FANATICS_URL}?keyword=Quality&mode=location`);

    cy.handleCookieConsent();
    cy.debugIntercept('@getJobs');

    const jobs = [];
    cy.collectJobs(jobs, ['Quality', 'Test']);

    cy.wrap(jobs).then(found => {
      cy.writeFile('fixtures/quality-test-jobs.json', {
        totalFound: found.length,
        timestamp: new Date().toISOString(),
        url: `${FANATICS_URL}?keyword=Quality&mode=location`,
        jobs: found,
      });
    });
  });

  it('searches for multiple keywords with scrolling', () => {
    const searchKeywords = ['Quality', 'QA', 'Test', 'Automation'];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    searchKeywords.forEach(keyword => {
      cy.visitFanaticsCareers(`${FANATICS_URL}?keyword=${keyword}&mode=location`);

      cy.handleCookieConsent();
      cy.debugIntercept('@getJobs');

      const jobs = [];
      // Use infinite scroll to load ALL results for this keyword
      cy.handleInfiniteScroll(jobs, [keyword]);

      // Save each keyword to its own timestamped file
      cy.then(() => {
        const filename = `fixtures/results/${keyword}-jobs-${timestamp}.json`;
        cy.writeFile(filename, {
          keyword,
          totalJobs: jobs.length,
          jobs,
          searchUrl: `${FANATICS_URL}?keyword=${keyword}&mode=location`,
          timestamp: new Date().toISOString(),
        });
        cy.log(`📁 Saved ${jobs.length} jobs to ${filename}`);
      });
    });
  });

  it('handles infinite scroll to collect all jobs', () => {
    cy.visitFanaticsCareers();

    cy.handleCookieConsent();
    cy.debugIntercept('@getJobs');

    const allJobs = [];
    cy.handleInfiniteScroll(allJobs, keywords);

    cy.wrap(allJobs).then(jobs => {
      cy.writeFile('fixtures/all-pages-jobs.json', {
        totalJobs: jobs.length,
        jobs,
        timestamp: new Date().toISOString(),
      });
    });
  });
});