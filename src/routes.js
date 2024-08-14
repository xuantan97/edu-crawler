import { Dataset, createPuppeteerRouter } from 'crawlee';
import fs from 'fs';

const path = './crawledUrls.json';


export const router = createPuppeteerRouter();
var crawledUrls = new Set();
if (fs.existsSync(path)) {
    const rawData = fs.readFileSync(path);
    crawledUrls = new Set(JSON.parse(rawData));
}
router.addDefaultHandler(async ({ enqueueLinks, log }) => {
    log.info(`enqueueing new URLs`);


    // await enqueueLinks({
    //     globs: ['https://loigiaihay.com/*'],
    //     label: 'detail',
    //     strategy: 'all'
    // });
    await enqueueLinks({
        urls: ['https://loigiaihay.com/bai-5-on-tap-va-ke-chuyen-trang-22-sgk-tieng-viet-lop-1-tap-1-ket-noi-tri-thuc-voi-cuoc-song-a120852.html', 'https://loigiaihay.com/bai-5-on-tap-va-ke-chuyen-trang-18-sgk-tieng-viet-lop-1-tap-1-chan-troi-sang-tao-a121112.html', 'https://loigiaihay.com/bai-1-a-c-trang-6-sgk-tieng-viet-lop-1-tap-1-canh-dieu-a132756.html'],
        label: 'detail',
    });
});

function getCleanText(htmlString) {
    // Remove all script and style tags and their content
    let cleanText = htmlString.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleanText = cleanText.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove all HTML tags
    cleanText = cleanText.replace(/<\/?[^>]+(>|$)/g, '');
    
    // Replace multiple spaces, tabs, and newlines with a single space
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    // Replace multiple spaces and tabs with a single space
    // cleanText = cleanText.replace(/[ \t]+/g, ' ');
    // cleanText = cleanText.replace(/ {2,}/g, ' ');
    
    // Replace multiple newlines with a single newline
    // cleanText = cleanText.replace(/[\r\n]+/g, '\n');
    
    // Remove block comments (/* */)
    cleanText = cleanText.replace(/\/\*[\s\S]*?\*\//g, '');
    cleanText = cleanText.replace(/var\s+\w+\s*=\s*[^;]*;/g, '');
    cleanText = cleanText.replace(/function\s+\w+\s*\([\s\S]*?\}\s*/g, '');
    
    return cleanText;
}

router.addHandler('detail', async ({ request, page, log }) => {

    log.info(`${title}`, { url: request.loadedUrl });
    const hasListCategories = await page.$('#list-categories') !== null;

    if (!hasListCategories) {
        if (!crawledUrls.has(request.loadedUrl)) {
            crawledUrls.add(request.loadedUrl);
        }
        console.log("Not crawlable");
        return;
    }

    // Select only anchors with class 'show-child2' within the element with id 'list-categories'
    const links = await page.$$eval('#list-categories a.show-child2', anchors =>
        anchors.map(anchor => anchor.href)
    );

    console.log(links);
    for (const link of links) {
        if (!crawledUrls.has(link)) {
            crawledUrls.add(link);
        }
        await page.goto(link);
        let classExists = await page.$$('.top-title');
        let title = await page.title();
        if (classExists.length == 1) {
            let topTitle = classExists[0];


            const nearestDetailNew = await topTitle.evaluateHandle((element) => {
                let currentElement = element;

                while (currentElement) {
                    const nextDetailNew = currentElement.querySelector('.detail_new');
                    if (nextDetailNew) {
                        return nextDetailNew;
                    }
                    currentElement = currentElement.nextElementSibling || currentElement.parentElement;
                }

                return null;
            });
            let data = "";
            if (nearestDetailNew) {
                // Get the text content of the found .detail_new element
                try {

                    const detailNewText = await nearestDetailNew.evaluate(element => element.textContent.trim());
                    data = getCleanText(detailNewText)
                } catch (err) {
                    console.log(err);
                    return;
                }
            } else {
                console.log('No .detail_new element found near the .top-title element.');
            }
            await Dataset.pushData({
                url: request.loadedUrl,
                title,
                text: data,
                is_success: data == "" ? 0 : 1
            });
            fs.writeFileSync(path, JSON.stringify([...crawledUrls]));
        }
    }



});
