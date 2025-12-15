// ✅ Extract job info - pure function (not a Cypress command)
function extractJobInfo($job) {
  const title = ($job.find('span.job-tile__title').text() || '').trim();
  const location = ($job.find('span[data-bind="html: primaryLocation"]').text() || '').trim() || 'Unknown';
  const link = $job.find('a.job-list-item__link').attr('href') || '#';
  
  // Get posting date from the job info section
  const $postingDateItem = $job.find('.job-list-item__job-info-label--posting-date')
    .closest('.job-list-item__job-info-item');
  const postedDate = ($postingDateItem.find('.job-list-item__job-info-value').text() || '').trim() || 'Unknown';

  return {
    title: String(title),
    location: String(location),
    link: String(link),
    postedDate: String(postedDate)
  };
}

Cypress.Commands.add('collectJobs', (allJobs, keywordList, debug = false) => {
  cy.get('div.job-list-item', { timeout: 10000 }).then($jobs => {
    cy.log(`🔍 Found ${$jobs.length} job elements on page`);
    
    // Debug: log first job's HTML structure to find correct selectors
    if (debug && $jobs.length > 0) {
      console.log('=== FIRST JOB HTML ===');
      console.log($jobs.first().html());
      console.log('=== END HTML ===');
    }
    
    $jobs.each((index, job) => {
      const $job = Cypress.$(job);
      const jobInfo = extractJobInfo($job);
      
      cy.log(`DEBUG[${index}]: title="${jobInfo.title}", location="${jobInfo.location}", posted="${jobInfo.postedDate}"`);

      if (
        typeof jobInfo.title === 'string' &&
        jobInfo.title.length > 0 &&
        keywordList.some(k => jobInfo.title.toLowerCase().includes(k.toLowerCase()))
      ) {
        allJobs.push(jobInfo);
        cy.log(`✅ MATCHED: ${jobInfo.title} (${jobInfo.location})`);
      }
    });
    
    cy.log(`📊 Total matched jobs: ${allJobs.length}`);
  });
});

// ✅ Collect ALL visible jobs without keyword filtering (trust site's search filter)
Cypress.Commands.add('collectAllJobs', (allJobs) => {
  cy.get('div.job-list-item', { timeout: 10000 }).then($jobs => {
    cy.log(`🔍 Found ${$jobs.length} job elements on page`);
    
    $jobs.each((index, job) => {
      const $job = Cypress.$(job);
      const jobInfo = extractJobInfo($job);
      
      if (jobInfo.title && jobInfo.title.length > 0) {
        allJobs.push(jobInfo);
      }
    });
    
    cy.log(`📊 Total jobs collected: ${allJobs.length}`);
  });
});

// ✅ Scroll and collect ALL jobs (for keyword searches where site already filtered)
Cypress.Commands.add('scrollAndCollectAllJobs', (allJobs, maxScrolls = 20) => {
  let scrollCount = 0;

  const scrollUntilDone = (previousCount = 0) => {
    if (scrollCount >= maxScrolls) {
      cy.log(`⚠️ Reached max scroll limit (${maxScrolls})`);
      cy.collectAllJobs(allJobs);
      return;
    }
    
    scrollCount++;
    cy.scrollTo('bottom');
    cy.wait(2000);
    
    cy.get('div.job-list-item', { timeout: 10000 }).then($jobs => {
      cy.log(`📜 Scroll ${scrollCount}: Found ${$jobs.length} jobs (was ${previousCount})`);
      
      if ($jobs.length > previousCount) {
        scrollUntilDone($jobs.length);
      } else {
        cy.log(`✅ Finished scrolling - no new jobs loaded`);
        cy.collectAllJobs(allJobs);
      }
    });
  };

  scrollUntilDone();
});
  
  
  // ✅ Handle cookie consent popup
  Cypress.Commands.add('handleCookieConsent', () => {
    cy.wait(1000);
    cy.get('body').then($body => {
      const $btn = $body.find(
        'button.cookie-consent__button.accept, button.accept.app-dialog__footer-button'
      );
      if ($btn.length) {
        cy.wrap($btn.first()).click({ force: true });
        cy.log('✅ Cookie consent popup accepted');
      } else {
        cy.log('⚠️ Cookie popup not found - proceeding');
      }
    });
  });
  
// ✅ Infinite scroll until all jobs are loaded
Cypress.Commands.add('handleInfiniteScroll', (allJobs, keywordList, maxScrolls = 20) => {
  let scrollCount = 0;

  const scrollUntilDone = (previousCount = 0) => {
    if (scrollCount >= maxScrolls) {
      cy.log(`⚠️ Reached max scroll limit (${maxScrolls})`);
      cy.collectJobs(allJobs, keywordList);
      return;
    }
    
    scrollCount++;
    cy.scrollTo('bottom');
    cy.wait(2000);
    
    cy.get('div.job-list-item', { timeout: 10000 }).then($jobs => {
      cy.log(`📜 Scroll ${scrollCount}: Found ${$jobs.length} jobs (was ${previousCount})`);
      
      if ($jobs.length > previousCount) {
        scrollUntilDone($jobs.length);
      } else {
        cy.log(`✅ Finished scrolling - no new jobs loaded`);
        cy.collectJobs(allJobs, keywordList);
      }
    });
  };

  scrollUntilDone();
});
  
  // ✅ Debug logging for intercepted requests
  Cypress.Commands.add('debugIntercept', (alias) => {
    cy.wait(alias).then(interception => {
      cy.log(`📡 Intercepted: ${interception.request.url}`);
    });
  });

  // ✅ Debug: save first job's HTML to file for inspection
  Cypress.Commands.add('debugJobHtml', () => {
    cy.get('div.job-list-item', { timeout: 10000 }).first().then($job => {
      const html = $job.html();
      cy.writeFile('cypress/fixtures/debug-job-html.txt', html);
      cy.log('📝 Saved first job HTML to debug-job-html.txt');
    });
  });

  // ✅ Setup Fanatics careers page visit with job API interception
  Cypress.Commands.add('visitFanaticsCareers', (url = 'https://fa-exki-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/jobs') => {
    cy.intercept('GET', '**/recruitingCEJobRequisitions*').as('getJobs');
    cy.visit(url, {
      timeout: 20000,
      onBeforeLoad: win => win.sessionStorage.clear()
    });
  });