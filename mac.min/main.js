const electron = require('electron');
const {app, nativeImage, Tray, BrowserWindow, Menu, ipcMain, dialog} = electron;
// const phantomjs = require('phantomjs-prebuilt');
// const webdriverio = require('webdriverio');
const phantom = require('phantom');
const cheerio = require('cheerio');
const os = require('os');
const url = require('url');
const path = require('path');

// =SET env
process.env.NODE_ENV = 'production';

let systemInfo = '';
systemInfo += `Application version: ${app.getVersion()}\n`;
systemInfo += `Computer name: ${os.hostname()}\n`;
systemInfo += `Platform: ${os.platform()}\n`;
systemInfo += `Operating system: ${os.type()} ${os.arch()}\n`;
systemInfo += `Build version: ${os.release()}\n`;
systemInfo += `System architecture: ${os.cpus()[0].model}\n`;
systemInfo += `Physical processor count: ${os.cpus().length}\n`;
systemInfo += `Processor speed: ${os.cpus()[0].speed} MHz`;

global.sharedObject = {
    mailData: {name: '', title: '', date: ''},
    appName: app.getName(),
    appVersion: app.getVersion(),
    systemInfo: systemInfo
};

let mainWindow = null;
let notifierWindow = null;
let systemInfoWindow = null;
let aboutWindow = null;
let force_quit = false;
let mailState = {title: '', count: 0};

app.once('ready', () => {
    //const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        title: app.getName(),
        width: 260,
        height: 280,
        resizable: false,
        icon: path.join(__dirname, 'assets/icons/png/icon.png')
    });

    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, 'public/login.html'),
            protocol: 'file:',
            slashes: true
        })
    );

    //mainWindow.webContents.openDevTools({detach:true});
    mainWindow.setMenu(null);
    // mainWindow.webContents.on('did-finish-load', () => {
    //   mainWindow.webContents.send('person');
    // });

    mainWindow.on('close', (e) => {
        console.log('close');

        if (!force_quit) {
            e.preventDefault();

            if (notifierWindow) { notifierWindow.hide(); }
            if (systemInfoWindow) { systemInfoWindow.hide(); }
            if (aboutWindow) { aboutWindow.hide(); }

            mainWindow.hide();
        }
    });

    mainWindow.on('closed', () => {
        console.log('closed');

        if (notifierWindow) { notifierWindow = null; }
        if (systemInfoWindow) { systemInfoWindow = null; }
        if (aboutWindow) { aboutWindow = null; }

        mainWindow = null;
        app.quit();
    });

    mainWindow.tray = new Tray(path.join(__dirname, 'assets/ico_tary.png'));

    const trayMenu = Menu.buildFromTemplate([
        {
            label: '로그아웃',
            click() {
                force_quit = true;
                app.relaunch();
                app.quit();
            }
        },
        {type: 'separator'},
        {
            label: '시스템 정보 확인...',
            click() {
                createSystemInfoWindow();
            }
        },
        {
            label: '빌드 버전 확인...',
            click() {
                createAboutWindow();
            }
        },
        {type: 'separator'},
        {
            label: '종료',
            click() {
                force_quit = true;
                app.quit();
            }
        }
    ]);

    // mainWindow.tray.setTitle('999+');
    // mainWindow.tray.setToolTip('Hiworks Mail Notifier');
    mainWindow.tray.setContextMenu(trayMenu);
});

function createNotifierWindow(data) {
    if (notifierWindow !== null) { return false; }

    const externalDisplay = electron.screen.getPrimaryDisplay().workAreaSize;

    notifierWindow = new BrowserWindow({
        title: 'Notifier',
        width: 320,
        height: 130,
        //parent: mainWindow,
        x: externalDisplay.width,
        y: 0,
	backgroundColor: '#fff',
        frame: false,
        resizable: false,
        icon: path.join(__dirname, 'assets/icons/png/icon.png')
    });

    //notifierWindow.webContents.openDevTools({detach:true});
    notifierWindow.setMenu(null);
    notifierWindow.setAlwaysOnTop(true);
    notifierWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'public/notifierWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    setTimeout(() => {
        notifierWindow.close();
        global.sharedObject.mailData = {name: '', title: '', date: ''};
    }, 6000);

    notifierWindow.on('close', () => { notifierWindow = null; });
}

function createSystemInfoWindow() {
    if (systemInfoWindow !== null) { return false; }

    systemInfoWindow = new BrowserWindow({
        title: 'System Info',
        width: 460,
        height: 240,
        modal: true,
        //parent: mainWindow,
        resizable: false,
        icon: path.join(__dirname, 'assets/icons/png/icon2.png')
    });

    systemInfoWindow.setMenu(null);
    systemInfoWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'toolmenu/systemInfoWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    systemInfoWindow.on('close', () => { systemInfoWindow = null; });
}

function createAboutWindow() {
    if (aboutWindow !== null) { return false; }

    aboutWindow = new BrowserWindow({
        title: 'About',
        width: 380,
        height: 240,
        modal: true,
        //parent: mainWindow,
        resizable: false,
        icon: path.join(__dirname, 'assets/icons/png/icon2.png')
    });

    aboutWindow.setMenu(null);
    aboutWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'toolmenu/aboutWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    aboutWindow.on('close', () => { aboutWindow = null; });
}

ipcMain.on('login:submit', (e, item) => {
    /*
     * [issue] phantomjs works by spawning an executable, putting your files in an ASAR breaks this spawning technique. You need to add it to asar.unpacked or disable ASAR entirely as you found out :
     * phantomjs는 실행 파일을 생성하여 동작하고 ASAR에 파일을 올리면이 생성 기술이 중단됩니다. asar.unpacked에 추가하거나 ASAR을 완전히 비활성화해야합니다.
     * build 하면 로그인시 phantomjs가 중단 된다. 해결방법은 package.json 파일의 빌드 설정 옵션에서 "asar": false 값 추가
     */

    //http://electron.ebookchain.org/ko-KR/tutorial/using-selenium-and-webdriver.html

    //phantomjs.run().then((program) => {
    (async function() {
        const instance = await phantom.create();
        const page = await instance.createPage();

        // await page.on('onResourceRequested', function(requestData, networkRequest) {
        //   console.info('Requesting', requestData.url);
        // });

        await page.open('https://office.hiworks.com/upleat.com/');
        await page.property('content').then(function() {
            let toInjectVars = item;

            page.evaluate(function(injetedVars) {
                document.querySelector('#office_id').value = injetedVars.uid;
                document.querySelector('#office_passwd').value = injetedVars.upw;
                document.querySelector('.int_jogin').click();
            }, toInjectVars);
        }).then(function() {
            async function mailWatchFn() {
                //console.log( mailState.title );
                await page.open('https://mail.office.hiworks.com/upleat.com/mail/webmail/m_list/b0');
                await page.property('content').then(function(content) {
                    const $ = cheerio.load(content);

                    const $tableMailList = $('#tableMailList');
                    const $tblFirstRow = $tableMailList.find('tr').eq(0);
                    const newCount = $tableMailList.find('td.title.bold').length;
                    const tblName = $tblFirstRow.find('td.name a').text().trim();
                    const tblTitle = $tblFirstRow.find('td.title a').text().trim();
                    const tblDate = $tblFirstRow.find('td.date').text().trim();
                    const tblCnt = $('#spMTotCnt').text();

                    if (mailState.title.length === 0) {
                        mailState.title = tblTitle;
                        mailState.count = tblCnt;
                    }

                    if (mailState.title !== tblTitle) {
                        if (mailState.count < tblCnt) {
                            mailState.title = tblTitle;
                            global.sharedObject.mailData = {name: tblName, title: tblTitle, date: tblDate};
                            createNotifierWindow();
                        }

                        mailState.count = tblCnt;
                    }

                    //console.log('name: ', name.trim());
                    //console.log('title: ',title.trim());
                    //console.log('date: ',date.trim());
                    if (newCount === 0) {
                        mainWindow.tray.setTitle('');
                        mainWindow.tray.setToolTip('새로운 메일이 없습니다.');
                    } else {
                        mainWindow.tray.setTitle(`${newCount}`);
                        mainWindow.tray.setToolTip(`새로운 메일이 ${newCount}개 있습니다.`);
                    }
                });
            }

            setTimeout(async function() {
                await page.open('https://mail.office.hiworks.com/upleat.com/mail/webmail/m_list/b0');
                await page.property('content').then(function(content) {
                    const $ = cheerio.load(content);
                    const $tableMailList = $('#tableMailList');

                    if ($tableMailList.length === 0) {
                        dialog.showErrorBox('로그인 오류', '아이디 또는 비밀번호를 확인해주세요.');
                        mainWindow.webContents.send('login:error');
                    } else {
                        setInterval(mailWatchFn, 5000);
                        mainWindow.webContents.send('login:success', item.uid);
                        mainWindow.hide();
                    }
                });
            }, 5000);
        });
    })();
    //});

    // phantomjs.run('--webdriver=4444').then((program) => {
    //     const wdOpts = {desiredCapabilities: {browserName: 'phantomjs'}};
    //     const options = {
    //         host: 'localhost', // localhost에서 작동중인 크롬 드라이버 서버를 사용합니다.
    //         port: 9515, // 연결할 크롬 드라이버 서버의 포트를 설정합니다.
    //         desiredCapabilities: {
    //             browserName: 'electron',
    //             // chromeOptions: {
    //             //     binary: 'electron', // Electron 바이너리 경로
    //             //     args: [`app=${path.join(__dirname, 'node_modules/electron/dist/')}`]  // 선택 사항, 'app=' + /path/to/your/app/
    //             // }
    //         }
    //     };
    //     const client = webdriverio.remote(wdOpts);
    //
    //     client
    //         .init()
    //         .url('http://webmail.upleat.com/')
    //         .setValue('#office_id', item.uid)
    //         .setValue('#office_passwd', item.upw)
    //         .click('.int_jogin')
    //         .url('https://mail.office.hiworks.com/upleat.com/mail/webmail/m_list/b0')
    //         .getHTML('body')
    //         .then((outerHTML) => {
    //             const $ = cheerio.load(outerHTML);
    //             const $tableMailList = $('#tableMailList');
    //
    //             function mailWatchFn() {
    //                 const $tblFirstRow = $tableMailList.find('tr').eq(0);
    //                 const tblName = $tblFirstRow.find('td.name a').text().trim();
    //                 const tblTitle = $tblFirstRow.find('td.title a').text().trim();
    //                 const tblDate = $tblFirstRow.find('td.date').text().trim();
    //                 const tblCnt = $('#spMTotCnt').text();
    //
    //                 console.log( tblTitle );
    //                 console.log( tblCnt );
    //
    //                 if (mailState.title.length === 0) {
    //                     mailState.title = tblTitle;
    //                     mailState.count = tblCnt;
    //                 }
    //
    //                 if (mailState.title !== tblTitle) {
    //                     if (mailState.count < tblCnt) {
    //                         mailState.title = tblTitle;
    //                         global.sharedObject.mailData = {name: tblName, title: tblTitle, date: tblDate};
    //                         console.log('ok');
    //                         createNotifierWindow();
    //                     }
    //
    //                     mailState.count = tblCnt;
    //                 }
    //             }
    //
    //             if ($tableMailList.length === 0) {
    //                 dialog.showErrorBox('로그인 오류', '아이디 또는 비밀번호를 확인해주세요.');
    //                 mainWindow.webContents.send('login:error');
    //                 program.kill();
    //             } else {
    //                 setInterval(mailWatchFn, 5000);
    //                 mainWindow.webContents.send('login:success', item.uid);
    //                 mainWindow.hide();
    //             }
    //         })
    //         .end();
    //
    //     //program.kill();
    // });
});
