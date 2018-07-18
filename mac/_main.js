const phantom = require('phantom');
const cheerio = require('cheerio');

(async function() {
  const instance = await phantom.create();
  const page = await instance.createPage();

  await page.open('http://webmail.upleat.com/');
  await page.property('content').then(function(content) {
    page.evaluate(function() {
      document.querySelector('#office_id').value = 'seungwoon';
      document.querySelector('#office_passwd').value = '$upleat0628';
      document.querySelector(".int_jogin").click();
    });

    setInterval(async function() {
      page.setting('encoding').then(function(value){
        console.log( value = 'utf-8' );
      });

      await page.open('https://mail.office.hiworks.com/upleat.com/mail/webmail/m_list/b0');

      await page.property('content').then(function(content) {
        const $ = cheerio.load(content);

        const $tableMailList = $('#tableMailList');
        const $firstTblRow = $tableMailList.find('tr').eq(0);
        const name = $firstTblRow.find('td.name a').text();
        const title = $firstTblRow.find('td.title a').text();
        const date = $firstTblRow.find('td.date').text();

        console.log('name: ', name.trim());
        console.log('title: ',title.trim());
        console.log('date: ',date.trim());
      });
    }, 5000);
  });
})();
