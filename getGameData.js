// require.
const axios = require('axios');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs').promises;
const gameInfo = require('./gameInfo');

/**
 * メイン関数
 */
(async function main() {
    // ゲームデータ取得処理開始
    getGameData(gameInfo.FamicomInfo);
    getGameData(gameInfo.N64Info);
})();

/**
 * ゲームデータ取得処理共通関数
 * 
 * wikiページをテキスト化⇒解析してゲーム一覧を取得する
 * テキスト取得処理は共通処理にできるが、ゲーム一覧取得は 
 * ページによりフォーマットが異なるため、個別で関数を呼び出す。
 */
async function getGameData(gameInfo) {
    // wikiの情報を取得
    const res = await axios.get(gameInfo.wikiUrl);
    const dom = new JSDOM(res.data);
    let tmpTextStr = dom.window.document.getElementById("mw-content-text").textContent;
    const wikiTextLines = tmpTextStr.toString().split('\n');
    let writeFileText = null;

    // wikiのページごとに処理を切り分け
    if ('ファミリーコンピュータ' == gameInfo.consoleType) {
        writeFileText = await getFamicomGameData(gameInfo, wikiTextLines)
    }
    else if('N64' == gameInfo.consoleType){
        writeFileText = await get64GameData(gameInfo, wikiTextLines)
    }

    await fs.writeFile(gameInfo.csvFilePath, writeFileText);
    console.log("End");
}

/**
 * ゲームデータ取得処理(ファミコン)
 */
async function getFamicomGameData(gameInfo, wikiTextLines) {
    let releaseYear = 0;
    let writeFileText = null;

    // 解析したwikiページのテキスト行数分ループ.
    for (var idx = 0; idx < wikiTextLines.length; idx++) {
        
        // 該当行のテキスト取得.
        const text = wikiTextLines[idx];

        if(text.includes('非売品[編集]')){      // 取得が完了したらbreak.
            break;
        }
        else if(/^[0-9]{1,4}年（/.test(text)) { // 年の行を見つけたら変数に年を格納.
            releaseYear = text.match(/[0-9]{1,4}年/)[0]
        }
        else if(/[0-9]{1,2}月[0-9]{1,2}日/.test(text)) {    // 〇月×日を見つけたら、ゲームの情報を抽出.

            // 日付を取得.
            const Date = text.match(/[0-9]{1,2}月[0-9]{1,2}日/)[0];
            // 発売日を生成.
            const releaseDate = releaseYear + Date;
            // ソフト名を取得.
            const softName = wikiTextLines[idx + 1];
            // 発売元を取得.
            const salesCompany = wikiTextLines[idx + 2];
            // UIに表示する画像のURLを取得.
            const imgURL = await getImgURL(softName, gameInfo.consoleTypeforSerach);

            // 進行状況が分かるように一応ログ出し.
            console.log(`${releaseDate}, ${softName}, ${salesCompany}, ${imgURL}, ${gameInfo.consoleType}`);
            
            // csvファイルへ書き出す情報を生成
            if (null === writeFileText) {
                writeFileText = `${releaseDate}, ${softName}, ${salesCompany}, ${imgURL}, ${gameInfo.consoleType}\n`
            }
            else{
                writeFileText += `${releaseDate}, ${softName}, ${salesCompany}, ${imgURL}, ${gameInfo.consoleType}\n`
            }
        }
    }

    console.log("Get Family Computer data End");

    return writeFileText;
}

/**
 * ゲームデータ取得処理(64)
 */
async function get64GameData(gameInfo, wikiTextLines) {
    let releaseYear = 0;
    let writeFileText = null;

    // 解析したwikiページのテキスト行数分ループ.
    for (var idx = 0; idx < wikiTextLines.length; idx++) {

        // 該当行のテキスト取得.
        const text = wikiTextLines[idx];

        if(text.includes('発売中止ソフト（全92タイトル）[編集]')){  // 取得が完了したらbreak.
            break;
        }
        else if(/^[0-9]{1,4}年（/.test(text)) {                 // 年の行を見つけたら変数に年を格納.
            releaseYear = text.match(/[0-9]{1,4}年/)[0]
        }
        else if(/[0-9]{1,2}月[0-9]{1,2}日/.test(text)) {        // 〇月×日を見つけたら、ゲームの情報を抽出.

            // 日付を取得.
            const Date = text.match(/[0-9]{1,2}月[0-9]{1,2}日/)[0];
            // 発売日を生成.
            const releaseDate = releaseYear + Date;
            // ソフト名を取得.
            const softName = text.slice(Date.length + 1, text.search(/（/));
            // 発売元を取得.
            const salesCompany = text.slice(text.search(/（/) + 1, text.search(/）/));
            // UIに表示する画像のURLを取得.
            const imgURL = await getImgURL(softName, gameInfo.consoleTypeforSerach);

            // 進行状況が分かるように一応ログ出し.
            console.log(`${releaseDate}, ${softName}, ${salesCompany}, ${imgURL}, ${gameInfo.consoleType}`);
            

            // csvファイルへ書き出す情報を生成
            if (null === writeFileText) {
                writeFileText = `${releaseDate}, ${softName}, ${salesCompany}, ${imgURL}, ${gameInfo.consoleType}\n`
            }
            else{
                writeFileText += `${releaseDate}, ${softName}, ${salesCompany}, ${imgURL}, ${gameInfo.consoleType}\n`
            }
        }
    }

    console.log("Get N64 data End");

    return writeFileText;
}

// 画像URL取得関数.
async function getImgURL(softName, consoleType){
    softName = softName.replace('\'', '')
    softName = encodeURIComponent(softName)

    const url = `https://search.rakuten.co.jp/search/mall/${softName}+${consoleType}/101205/?s=12`
    const res = await axios.get(url);
    const dom = new JSDOM(res.data);

    let result = null
    try {
        result = dom.window.document.querySelector("._verticallyaligned").getAttribute("src");
    }
    catch(e){
        result = 'NULL'
    }
    return result;
};