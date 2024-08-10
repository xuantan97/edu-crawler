import { Dataset, createPuppeteerRouter } from 'crawlee';

export const router = createPuppeteerRouter();

router.addDefaultHandler(async ({ enqueueLinks, log }) => {
    log.info(`enqueueing new URLs`);
    await enqueueLinks({
        globs: ['https://loigiaihay.com/bai-1-lien-hop-quoc-sgk-lich-su-12-ket-noi-tri-thuc-a166008.html', 'https://loigiaihay.com/bai-2-trat-tu-the-gioi-trong-chien-tranh-lanh-sgk-lich-su-12-ket-noi-tri-thuc-a166009.html'],
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
    const title = await page.title();
    log.info(`${title}`, { url: request.loadedUrl });
    // Check if the class "top-title" exists
    console.log('hehee1');

    let classExists = await page.$$('.top-title');
    console.log('hehee');
    console.log(classExists.length);
    // let result2 = await Promise.all(classExists.map(async (t) => {
    //     return await t.evaluate(x => x.textContent);
    // }))
    // console.log(result2);
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
        if (nearestDetailNew) {
            // Get the text content of the found .detail_new element
            const detailNewText = await nearestDetailNew.evaluate(element => element.textContent.trim());
            console.log(getCleanText(detailNewText));
        } else {
            console.log('No .detail_new element found near the .top-title element.');
        }
    }
    await Dataset.pushData({
        url: request.loadedUrl,
        title,
    });
});
