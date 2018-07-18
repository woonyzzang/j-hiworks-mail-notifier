var page = require('webpage').create();

page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36';
page.settings.userName = 'seungwoon';
page.settings.password = '$upleat0628';

var _Account = 'office_id=' + page.settings.userName + '&office_passwd=' + page.settings.password;
var URL = {
  login: 'http://webmail.upleat.com/',
  mailbox: 'https://mail.office.hiworks.com/upleat.com/mail/webmail/m_list/b0'
};

page.onConsoleMessage = function(msg) {
  console.log('---------------');
  console.log(msg);
  console.log('---------------');
};

page.onAlert = function(msg) {
  console.log('ALERT: ' + msg);
};

// if (typeof window.callPhantom === 'function') {
//   window.callPhantom({ hello: 'world' });
// }

page.onCallback = function(data) {
  console.log('CALLBACK: ' + JSON.stringify(data));
  // Prints 'CALLBACK: { "hello": "world" }'
};

page.open(URL.login, 'POST', _Account, function(status) {
  // var html = page.content;
  if (status !== 'success') {
    console.log('fail!');
    phantom.exit(1);

    return;
  }

  page.evaluate(function() {
    document.querySelector('#office_id').value = 'seungwoon';
    document.querySelector('#office_passwd').value = '$upleat0628';
    document.querySelector(".int_jogin").click();
  });

  //window.setTimeout(function() {
  window.setInterval(function() {
    page.open(URL.mailbox, function(status) {
      page.evaluate(function() {
        var $tableMailList = document.querySelector('#tableMailList');
        var $firstTblRow = $tableMailList.querySelectorAll('tr')[0];
        var name = $firstTblRow.querySelector('td.name a').childNodes[0].nodeValue;
        var title = $firstTblRow.querySelector('td.title a').childNodes[0].nodeValue;
        var date = $firstTblRow.querySelector('td.date').nodeValue;

        alert(name.trim());
        console.log(title.trim());
      });
    });
  }, 5000); //2500

  // phantom.exit();
});
